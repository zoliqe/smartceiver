/* eslint-disable no-unused-expressions */
/* eslint-disable class-methods-use-this */
import {SignalsBinder} from 'https://zoliqe.github.io/hamium/src/signals.js'
import {delay} from 'https://zoliqe.github.io/hamium/src/utils.js'
import {TcvrController} from 'https://zoliqe.github.io/hamium/src/controller.js'
import { RemoddleMapper } from './remoddle/mapper.js'
import { TcvrEmulator } from './remoddle/tcvremu.js'
import { BufferedWriter } from 'https://zoliqe.github.io/hamium/src/connectors/bufwriter.js'
import { ditLength, dahLength, elementSpaceLength, letterSpaceLength,
			   ditLengthMs, dahLengthMs, elementSpaceLengthMs, letterSpaceLengthMs } from 'https://zoliqe.github.io/hamium/src/connectors/remotig/keyer.js'

const _serialBaudrate = 115200

export class RemoddleController {

	#writer = null
	#heartbeatTimer
	#bluetooth = false

	constructor(tcvr, params) {
		this._iface = (params || '').trim().toLowerCase()
		this._port = null
		const ctlr = new TcvrController(this.id)
		ctlr.attachTo(tcvr)
		this._tcvr = new RemoddleMapper(ctlr)
		this._tcvr.onEncFncChange = (enc, fncId) => this.onEncFncChange(enc, fncId)
		this._emu = new TcvrEmulator(ctlr, data => this._send(data))
		this._bindSignals(tcvr)
	}

	get id() { return 'remoddle' }

	onEncFncChange(enc, fncId) {
		// handle encoder function change
	}

	async connect() {
		this._port = await this._resolveInterface()
		console.debug(`Remoddle resolved iface: ${this._port.name}`)
		return new Promise((resolve, reject) => this._connectPort(resolve, reject))
	}

	async _resolveInterface() {
		if (this._iface === 'auto') {
			this._iface = navigator.appVersion.indexOf('Win') === -1 ? 'usb' : 'serial'
		}
		if (this._iface === 'bt') {
			this.#writer = new BufferedWriter(async (data) => {this._port && (await this._port.send(data))} )
			this.#bluetooth = true
			const module = await import('https://zoliqe.github.io/hamium/src/interfaces/bluetooth.js')
			return new module.BluetoothInterface()
		}
		if (this._iface === 'serial') {
			const module = await import('https://zoliqe.github.io/hamium/src/interfaces/serial.js')
			return new module.SerialInterface(_serialBaudrate)
		}
		const module = await import('https://zoliqe.github.io/hamium/src/interfaces/usb.js')
		return new module.USBInterface()
	}

	async _connectPort(resolve, reject) {
		try {
			await this._port.connect()
		} catch (error) {
			if (error === 'unsupported') {
				window.alert(`${this._port.name} interface not supported.\nCannot connect remoddle / paddle.`)
			}
			reject(`Remoddle connect error: ${error}`)
			return
		}
		console.info(`Remoddle device ${this._port.getDeviceName()} connected :-)`)
		this._port.receive = data => this._evaluate(data)

		await delay(1000)
		this.#enableHeartbeat()
		resolve(this)
	}

	async disconnect() {
		this.#heartbeatTimer && clearInterval(this.#heartbeatTimer)
		this.#heartbeatTimer = null
		if (!this._port) return
		this.signals.out.unbind()
		this._port.disconnect()
		this._port = null
		await delay(1000)
	}

	#enableHeartbeat() {
		// this.#heartbeatTimer = setInterval(_ => this._send(''), 30000); // not required? (check for bluetooth)
	}

	_bindSignals(tcvr) {
		this.signals = new SignalsBinder(this.id, {
			wpm: value => {this.wpm = value},
			reverse: value => {this.reverse = value},
		})
		this.signals.out.bind(tcvr)
	}

	set wpm(value) {
		if (this.#bluetooth) {
			const dit = ditLengthMs(value).toString().padStart(3, '0')
			const dah = dahLengthMs(value).toString().padStart(3, '0')
			const elementSpace = elementSpaceLengthMs(value).toString().padStart(3, '0')
			const letterSpace = letterSpaceLengthMs(value).toString().padStart(3, '0')
			this._send(`K${dit}${dah}${elementSpace}${letterSpace}`)
			return;
		}
		this._send(`S${value}`)
		this._send(`A${dahLength(value)}`)
		this._send(`I${ditLength(value)}`)
		this._send(`E${elementSpaceLength(value)}`)
		this._send(`C${letterSpaceLength(value)}`)
	}

	set sidetone(value) {
		this._send(`T${value}`)
	}

	set reverse(value) {
		this._send(`R${value ? '1' : '0'}`)
	}

	async _send(data) {
		if (!this._port) return
		if (this.#writer) {
			if (this.#bluetooth) {
				// repeat commands for bluetooth connection - hack for BLE implementation in arduino-pico which skips some commands
				await this.#writer.write(data)
				if (!data.startsWith('$')) {
					await this.#writer.write(data)
					await this.#writer.write(data)
					await this.#writer.write(data)
				}
			}
		} else {
			await this._port.send(data)
		}
		console.debug(`Remoddle sent: ${data}`)
	}

	_evaluate(cmd) {
		if (!this._port || cmd == null) return

		if (cmd && cmd.startsWith(this._emu.startSeq))
			this._emu.handleCatCommand(cmd)
		else for (let i = 0; i < cmd.length; i += 1)
			this.mapper.remoddleCommand(cmd[i])
	}

	get mapper() {
		return this._tcvr
	}
}
