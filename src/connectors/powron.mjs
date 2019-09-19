const cmdByState = state => (state && 'H') || 'L'
const startSeq = '$OM4AA#'
const PowronPins = Object.freeze({pin2: 0, pin3: 1, pin4: 2, pin5: 3, 
	pin6: 4, pin7: 5, pin8: 6, pin9: 7, pin10: 8,
	pinA0: 0, pinA1: 1, pinA2: 2, pinA3: 3, pinA4: 4, pinA5: 5,
	pinA6: 6, pinA7: 7
})
const devFilters = [
	{ 'vendorId': 0x2341, 'productId': 0x8036 },
	{ 'vendorId': 0x2341, 'productId': 0x8037 },
]

class PowronConnector {
	constructor({keyerPin = PowronPins.pin5, pttPin = PowronPins.pin6, powerPins = [PowronPins.pin2, PowronPins.pin4], 
		serialBaudRate = 4800}) 
	{
    this._encoder = new TextEncoder()
    this._decoder = new TextDecoder()
		this._timeout = 600
		this._keyerPin = keyerPin
		this._pttPin = pttPin
		this.powerPins = powerPins
		this._serialBaudRate = serialBaudRate
		this._interfaceNumber = 2;  // original interface number of WebUSB Arduino demo
    this._endpointIn = 5;       // original in endpoint ID of WebUSB Arduino demo
		this._endpointOut = 4;      // original out endpoint ID of WebUSB Arduino demo
	}

  connect(tcvr, kredence, options) {
    if (!navigator.usb) {
      throw new Error('POWRON: WebUSB is not supported!')
    }
    // this.requestPort()
    return new Promise(async (resolve, reject) => {
			try {
				this.device = await navigator.usb.requestDevice({ 'filters': devFilters })
				// .then(device => {
   	 	 	console.debug(`POWRON device: ${this.device.productName} (${this.device.manufacturerName})`)
				await this._open()
				// .then(port => {
				console.log('POWRON Connected ' + this.device.productName)
				// this._bindCommands(tcvr, port)
				setTimeout(() => {
					this.send(startSeq)
					this._serialBaudRate && setTimeout(() => this.serial(this._serialBaudRate), 1000)
				}, 3000)
				resolve(this.device)
			} catch (error) {
				reject(error)
			}
		}, error => console.log('POWRON Connection error: ' + error))
  }

  get connected() {
    return true
  }

  _open() {
    const readLoop = () => {
      this.device.transferIn(this._endpointIn, 64).then(result => {
        this.onReceive(this.decoder.decode(result.data))
        readLoop()
      }, error => this.onReceiveError(error))
    }
    return this.device.open()
      .then(() => {
        if (this.device.configuration === null) {
          return this.device.selectConfiguration(1)
        }
			})
			.then(() => {
				const configurationInterfaces = this.device.configuration.interfaces
				configurationInterfaces.forEach(element => {
					element.alternates.forEach(elementalt => {
						if (elementalt.interfaceClass == 0xff) {
							this._interfaceNumber = element.interfaceNumber
							elementalt.endpoints.forEach(elementendpoint => {
								if (elementendpoint.direction == "out") {
									this._endpointOut = elementendpoint.endpointNumber
								}
								if (elementendpoint.direction == "in") {
									this._endpointIn = elementendpoint.endpointNumber
								}
							})
						}
					})
				})				
			})
      .then(() => this.device.claimInterface(this._interfaceNumber))
			.then(() => this.device.selectAlternateInterface(this._interfaceNumber, 0))
      .then(() => this.device.controlTransferOut({
        'requestType': 'class',
        'recipient': 'interface',
        'request': 0x22,
        'value': 0x01,
        'index': this._interfaceNumber
      }))
      .then(() => readLoop())
  }

  filter(bandWidth, centerFreq) {
  }

  checkState(kredence) {
    return new Promise((resolve) => resolve({id: this.id})) // emulate online state
  }

  disconnect() {
    return this.device && this.device.controlTransferOut({
      'requestType': 'class',
      'recipient': 'interface',
      'request': 0x22,
      'value': 0x00,
      'index': this._interfaceNumber
    })
      .then(() => this.device.close())
  }

  send(data) {
		//console.debug(`POWRON <= ${data.trim()}`)
		return this.device && this.device.transferOut(this._endpointOut, this._encoder.encode(data + '\n'))
  }

  onReceive(data) {
    console.debug('POWRON rcvd:', this._decoder.decode(data))
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

export {PowronConnector, PowronPins}
