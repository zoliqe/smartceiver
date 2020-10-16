/* eslint-disable class-methods-use-this */
import { delay } from '../utils/time.js'
import { Powron, Pins } from './extensions/powron.js'

// not supported by navigator
const devFilters = [
	{ usbVendorId: 0x2341, usbProductId: 0x8036 },
	{ usbVendorId: 0x2341, usbProductId: 0x8037 },
	{ usbVendorId: 0x1A86, usbProductId: 0x7523 },
]
const encoder = new TextEncoder()
const decoder = new TextDecoder()

class PowronConnector {

	#device
	
	#powron
	
	#reader

	#devopts = {
		baudRate: 4800,
//     dataBits: 8,
//     stopBits: 1,
//     parity: 'none',
//     flowControl: 'none'
	}

	constructor(tcvrAdapter, {options, keyerConfig}) {
		this.#powron = new Powron(tcvrAdapter, async (cmd) => this._send(cmd), {options, keyerConfig})
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
			this.#device = await navigator.serial.requestPort({filters: devFilters})
			console.debug(`POWRON device: ${JSON.stringify(this.#device)}, options: ${JSON.stringify(this.#devopts)}`)
			await this.#device.open(this.#devopts)
			console.info('POWRON Connected')
			window.powronDevice = this.#device
			this._readLoop()
			await this.#powron.init()
		} catch (error) {
			console.error('POWRON Connection error:', error)
			throw error
		}
		return this
	}
	
	async _readLoop() {
		while (this.#device.readable) {
			this.#reader = this.#device.readable.getReader()
// 			console.debug('reader get')
			while (true) {
				let value, done
				try {
					// eslint-disable-next-line no-await-in-loop
					({value, done} = await this.#reader.read())
				} catch (e) {
					this.#powron.onReceiveError(e)
					break;
				}
// 				console.debug('POWRON RAW:', value)
				value && this.#powron.onReceive(decoder.decode(value))
				if (done) break
			}
// 			console.debug('reader releaseLock')
			this.#reader.releaseLock()
			this.#reader = null
		}
	}

	async disconnect() {
		if (!this.#device) return

		await delay(1000) // for poweroff signals 
		if (this.#reader)
			await this.#reader.cancel()
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
		return this.#powron.tcvrProps
	}

	get tcvrDefaults() {
		return this.#powron.tcvrDefaults
	}

	async _send(data) {
		console.debug(`POWRON <= ${data} `)
		if (this.connected && this.#device.writable) {
			const writer = this.#device.writable.getWriter() // get WritableStreamDefaultWriter
			await writer.ready // wait while stream locked
			const bytes = typeof data === 'string' ? encoder.encode(`${data}\n`) : data
			await writer.write(bytes)
			writer.releaseLock()
			return true
		}
		console.error(`POWRON: data not sent ${data}`)
		return false
	}

	get signals() {
		return this.#powron.signals
	}

}


export {PowronConnector, Pins as PowronPins}
