import {BluetoothTerminal} from '../utils/BluetoothTerminal.mjs'
import {EventType} from '../utils/events.mjs'

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
		this._tcvr.bind(EventType.reverse, RemoddleBluetooth.id, event => this.reverse = event.value)
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

	set reverse(value) {
		this._send('R' + (value ? '1' : '0'))
	}

	_send(data) {
		this._port && this._port.send(data) && console.debug(`Remoddle sent: ${data}`)
	}

	_evaluate(cmd) {
		if (!this._tcvr) return
		
		for (let i = 0; i < cmd.length; i++) {
			this._tcvr.remoddleCommand(cmd[i])
		}
	}

}

export {RemoddleBluetooth}
