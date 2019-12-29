/* eslint-disable no-unused-expressions */
/* eslint-disable class-methods-use-this */
import {BluetoothTerminal} from '../utils/BluetoothTerminal.mjs'
import {SignalsBinder} from '../utils/signals.mjs'
import {delay} from '../utils/time.mjs'
import {TcvrController} from '../controller.mjs'
import { RemoddleMapper } from './remoddle/mapper.mjs'

class RemoddleBluetooth {
	constructor(tcvr) {
		this._port = null
		const ctlr = new TcvrController(this.id)
		ctlr.attachTo(tcvr)
		this._tcvr = new RemoddleMapper(ctlr)
		this._bindSignals(tcvr)
	}

	get id() { return 'remoddle' }

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
		this._port.receive = data => this._evaluate(data)
		resolve(this)
	}

	async disconnect() {
		if (!this._port) return
		this.signals.out.unbind()
		this._port.disconnect()
		this._port = null
		await delay(1000)
	}

	_bindSignals(tcvr) {
		this.signals = new SignalsBinder(this.id, {
			wpm: value => {this.wpm = value},
			reverse: value => {this.reverse = value},
		})
		this.signals.out.bind(tcvr)
	}

	set wpm(value) {
		this._send(`S${value}`)
	}

	set sidetone(value) {
		this._send(`T${value}`)
	}

	set reverse(value) {
		this._send(`R${value ? '1' : '0'}`)
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
