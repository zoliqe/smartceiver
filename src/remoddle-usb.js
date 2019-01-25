class RemoddleUsb {
  constructor(tcvr) {
    this._encoder = new TextEncoder()
    this._decoder = new TextDecoder()
    this._port = null
    this._tcvr = tcvr
  }

  static get id() { return 'remoddle' }

  async connect() {
    if (!serial || !navigator.usb) {
      throw new Error('Remoddle: WebUSB is not supported!')
    }

    const ports = await serial.getPorts()
    console.debug(`Remoddle getPorts(): ${JSON.stringify(ports)}`)
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
    console.debug(`Remoddle device: ${this._port.device_.productName} (${this._port.device_.manufacturerName})`)

    try {
      await this._port.connect()
      console.info('Remoddle connected :-)')
      this._tcvr.bind(EventType.wpm, RemoddleBluetooth.id, event => this.wpm = event.value)
    } catch (error) {
      reject(error)
      return
    }
    this._port.onReceive = data => this._evaluate(data)
    this._port.onReceiveError = error => this.onReceiveError(error)
    resolve(this)
  }

  onReceiveError(error) {
    console.error(`Remoddle: ${error}`)
  }

  disconnect() {
    this._port && this._port.disconnect()
    this._port = null
  }

  set wpm(value) {
    this._send('S' + value)
  }

  set sidetone(value) {
    this._send('T' + value)
  }

  _send(data) {
    this._port && this._port.send(this._encoder.encode(data + '\n')) && console.debug(`Remoddle sent: ${data}`)
  }

  _evaluate(data) {
    if (!this._tcvr) return
    
    const cmd = this._decoder.decode(data)
    for (let i = 0; i < cmd.length; i++) {
      let element = cmd[i]
      if (element === '-') {
        // console.log('remoddle: -')
        this._tcvr.fire(new TcvrEvent(EventType.keyDah, 1))    
      } else if (element === '.') {
        // console.log('remoddle: .')
        this._tcvr.fire(new TcvrEvent(EventType.keyDit, 1))   
      } else if (element === '_') {
        this._tcvr.fire(new TcvrEvent(EventType.keySpace, 1))
      } else if (element === '>') {
        this._tcvr.fire(new TcvrEvent(EventType.up, 1))
      } else if (element === '<') {
        this._tcvr.fire(new TcvrEvent(EventType.down, 1))
      } else if (element === '!') {
        this._tcvr.fire(new TcvrEvent(EventType.button, 0))
      } else {
        console.debug(`Remoddle rcvd: ${cmd}`)
      }
    }
  }

}

