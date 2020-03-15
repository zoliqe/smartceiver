/* eslint-disable no-await-in-loop */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
import { delay } from '../../utils/time.js'
import {SignalsBinder} from '../../utils/signals.js'
import { Keyer } from './keyer.js'
import { PowrSwitch } from './powrsw.js'

const cmdByState = state => (state && 'H') || 'L'
const startSeq = '$OM4AA#'
const startSeqDelay = 3000
const serialInitDelay = 1000
const Pins = Object.freeze({
	pin2: 0, pin3: 1, pin4: 2, pin5: 3,
	pin6: 4, pin7: 5, pin8: 6, pin9: 7, pin10: 8,
	pinA0: 0, pinA1: 1, pinA2: 2, pinA3: 3, pinA4: 4, pinA5: 5,
	pinA6: 6, pinA7: 7
})

class Powron {

	#powerPins
	
	#pttPins
	
	#keyerPin
	
	#adapter
	
	#powr
	
	#keyer
	
	#signals

	#timeout

	constructor(tcvrAdapter, send, {
		options = {
			keyerPin: Pins.pin5, pttPins: [Pins.pin6],
			powerPins: [Pins.pin2, Pins.pin4], 
			powerTimeout: 30
		},
		keyerConfig = { 
			pttTimeout: 5000, 
			ditCoef: 120, dahCoef: 120, elementSpaceCoef: 60, letterSpaceCoef: 60, }}) 
	{
		this._send = async (data) => send(data)
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
		console.debug('POWRON rcvd:', data)
	}

	onReceiveError(error) {
		console.error('POWRON error:', error)
	}
	
	async on() {
		console.debug('POWRON: poweron')
		await this.#powr.on()
		this.#adapter.init && (await this.#adapter.init(async (data) => this.serialData(data)))
	}

	async off() {
		console.debug('POWRON: poweroff')
		this.#adapter.close && (await this.#adapter.close())
		await this.#powr.off()
	}

	async init() {
		await delay(startSeqDelay)
		this._send(startSeq)
		await delay(serialInitDelay)
		await this._initPwrSwitch()
		await this._initSerial()
		await this._initKeyer()
	}

	async _initSerial() {
		if (this.#adapter.baudrate >= 1200 && this.#adapter.baudrate <= 115200)
			await this._send(`P${ this.#adapter.baudrate / 100 }`)
		else
			console.error(`POWRON: serial baudrate = ${this.#adapter.baudrate} not in range, value not set`)
	}

	async _initPwrSwitch() {
		await this._send(`T${this.#powr.watchdogTimeout > 0 ? this.#powr.watchdogTimeout + 30 : 0}`)
	}

	async _initKeyer() {
		if (!this.#keyerPin || !Object.values(Pins).includes(this.#keyerPin)) {
			console.info('POWRON: Disabling keyer')
			await this._send('K0')
			return
		}
		console.info('POWRON: Enabling keyer on pin', this.#keyerPin)
		await this._send(`K${this.#keyerPin}`)
		await this._send(`D${this.#keyer.coefs.dit}`) // ditCoef
		await this._send(`A${this.#keyer.coefs.dah}`) // dahCoef
		await this._send(`E${this.#keyer.coefs.elementSpace}`)  // elementSpaceCoef
		await this._send(`C${this.#keyer.coefs.letterSpace}`)  // letterSpaceCoef
	}

	async pinState(pin, state) {
		if (Array.isArray(pin)) {
			for (const p of pin) await this.pinState(p, state)
			return
		}
		if (pin != null && Object.values(Pins).includes(pin))
			await this._send(cmdByState(state) + pin)
		else
			console.error(`POWRON pinState: pin ${ pin } not known`)
	}

	_initSignals() {
		this.#signals = new SignalsBinder(this.id, {
			keyDit: async () => this.#keyer.send('.'),
			keyDah: async () => this.#keyer.send('-'),
			keySpace: async () => this.#keyer.send('_'),
			wpm: async (value) => {
				this.#keyer.setwpm(value);
				this.#adapter.wpm(value);
			},
			keyMsg: async (value) => this.#adapter.keymsg(value),
			ptt: async (value) => {
				this.#adapter.ptt(value)
				this.#keyer.ptt(value)
			},
			mode: async (value) => this.#adapter.mode(value),
			filter: async (value) => this.#adapter.filter(value),
			gain: async (value) => this.#adapter.gain(value),
			agc: async (value) => this.#adapter.agc(value),
			freq: async (value) => this.#adapter.frequency(value),
			split: async (value) => this.#adapter.split(value),
			rit: async (value) => this.#adapter.rit(value),
			xit: async (value) => this.#adapter.xit(value),
			keepAlive: async () => this.#powr.resetWatchdog(),
			pwrsw: async (value) => value ? this._on() : this._off(),
		})
	}

	get signals() {
		return this.#signals
	}
}

export {Powron, Pins}
