class Remoddle {
  constructor(tcvr) {
    this._encoder = new TextEncoder()
    this._decoder = new TextDecoder()
    this._port
    this._tcvr = tcvr
  }

  static get id() { return 'remoddle' }

  async connect() {
    return new Promise((resolve, reject) => {
      if (serial && navigator.usb) {
        const ports = await serial.getPorts()
        if (ports.length == 0) {
          try {
            this._port = await serial.requestPort();
          } catch (error) {
            reject(`Remoddle: ${error}`)
            return
          }
        } else {
          this._port = ports[0]
        }
        this._connectPort(resolve, reject)
      }
    })
    // navigator.usb && navigator.usb.requestDevice({ 'filters': this._filters })
    //   .then(device => new RemoddlePort(device))
    //   .then(selectedPort => {
    //     console.log('Connecting to ' + selectedPort._device.productName)
    //     selectedPort.connect().then(() => {
    //       console.log('Connected ' + JSON.stringify(selectedPort))
    //       selectedPort.onReceive = data => this._evaluate(data)
    //       selectedPort.onReceiveError = error => console.log('Receive error: ' + error)
    //       this._port = selectedPort
    //       if (this._port && this._tcvr) {
    //         this._tcvr.bind(EventType.wpm, this.constructor.id, event => this._port.send("S" + event.value + "\r\n"))
    //         successCallback(this)
    //       }
    //     }, error => {
    //       console.log('Connection error (2): ' + error)
    //     })
    //   }).catch(error => {
    //     console.error('Connection error (1): ' + error)
    //   })
  }

  async _connectPort(resolve, reject) {
    if (!this._port) {
      reject('Remoddle: port is null')
      return
    }

    try {
      await this._port.connect()
    } catch (error) {
      reject(`Remoddle: ${error}`)
      return
    }
    this._port.onReceive = data => this._evaluate(data)
    this._port.onReceiveError = error => this.onReceiveError(error)
    resolve(this)
  }

  onReceiveError = error => console.error(`Remoddle: ${error}`)

  disconnect() {
    this._port && this._port.disconnect()
    this._port = null
  }

  set wpm(value) {
    this._send('KS0' + value + ';')
  }

  _send(data) {
    this._port && this._port.send(this._encoder.encode(data))
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
      }
    }
  }

}

// class RemoddlePort {
//   constructor(device) {
//     this._device = device;
//     this._encoder = new TextEncoder()
//     this._decoder = new TextDecoder()
//   }

//   connect() {
//     let readLoop = () => {
//       this._device.transferIn(5, 64).then(result => {
//         this.onReceive(this._decoder.decode(result.data))
//         readLoop()
//       }, error => {
//         this.onReceiveError(error)
//       })
//     }

//     return this._device.open()
//       .then(() => {
//         if (this._device.configuration === null) {
//           return this._device.selectConfiguration(1)
//         }
//       })
//       .then(() => this._device.claimInterface(2))
//       .then(() => this._device.controlTransferOut({
//         'requestType': 'class',
//         'recipient': 'interface',
//         'request': 0x22,
//         'value': 0x01,
//         'index': 0x02
//       }))
//       .then(() => readLoop())
//   }

//   disconnect() {
//     return this._device.controlTransferOut({
//       'requestType': 'class',
//       'recipient': 'interface',
//       'request': 0x22,
//       'value': 0x00,
//       'index': 0x02
//     })
//       .then(() => this._device.close())
//   }

//   send(data) {
//     return this._device.transferOut(4, this._encoder.encode(data))
//   }
// }

