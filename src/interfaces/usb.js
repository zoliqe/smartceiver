const _encoder = new TextEncoder()
const _decoder = new TextDecoder()

export class USBInterface {

	_interfaceNumber = 2  // original interface number of WebUSB Arduino demo
	_endpointIn = 5       // original in endpoint ID of WebUSB Arduino demo
	_endpointOut = 4      // original out endpoint ID of WebUSB Arduino demo

	constructor(deviceFilters = [
			{ 'vendorId': 0x2341, 'productId': 0x8036 }, 
			{ 'vendorId': 0x2341, 'productId': 0x8037 },
			{ 'vendorId': 0x2886, 'productId': 0x802F }, // Seeed XIAO M0
		], 
		receiveSeparator = '\n', sendSeparator = '\n') 
	{
		this._deviceFilters = deviceFilters
		this._receiveSeparator = receiveSeparator
		this._sendSeparator = sendSeparator
		// this._sendSeparator = _encoder.encode(sendSeparator)
		this._receiveBuffer = ''
	}

	get name() {
		return 'USB'
	}

	async connect() {
		if (!navigator.usb) {
			throw new Error('unsupported')
		}

		const paired = await navigator.usb.getDevices()
		if (paired.length === 1) {
			[this._device] = paired
		} else {
			this._device = await navigator.usb.requestDevice({ 'filters': this._deviceFilters })
		}
		await this._open()
		return this
  }

  _open() {
    return this._device.open()
      .then(() => {
        if (this._device.configuration === null) {
          return this._device.selectConfiguration(1)
        }
			})
			.then(() => {
				const configurationInterfaces = this._device.configuration.interfaces
				configurationInterfaces.forEach(element => {
					element.alternates.forEach(elementalt => {
						if (elementalt.interfaceClass === 0xff) {
							this._interfaceNumber = element.interfaceNumber
							elementalt.endpoints.forEach(elementendpoint => {
								if (elementendpoint.direction === "out") {
									this._endpointOut = elementendpoint.endpointNumber
								}
								if (elementendpoint.direction === "in") {
									this._endpointIn = elementendpoint.endpointNumber
								}
							})
						}
					})
				})
			})
      .then(() => this._device.claimInterface(this._interfaceNumber))
			.then(() => this._device.selectAlternateInterface(this._interfaceNumber, 0))
      .then(() => this._device.controlTransferOut({
        'requestType': 'class',
        'recipient': 'interface',
        'request': 0x22,
        'value': 0x01,
        'index': this._interfaceNumber
      }))
      .then(() => this._readLoop())
  }

	_readLoop() {
	  this._device.transferIn(this._endpointIn, 64).then(result => {
	    this._handleReceived(_decoder.decode(result.data))
	    this._readLoop()
	  }, error => this.receiveError(error))
	}

	async disconnect() {
		if (!this._device) return

		await this._device.controlTransferOut({
			'requestType': 'class',
			'recipient': 'interface',
			'request': 0x22,
			'value': 0x00,
			'index': this._interfaceNumber
		})
		await this._device.close()
		this._device = null
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
		console.error('USBTerminal receive error:', error)
	}
	
	getDeviceName() {
		return `${this._device.productName} (${this._device.manufacturerName})`
	}

	async send(data) {
		if (this._device) {
			const bytes = typeof data === 'string' ? _encoder.encode(`${data}${this._sendSeparator}`) : data
			await this._device.transferOut(this._endpointOut, bytes)
			return true
		} 
		return false
	}
}
