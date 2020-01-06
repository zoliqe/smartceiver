/* eslint-disable no-await-in-loop */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
import { delay } from '../utils/time.js'
import {SignalsBinder} from '../utils/signals.js'
import { Keyer } from './extensions/keyer.js'
import { PowrSwitch } from './extensions/powrsw.js'

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
			state: async (state) => this._pinState(this.#powerPins, state),
			timeout: this.#timeout
		})
		this.#keyer = new Keyer({
			send: async (cmd) => this._send(cmd),
			speed: async (wpm) => this._send(`S${wpm}`),
			state: () => this.#keyerPin != null,
			key: async (state) => this._pinState(this.#keyerPin, state),
			ptt: async (state) => this._pinState(this.#pttPins, state)
		}, keyerConfig)

		this._initSignals()
	}

	get id() {
		return 'usbpowron'
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
			await this._serialBaudrate(this.#adapter.baudrate)
		} catch (error) {
			console.error('POWRON Connection error: ' + error)
			throw error
		}
		return this
  }

  _open() {
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
						if (elementalt.interfaceClass === 0xff) {
							this.#interfaceNumber = element.interfaceNumber
							elementalt.endpoints.forEach(elementendpoint => {
								if (elementendpoint.direction === "out") {
									this.#endpointOut = elementendpoint.endpointNumber
								}
								if (elementendpoint.direction === "in") {
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
      // .then(() => this._readLoop())
  }

	_readLoop() {
	  this.#device.transferIn(this.#endpointIn, 64).then(result => {
	    this.onReceive(result.data)
	    this._readLoop()
	  }, error => this.onReceiveError(error))
	}

	async disconnect() {
		if (!this.#device) return

		await delay(400) // for poweroff signals 
		// await this._off()
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

	get connected() {
		return this.#device != null
	}

	async checkState() {
		// TODO maybe check present device by navigator.usb.getDevices()?
		return {id: this.id} // this.connected ? {id: this.id} : null
	}
	
	get tcvrProps() {
		return this.#adapter.properties
	}

	get tcvrDefaults() {
		return this.#adapter.defaults
	}

	async serialData(data) {
		return data != null && this._send(`>${data}`)
	}

	onReceive(data) {
		console.debug('POWRON rcvd:', decoder.decode(data))
	}

	onReceiveError(error) {
		console.error('POWRON error:', error)
	}
	
	async _on() {
		console.debug('POWRON: poweron')
		await this.#powr.on()
		this.#adapter.init && (await this.#adapter.init(async (data) => this.serialData(data)))
	}

	async _keepAlive() {
		await this.#powr.resetWatchdog()
	}

	async _off() {
		console.debug('POWRON: poweroff')
		this.#adapter.close && (await this.#adapter.close())
		await this.#powr.off()
	}

	async _serialBaudrate(baudrate) {
		if (baudrate >= 1200 && baudrate <= 115200)
			await this._send(`P${ baudrate / 100 }`)
		else
			console.error(`POWRON: serial baudrate = ${baudrate} not in range, value not set`)
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
			const bytes = typeof data === 'string' ? encoder.encode(`${data}\n`) : data
			await this.#device.transferOut(this.#endpointOut, bytes)
			return true
		} 
		console.error(`POWRON: data not sent ${ data }`)
		return false
	}

	_initSignals() {
		this.#signals = new SignalsBinder(this.id, {
			keyDit: async () => this.#keyer.send('.'),
			keyDah: async () => this.#keyer.send('-'),
			keySpace: async () => this.#keyer.send('_'),
			wpm: async (value) => this.#keyer.setwpm(value),
			ptt: async (value) => this.#keyer.ptt(value),
			mode: async (value) => this.#adapter.mode(value),
			filter: async (value) => this.#adapter.filter(value),
			gain: async (value) => this.#adapter.gain(value),
			agc: async (value) => this.#adapter.agc(value),
			freq: async (value) => this.#adapter.frequency(value),
			split: async (value) => this.#adapter.split(value),
			rit: async (value) => this.#adapter.rit(value),
			xit: async (value) => this.#adapter.xit(value),
			keepAlive: async () => this._keepAlive(),
			pwrsw: async (value) => value ? this._on() : this._off(),
		})
	}

	get signals() {
		return this.#signals
	}
}

export {PowronConnector, PowronPins}
