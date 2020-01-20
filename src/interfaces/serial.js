/* eslint-disable class-methods-use-this */

// const devFilters = [
// 	{ 'vendorId': 0x2341, 'productId': 0x8036 },
// 	{ 'vendorId': 0x2341, 'productId': 0x8037 },
// ]
const _encoder = new TextEncoder()
const _decoder = new TextDecoder()

export class SerialInterface {
	_devopts = {
		baudrate: 4800,
    databits: 8,
    parity: 'none',
    stopbits: 1,
    rtscts: false
	}

	constructor(baudrate = 4800, receiveSeparator = '\n', sendSeparator = '\n') {
		this._devopts.baudrate = baudrate
		this._receiveSeparator = receiveSeparator
		this._sendSeparator = _encoder.encode(sendSeparator)
		this._receiveBuffer = ''
	}

	get name() {
		return 'Serial'
	}

	async connect() {
		if (!navigator.serial) {
			throw new Error('unsupported')
		}

		this._device = await navigator.serial.requestPort({})
		await this._device.open(this._devopts)
		this._readLoop() // do not await
		return this
	}
	
	async _readLoop() {
		while (this._device.readable) {
			try {
				this._reader = this._device.readable.getReader()
				while (true) {
					const {value, done} = await this._reader.read()
					this._handleReceived(_decoder.decode(value))
					if (done) break
				}
				this._reader = null
			} catch (e) {
				this.onReceiveError(e)
			}
		}
	}

	async disconnect() {
		if (!this._device) return

		if (this._reader)
			this._reader.cancel()
		await this._device.close()
		this._device = null
	}

	getDeviceName() {
		return `${this._device.productName} (${ this._device.manufacturerName })`
	}

	_handleReceived(data) {
		for (const c of data) {
			if (c === this._receiveSeparator) {
				const cmd = this._receiveBuffer.trim()
				this._receiveBuffer = ''
				if (cmd)
					this.receive(cmd)
			} else {
				this._receiveBuffer += c
			}
		}
	}

	receive(data) {
		// callback
	}

	receiveError(error) {
		console.error('SerialTerminal receive error:', error)
	}
	
	async send(data) {
		if (this._device && this._device.writable) {
			const writer = this._device.writable.getWriter()
			const bytes = typeof data === 'string' ? _encoder.encode(data) : data
			writer.write(bytes)
			writer.write(this._sendSeparator)
			writer.releaseLock()
			return true
		}
		return false
	}
}