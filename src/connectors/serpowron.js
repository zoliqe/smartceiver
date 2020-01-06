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

	#device
	
	#powerPins
	
	#pttPins
	
	#keyerPin
	
	#adapter
	
	#powr
	
	#keyer
	
	#signals

	#timeout

	#reader

	#devopts = {
		baudrate: 4800,
    databits: 8,
    parity: 'none',
    stopbits: 1,
    rtscts: false
	}

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
		this.#devopts.baudrate = this.#adapter.baudrate
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
		return 'serpowron'
	}

	async connect() {
		if (!navigator.serial) {
			window.alert('Serial not supported. Cannot connect to transceiver.')
			throw new Error('POWRON: WebSerial is not supported!')
		}
		try {
			this.#device = await navigator.serial.requestPort({})
			console.debug(`POWRON device: ${this.#device.productName} (${this.#device.manufacturerName})`)
			await this.#device.open(this.#devopts)
			console.info('POWRON Connected', this.#device.productName)
			await delay(startSeqDelay)
			this._send(startSeq)
			await delay(serialInitDelay)
			// this._send('?')
			await this._powerTimeout(this.#timeout)
			await this._serialBaudrate(this.#adapter.baudrate)
			// this._readLoop()
		} catch (error) {
			console.error('POWRON Connection error:', error)
			throw error
		}
		return this
	}
	
	async _readLoop() {
		while (this.#device.readable) {
			try {
				this.#reader = this.#device.readable.getReader()
				while (true) {
					const {value, done} = await this.#reader.read()
					this.onReceive(value)
					if (done) break
				}
				this.#reader = null
			} catch (e) {
				this.onReceiveError(e)
			}
		}
	}

	async disconnect() {
		if (!this.#device) return

		await delay(400) // for poweroff signals 
		// await this._off()
		if (this.#reader)
			this.#reader.cancel()
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
		await this.#powr.on()
		this.#adapter.init && (await this.#adapter.init(async (data) => this.serialData(data)))
	}

	async _keepAlive() {
		await this.#powr.resetWatchdog()
	}

	async _off() {
		this.#adapter.close && (await this.#adapter.close())
		await this.#powr.off()
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
		if (this.connected && this.#device.writable) {
			const writer = this.#device.writable.getWriter()
			const bytes = typeof data === 'string' ? encoder.encode(`${data}\n`) : data
			writer.write(bytes)
			writer.releaseLock()
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
