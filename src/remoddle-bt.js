class RemoddleBluetooth {
	constructor(tcvr) {
		this._port = null
		this._tcvr = tcvr
	}

	static get id() { return 'remoddle' }

	async connect() {
		if (!BluetoothTerminal || !navigator.bluetooth) {
			throw new Error('Remoddle: WebBluetooth is not supported!')
		}

		this._port = new BluetoothTerminal()

		return new Promise((resolve, reject) => this._connectPort(resolve, reject))
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
		console.info(`Remoddle device ${this._port.getDeviceName()} connected :-)`)
		this._tcvr.bind(EventType.wpm, RemoddleBluetooth.id, event => this.wpm = event.value)
		this._port.receive = data => this._evaluate(data)
		resolve(this)
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
		this._port && this._port.send(data) && console.debug(`Remoddle sent: ${data}`)
	}

	_evaluate(cmd) {
		if (!this._tcvr) return
		
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
				this._tcvr.fire(new TcvrEvent(EventType.mainUp, 1))
			} else if (element === '<') {
				this._tcvr.fire(new TcvrEvent(EventType.mainDown, 1))
			} else if (element === '!') {
				this._tcvr.fire(new TcvrEvent(EventType.mainButton, 1))
			} else if (element === ']') {
				this._tcvr.fire(new TcvrEvent(EventType.subUp, 1))
			} else if (element === '[') {
				this._tcvr.fire(new TcvrEvent(EventType.subDown, 1))
			} else if (element === '~') {
				this._tcvr.fire(new TcvrEvent(EventType.subButton, 1))
			} else {
				console.debug(`Remoddle rcvd: ${cmd}`)
			}
		}
	}

}

