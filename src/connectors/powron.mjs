import {delay} from '../utils/time.mjs'

const cmdByState = state => (state && 'H') || 'L'
const startSeq = '$OM4AA#'
const startSeqDelay = 3000
// const serialBaudRate = 4800
const serialInitDelay = 1000
const PowronPins = Object.freeze({pin2: 0, pin3: 1, pin4: 2, pin5: 3,
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

	#timeout = 600
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

	constructor(adapterProvider, {keyerPin = PowronPins.pin5, pttPins = [PowronPins.pin6],
		powerPins = [PowronPins.pin2, PowronPins.pin4]}, keyerConfig = {pttTimeout = 5000})
	{
		this.#keyerPin = keyerPin
		this.#pttPins = pttPins || []
		this.#powerPins = powerPins || []
		this.#adapter = adapterProvider()
		this.#powr = new PowrManager(this)

		this.keyerState(true)
		this.pttState(false)
		this.#keyer = new Keyer(this, keyerPin, keyerConfig)
	}

  connect(tcvr, _, options) {
    if (!navigator.usb) {
      throw new Error('POWRON: WebUSB is not supported!')
    }
    // this.requestPort()
    return new Promise(async (resolve, reject) => {
			try {
				this.#device = await navigator.usb.requestDevice({ 'filters': devFilters })
				// .then(device => {
   	 	 	console.debug(`POWRON device: ${this.#device.productName} (${this.#device.manufacturerName})`)
				await this._open()
				// .then(port => {
				console.log('POWRON Connected ' + this.#device.productName)
				// this._bindCommands(tcvr, port)
				await delay(startSeqDelay)
				this.send(startSeq)
				await delay(serialInitDelay)
				this.serial(this.#adapter.baudrate)
				// setTimeout(() => {
				// 	this.send(startSeq)
				// 	setTimeout(() => this.serial(serialBaudRate), 1000)
				// }, 3000)
				resolve(this.#device)
			} catch (error) {
				reject(error)
			}
		}, error => console.log('POWRON Connection error: ' + error))
  }

  get connected() {
    return this.#device != null
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
      .then(() => readLoop())
  }

  filter(bandWidth, centerFreq) {
  }

  checkState() {
    return new Promise((resolve) => resolve({id: this.id})) // emulate online state
  }

  async disconnect() {
		if (!this.#device) return

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

	async on() {
		await this.#powr.on()
		this.#adapter.init && (await this.#adapter.init(this.serialData))
	}

	async holdOn() {
		await this.#powr.on()
	}

	async off() {
		this.#adapter.close && this.#adapter.close()
		// this.#adapter = null
		await this.#powr.off()
	}

  async send(data) {
		//console.debug(`POWRON <= ${data.trim()}`)
		if (this.connected) {
			await this.#device.transferOut(this.#endpointOut, encoder.encode(data + '\n'))
			return true
		} else {
			console.error(`POWRON: data not sent ${data}`)
			return false
		}
  }

  onReceive(data) {
    console.debug('POWRON rcvd:', decoder.decode(data))
  }

  onReceiveError(error) {
    console.error('POWRON error:', error)
  }

	// async connect() {
	//   console.debug('powron connect request')
  //   if (!serial || !navigator.usb) {
  //     throw new Error('powron: WebUSB is not supported!')
  //   }

	// this._port && this.disconnect()

	// console.debug('getting serial.getPorts()')
  //   const ports = await serial.getPorts()
  //   console.debug(`powron getPorts(): ${JSON.stringify(ports)}`)
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
  //   console.debug(`powron device: ${this._port.device_.productName} (${this._port.device_.manufacturerName})`)

  //   try {
  //     await this._port.connect()
  //     console.info('powron connected :-)')

	// 		setTimeout(() => {
	// 			this.send(startSeq)
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

	get timeout() {
		return this.#timeout
	}

	set timeout(value) {
		this.#timeout = Number(value)
		this.send('T' + this.#timeout)
	}

	async pinState(pin, state) {
		if (pin != null && pins.includes(pin))
			await this.send(cmdByState(state) + pin)
		else
			console.error(`POWRON pinState: pin ${pin} not known`)
	}

	async keyerState(state) {
		if (this.#keyerPin) {
			await this.pinState(this.#keyerPin, false)
			await this.send(`K${state ? this.#keyerPin : 0}`)
		}
	}

	async keyerCW(cmd) {
		await this.send(cmd)
	}

	async keyerSpeed(wpm) {
		await this.send('S' + wpm)
	}

	async pttState(state) {
		await this.#pttPins
			.forEach(async (pin) => await this.pinState(pin, state))
	}

	async serial(baudrate) {
		if (baudrate >= 1200 && baudrate <= 115200)
			await this.send(`P${baudrate / 100}`)
		else
			console.error(`POWRON: serial baudrate=${baudrate} not in range, value not set`)
	}

	async serialData(data) {
		return data != null && (await this.send('>' + data))
	}

	// send(data, callback) {
	// 	//console.debug(`POWRON <= ${data.trim()}`)
  //   this._port && this._port.send(this._encoder.encode(data + '\n')) && console.debug(`powron sent: ${data}`)
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
			this.send(startSeq)
			this._serialBaudRate && setTimeout(() => this.serial(this._serialBaudRate), 1000)
		}, 5000)
}

	get timeout() {
		return this._timeout
	}

	set timeout(value) {
		this._timeout = Number(value)
		this.send(`T${this._timeout}`)
	}

	get keyerPin() {
		return this._keyerPin
	}

	pinState(pin, state) {
		this.send(cmdByState(state) + pin)
	}

	keyerState(state) {
		if (this._keyerPin && Object.values(PowronPins).includes(this._keyerPin)) {
			this.pinState(this._keyerPin, false)
			this.send(`K${state ? this._keyerPin : 0}`)
		}
	}

	keyerCW(cmd) {
		this.send(cmd)
	}

	keyerSpeed(wpm) {
		this.send('S' + wpm)
	}

	pttState(state) {
		this._pttPin && this.pinState(this._pttPin, state)
	}

	serial(baudrate) {
		this.send(`P${baudrate / 100}`)
	}

	serialData(data) {
		this.send('>' + data)
	}

	send(data) {
		this._socket.emit('powron', data)
	}
}*/

const hwWatchdogTimeout = 120 // sec
const State = {on: 'active', starting: 'starting', off: null, stoping: 'stoping'}
class PowrManager {

	#state = State.off

	constructor(connector) {
		this.connector = connector
	}

	async on() {
		if (this.#state === State.stoping || this.#state === State.starting) {
			console.warn(`Remotig in progress state ${this.#state}, ignoring start`)
			return
		}

		if (this.#state === State.off) { // cold start
			console.info(`powerOn`)
			this.connector.timeout = hwWatchdogTimeout
		}

		this.#state = State.starting
		await this._managePowr(true)
		this.#state = State.on
	}

	async off() {
		if (this.#state === State.off || this.#state === State.stoping) return;

		this.#state = State.stoping
		console.info(`powerOff`)
		await this._managePowr(false)
		await delay(500)
		await this._managePowr(false)
		await delay(1000)

		this.#state = State.off
		// logout()
	}

	async _managePowr(state) {
		await this.connector.powerPins.forEach(async (pin) => await this.connector.pinState(pin, state))
	}

}

class Keyer {

	#wpm = 0
	#pttTimeout
	#pttTimer
	#keyTimer

	constructor(connector, keyerPin, {pttTimeout}) {
		this.#wpm = 0
		this.#pttTimeout = pttTimeout
		this._cw = async (s) => await connector.keyerCW(s)
		this._speed = async (v) => await connector.keyerSpeed(v)
		this._key = async (state) =>
			keyerPin != null && (await connector.pinState(keyerPin, state))
		this._ptt = async (state) => await connector.pttState(state)
	}

	async send(msg) {
		if (this.disabled) return
		await this._cw(msg)
	}

	async ptt(state, timeout = this.#pttTimeout) {
		if (state) {
			if (!timeout) return; // disable PTT

			if (this.#pttTimer != null) clearTimeout(this.#pttTimer)
			await this._ptt(true) // this resets powron ptt watchdog counter
			this.#pttTimer = setTimeout(async () => {
				this.#pttTimer = null
				await this._ptt(false)
			}, timeout)
		} else {
			await this._ptt(false)
			this.#pttTimer != null && clearTimeout(this.#pttTimer)
			this.#pttTimer = null
		}
	}

	async key(state, timeout = this.#pttTimeout) {
		if (state) {
			if (!timeout) return;

			if (this.#keyTimer != null) clearTimeout(this.#keyTimer)
			await this._key(true) // reset powron watchdog timer
			this.#keyTimer = setTimeout(async () => {
				this.#keyTimer = null
				await this._key(false)
			}, timeout)
		} else {
			await this._key(false)
			this.#keyTimer != null && clearTimeout(this.#keyTimer)
			this.#keyTimer = null
		}
	}

	get wpm() {
		return this.#wpm
	}

	set wpm(value) {
		this.#wpm = Number(value)
		if (this.disabled) return // check after setting value, to allow disable/enable keyer
		this._speed(this.#wpm)
	}

	get disabled() {
		return this.#wpm < 1
	}

}

export {PowronConnector, PowronPins}