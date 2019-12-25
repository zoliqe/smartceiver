import { delay } from '../utils/time.mjs'
import {SignalsBinder} from '../utils/signals.mjs'
import { Keyer } from './extensions/keyer.mjs'
import { PowrSwitch } from './extensions/powrsw.mjs'

const cmdByState = state => (state && 'H') || 'L'
const startSeq = '$OM4AA#'
const startSeqDelay = 3000
// const serialBaudRate = 4800
const serialInitDelay = 1000
const PowronPins = Object.freeze({
	pin2: 0, pin3: 1, pin4: 2, pin5: 3,
	pin6: 4, pin7: 5, pin8: 6, pin9: 7, pin10: 8,
	pinA0: 0, pinA1: 1, pinA2: 2, pinA3: 3, pinA4: 4, pinA5: 5,
	pinA6: 6, pinA7: 7
})
const pins = Object.values(PowronPins)
const devFilters = [
	{ 'vendorId': 0x2341, 'productId': 0x8036 },
	{ 'vendorId': 0x2341, 'productId': 0x8037 },
]
const encoder = new TextEncoder()
const decoder = new TextDecoder()

class PowronConnector {

	#interfaceNumber = 2  // original interface number of WebUSB Arduino demo
	
	#endpointIn = 5       // original in endpoint ID of WebUSB Arduino demo
	
	#endpointOut = 4      // original out endpoint ID of WebUSB Arduino demo
	
	#device
	
	#powerPins
	
	#pttPins
	
	#keyerPin
	
	#adapter
	
	#powr
	
	#keyer
	
	#signals

	#timeout

	constructor(tcvrAdapter, {
		options = {
			keyerPin: PowronPins.pin5, pttPins: [PowronPins.pin6],
			powerPins: [PowronPins.pin2, PowronPins.pin4], 
			powerTimeout: 30
		},
		keyerConfig = { pttTimeout: 5000 }}) 
	{
		const opts = options || {}
		this.#keyerPin = opts.keyerPin
		this.#pttPins = opts.pttPins || []
		this.#powerPins = opts.powerPins || []
		this.#timeout = opts.powerTimeout || 0
		// this.keyerState(true)
		// this.pttState(false)

		this.#adapter = tcvrAdapter
		this.#powr = new PowrSwitch({
			state: async (state) => await this._pinState(this.#powerPins, state),
			timeout: this.#timeout
		})
		this.#keyer = new Keyer({
			send: async (cmd) => await this._send(cmd),
			speed: async (wpm) => await this._send('S' + wpm),
			state: () => this.#keyerPin != null,
			key: async (state) => await this._pinState(this.#keyerPin, state),
			ptt: async (state) => await this._pinState(this.#pttPins, state)
		}, keyerConfig)

