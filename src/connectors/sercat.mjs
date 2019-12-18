import { delay } from '../utils/time.mjs'
import {SignalsBinder} from '../utils/signals.mjs'
import { Keyer } from './extensions/keyer.mjs'

const devFilters = [
	{ 'vendorId': 0x2341, 'productId': 0x8036 },
	{ 'vendorId': 0x2341, 'productId': 0x8037 },
]
const encoder = new TextEncoder()
const decoder = new TextDecoder()

class SercatConnector {

	#device
	#reader
	#adapter
	#keyer
	#signals
	#devopts = {
		baudrate: 4800,
    databits: 8,
    parity: 'none',
    stopbits: 1,
    rtscts: false
	}

	constructor(tcvrAdapter) {
		this.#adapter = tcvrAdapter
		this.#devopts.baudrate = this.#adapter.baudrate
		// this.#keyer = new Keyer({
		// 	send: async (cmd) => await this._send('K' + cmd),
		// 	speed: async (wpm) => await this._send('KS' + String(wpm).padStart(3, '0')),
		// 	state: () => false, // TODO
		// 	key: async (state) => false, // TODO
		// 	ptt: async (state) => false // TODO
		// }, {})

		this._initSignals()
	}

	static get id() {
		return 'sercat'
	}

	async connect() {
		if (!navigator.serial) {
			alert('Serial not supported. Cannot connect to transceiver.')
			throw new Error('SERCAT: WebSerial is not supported!')
		}
		try {
			this.#device = await navigator.serial.requestPort({})
			console.debug(`SERCAT device: ${this.#device.productName} (${this.#device.manufacturerName})`)
			await this.#device.open(this.#devopts)
			console.info('SERCAT Connected ' + this.#device.productName)
			await this._on()
			this._readLoop()
		} catch (error) {
			console.error('SERCAT Connection error: ' + error)
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

		await this._off()
		if (this.#reader)
			this.#reader.cancel()
		await this.#device.close()
		this.#device = null
	}

	async _on() {
		this.#adapter.init && (await this.#adapter.init(this._send))
	}

	async _keepAlive() {
	}

	async _off() {
		this.#adapter.close && this.#adapter.close()
	}

	get connected() {
		return this.#device != null
	}

	async checkState() {
		return {id: this.id} //this.connected ? {id: this.id} : null
	}
	
	get tcvrProps() {
		return this.#adapter.properties
	}

	get tcvrDefaults() {
		return this.#adapter.defaults
	}

	async _send(data) {
		console.debug(`SERCAT <= ${ data.trim() } `)
		if (this.connected && this.#device.writable) {
			const writer = this.#device.writable.getWriter()
			writer.write(encoder.encode(data))
			writer.releaseLock()
			return true
		} else {
			console.error(`SERCAT: data not sent ${ data } `)
			return false
		}
	}

	onReceive(data) {
		console.debug('SERCAT rcvd:', decoder.decode(data))
	}

	onReceiveError(error) {
		console.error('SERCAT error:', error)
	}
	
	_initSignals() {
		this.#signals = new SignalsBinder(this.constructor.id, {
			// keyDit: async () => await this.#keyer.send('.'),
			// keyDah: async () => await this.#keyer.send('-'),
			// keySpace: async () => await this.#keyer.send('_'),
			// wpm: async (value) => await this.#keyer.wpm(value),
			// ptt: async (value) => await this.#keyer.ptt(value),
			mode: async (value) => await this.#adapter.mode(value),
			filter: async (value) => await this.#adapter.filter(value),
			gain: async (value) => await this.#adapter.gain(value),
			agc: async (value) => await this.#adapter.agc(value),
			freq: async (value) => await this.#adapter.freqency(value),
			split: async (value) => await this.#adapter.split(value),
			rit: async (value) => await this.#adapter.rit(value),
			xit: async (value) => await this.#adapter.xit(value),
		})
	}

	get signals() {
		return this.#signals
	}
}


export {SercatConnector}
