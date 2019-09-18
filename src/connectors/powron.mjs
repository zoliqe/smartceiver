const cmdByState = state => (state && 'H') || 'L'
const startSeq = '$OM4AA#'
const PowronPins = Object.freeze({pin2: 0, pin3: 1, pin4: 2, pin5: 3, 
	pin6: 4, pin7: 5, pin8: 6, pin9: 7, pin10: 8,
	pinA0: 0, pinA1: 1, pinA2: 2, pinA3: 3, pinA4: 4, pinA5: 5,
	pinA6: 6, pinA7: 7
})

class PowronConnector {
	constructor({keyerPin = PowronPins.pin5, pttPin = PowronPins.pin6, serialBaudRate = 4800}) {
    this._encoder = new TextEncoder()
    this._decoder = new TextDecoder()
    this._port = null
		this._timeout = 600
		this._keyerPin = keyerPin
		this._pttPin = pttPin
		this._serialBaudRate = serialBaudRate
		this.connect()
	}

  async connect() {
	  console.debug('powron connect request')
    if (!serial || !navigator.usb) {
      throw new Error('powron: WebUSB is not supported!')
    }

	this._port && this.disconnect()
	
	console.debug('getting serial.getPorts()')
    const ports = await serial.getPorts()
    console.debug(`powron getPorts(): ${JSON.stringify(ports)}`)
    if (ports.length == 1) {
      this._port = ports[0]
    } else if (ports.length > 1) {
      this._port = await serial.requestPort();
    } else {
      this._port = await serial.requestPort(); // TODO stop connection process, use button to connect
    }

    return new Promise((resolve, reject) => this._connectPort(resolve, reject))
  }

  async _connectPort(resolve, reject) {
    if (!this._port) {
      reject('port is null')
      return
    }
    console.debug(`powron device: ${this._port.device_.productName} (${this._port.device_.manufacturerName})`)

    try {
      await this._port.connect()
      console.info('powron connected :-)')

			setTimeout(() => {
				this.send(startSeq)
				this._serialBaudRate && setTimeout(() => this.serial(this._serialBaudRate), 1000)
			}, 3000)
	} catch (error) {
      reject(error)
      return
    }
    this._port.onReceive = data => console.debug('powron rcvd:', this._decoder.decode(data))
    this._port.onReceiveError = error => this.onReceiveError(error)
    resolve(this)
  }

  onReceiveError(error) {
    console.error('powron error:', error)
  }

  disconnect() {
    this._port && this._port.disconnect()
    this._port = null
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

	send(data, callback) {
		//console.debug(`POWRON <= ${data.trim()}`)
    this._port && this._port.send(this._encoder.encode(data + '\n')) && console.debug(`powron sent: ${data}`)
	}
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