		this._initSignals()
	}

	static get id() {
		return 'powron'
	}

	async connect() {
		if (!navigator.usb) {
			alert('USB not supported. Cannot connect to transceiver.')
			throw new Error('POWRON: WebUSB is not supported!')
		}
		try {
			const paired = await navigator.usb.getDevices()
			if (paired.length === 1) {
				[this.#device] = paired
			} else {
				this.#device = await navigator.usb.requestDevice({ 'filters': devFilters })
			}
			// .then(device => {
			console.debug(`POWRON device: ${this.#device.productName} (${this.#device.manufacturerName})`)
			await this._open()
			// .then(port => {
			console.info('POWRON Connected ' + this.#device.productName)
			// this._bindCommands(tcvr, port)
			await delay(startSeqDelay)
			this._send(startSeq)
			await delay(serialInitDelay)
			await this._powerTimeout(this.#timeout)
			this._serialBaudrate(this.#adapter.baudrate)
			// setTimeout(() => {
			// 	this._send(startSeq)
			// 	setTimeout(() => this.serial(serialBaudRate), 1000)
			// }, 3000)
			await this._on()
		} catch (error) {
			console.error('POWRON Connection error: ' + error)
			throw error
		}
		return this
  }

  _open() {
    const readLoop = () => {
      this.#device.transferIn(this.#endpointIn, 64).then(result => {
        this.onReceive(result.data)
        readLoop()
      }, error => this.onReceiveError(error))
    }
    return this.#device.open()
      .then(() => {
        if (this.#device.configuration === null) {
          return this.#device.selectConfiguration(1)
        }
			})
			.then(() => {
				const configurationInterfaces = this.#device.configuration.interfaces
				configurationInterfaces.forEach(element => {
					element.alternates.forEach(elementalt => {
						if (elementalt.interfaceClass == 0xff) {
							this.#interfaceNumber = element.interfaceNumber
							elementalt.endpoints.forEach(elementendpoint => {
								if (elementendpoint.direction == "out") {
									this.#endpointOut = elementendpoint.endpointNumber
								}
								if (elementendpoint.direction == "in") {
									this.#endpointIn = elementendpoint.endpointNumber
								}
							})
						}
					})
				})
			})
      .then(() => this.#device.claimInterface(this.#interfaceNumber))
			.then(() => this.#device.selectAlternateInterface(this.#interfaceNumber, 0))
      .then(() => this.#device.controlTransferOut({
        'requestType': 'class',
        'recipient': 'interface',
        'request': 0x22,
        'value': 0x01,
        'index': this.#interfaceNumber
      }))
      // .then(() => readLoop())
  }

	async disconnect() {
		if (!this.#device) return

		await this._off()
		await delay(2000)
		await this.#device.controlTransferOut({
			'requestType': 'class',
			'recipient': 'interface',
			'request': 0x22,
			'value': 0x00,
			'index': this.#interfaceNumber
		})
		await this.#device.close()
		this.#device = null
	}

	async _on() {
		await this.#powr.on()
		this.#adapter.init && (await this.#adapter.init(async (data) => await this.serialData(data)))
	}

	async _keepAlive() {
		await this.#powr.resetWatchdog()
	}

	async _off() {
		this.#adapter.close && (await this.#adapter.close())
		await this.#powr.off()
	}

	get connected() {
		return this.#device != null
	}

	async checkState() {
		// TODO maybe check present device by navigator.usb.getDevices()?
		return {id: this.id} //this.connected ? {id: this.id} : null
	}
	
	get tcvrProps() {
		return this.#adapter.properties
	}

	get tcvrDefaults() {
		return this.#adapter.defaults
	}

	async serialData(data) {
		return data != null && (await this._send('>' + data))
	}

	async _serialBaudrate(baudrate) {
		if (baudrate >= 1200 && baudrate <= 115200)
			await this._send(`P${ baudrate / 100 } `)
		else
			console.error(`POWRON: serial baudrate = ${ baudrate } not in range, value not set`)
	}

	async _powerTimeout(timeout) {
		await this._send(`T${timeout > 0 ? timeout + 30 : 0}`)
	}

	async _keyerPin(pin) {
		if (pin != null && pins.includes(pin)) {
			console.info('POWRON: Enabling keyer on pin', pin)
			this.#keyerPin = pin
			await this._pinState(pin, false)
			await this._send(`K${ pin } `)
		} else {
			console.info('POWRON: Disabling keyer on pin', this.#keyerPin)
			await this._pinState(this.#keyerPin, false)
			await this._send('K0')
			this.#keyerPin = null
		}
	}

	async _pinState(pin, state) {
		if (Array.isArray(pin)) {
			for (const p of pin) await this._pinState(p, state)
			return
		}
		if (pin != null && pins.includes(pin))
			await this._send(cmdByState(state) + pin)
		else
			console.error(`POWRON pinState: pin ${ pin } not known`)
	}

	async _send(data) {
		console.debug(`POWRON <= ${data} `)
		if (this.connected) {
			const bytes = typeof data === 'string' ? encoder.encode(data + '\n') : data
			await this.#device.transferOut(this.#endpointOut, bytes)
			return true
		} else {
			console.error(`POWRON: data not sent ${ data } `)
			return false
		}
	}

	onReceive(data) {
		console.debug('POWRON rcvd:', decoder.decode(data))
	}

	onReceiveError(error) {
		console.error('POWRON error:', error)
	}
	
	_initSignals() {
		this.#signals = new SignalsBinder(this.constructor.id, {
			keyDit: async () => await this.#keyer.send('.'),
			keyDah: async () => await this.#keyer.send('-'),
			keySpace: async () => await this.#keyer.send('_'),
			wpm: async (value) => await this.#keyer.setwpm(value),
			ptt: async (value) => await this.#keyer.ptt(value),
			mode: async (value) => await this.#adapter.mode(value),
			filter: async (value) => await this.#adapter.filter(value),
			gain: async (value) => await this.#adapter.gain(value),
			agc: async (value) => await this.#adapter.agc(value),
			freq: async (value) => await this.#adapter.frequency(value),
			split: async (value) => await this.#adapter.split(value),
			rit: async (value) => await this.#adapter.rit(value),
			xit: async (value) => await this.#adapter.xit(value),
			keepAlive: async () => {await this._keepAlive()}
		})
	}

	get signals() {
		return this.#signals
	}

	// async connect() {
	//   console.debug('powron connect request')
  //   if (!serial || !navigator.usb) {
  //     throw new Error('powron: WebUSB is not supported!')
  //   }

	// this._port && this.disconnect()

	// console.debug('getting serial.getPorts()')
  //   const ports = await serial.getPorts()
  //   console.debug(`powron getPorts(): ${ JSON.stringify(ports) } `)
  //   if (ports.length == 1) {
  //     this._port = ports[0]
  //   } else if (ports.length > 1) {
  //     this._port = await serial.requestPort();
  //   } else {
  //     this._port = await serial.requestPort(); // TODO stop connection process, use button to connect
  //   }

  //   return new Promise((resolve, reject) => this._connectPort(resolve, reject))
  // }

  // async _connectPort(resolve, reject) {
  //   if (!this._port) {
  //     reject('port is null')
  //     return
  //   }
  //   console.debug(`powron device: ${ this._port.device_.productName } (${ this._port.device_.manufacturerName })`)

  //   try {
  //     await this._port.connect()
  //     console.info('powron connected :-)')

	// 		setTimeout(() => {
	// 			this._send(startSeq)
	// 			this._serialBaudRate && setTimeout(() => this.serial(this._serialBaudRate), 1000)
	// 		}, 3000)
	// } catch (error) {
  //     reject(error)
  //     return
  //   }
  //   this._port.onReceive = data => console.debug('powron rcvd:', this._decoder.decode(data))
  //   this._port.onReceiveError = error => this.onReceiveError(error)
  //   resolve(this)
  // }

	// _send(data, callback) {
	// 	//console.debug(`POWRON <= ${ data.trim() } `)
  //   this._port && this._port._send(this._encoder.encode(data + '\n')) && console.debug(`powron sent: ${ data } `)
	// }
}

// device: '/dev/ttyUSB0', //'/dev/ttyS0','/dev/ttyAMA0','COM14'
/*class PowronSocket {
	constructor(socket, options = {device, keyerPin, pttPin, serialBaudRate}) {
		this._socket = socket
		this._socket.emit('openpowron', {device: options.device})
		this._timeout = 600
		this._keyerPin = options.keyerPin
		this._pttPin = options.pttPin
		this._serialBaudRate = options.serialBaudRate
		setTimeout(() => {
			this._send(startSeq)
			this._serialBaudRate && setTimeout(() => this.serial(this._serialBaudRate), 1000)
		}, 5000)
}

	get timeout() {
		return this._timeout
	}

	set timeout(value) {
		this._timeout = Number(value)
		this._send(`T${ this._timeout } `)
	}

	get keyerPin() {
		return this._keyerPin
	}

	_pinState(pin, state) {
		this._send(cmdByState(state) + pin)
	}

	keyerState(state) {
		if (this._keyerPin && Object.values(PowronPins).includes(this._keyerPin)) {
			this._pinState(this._keyerPin, false)
			this._send(`K${ state ? this._keyerPin : 0 } `)
		}
	}

	keyerCW(cmd) {
		this._send(cmd)
	}

	keyerSpeed(wpm) {
		this._send('S' + wpm)
	}

	pttState(state) {
		this._pttPin && this._pinState(this._pttPin, state)
	}

	serial(baudrate) {
		this._send(`P${ baudrate / 100 } `)
	}

	serialData(data) {
		this._send('>' + data)
	}

	_send(data) {
		this._socket.emit('powron', data)
	}
}*/


export {PowronConnector, PowronPins}
