/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
import { delay } from '../utils/time.js'
import { Powron, Pins } from './extensions/powron.js'
import { BluetoothInterface } from '../interfaces/bluetooth.js'
import { SignalsBinder } from '../utils/signals.js'

// Sky is blue and your CAT is looking for another mouse...

class PowronConnector {
	#iface

	#powron

	constructor(tcvrAdapter, { options, keyerConfig }) {
		if (!BluetoothInterface || !navigator.bluetooth) {
			window.alert('Bluetooth connection supported. Cannot connect to transceiver.')
			throw new Error('BLUEPOWRON: WebBluetooth is not supported!')
		}

		this.#iface = new BluetoothInterface()
		this.#iface.receive = this.onReceive
		this.#iface.receiveError = this.onReceiveError
		this.#powron = new Powron(tcvrAdapter,
			async (cmd) => this._send(cmd),
			{ options, keyerConfig })
	}

	get id() {
		return 'bluepowron'
	}

	async connect() {
		try {
			await this.#iface.connect()
			await this.#powron.init()
		} catch (error) {
			console.error('BLUECAT: Connection error', error)
			throw error
		}
		console.info(`BLUECAT device ${this.#iface.getDeviceName()} connected :-)`)
		// await this._on()
		// this.#iface.receive = data => this.onReceive(data)

		return this
	}

	async disconnect() {
		// await this._off()
		await delay(1000) // for poweroff signals TODO
		this.#iface && this.#iface.disconnect()
	}

	async _send(data) {
		if (this.#iface) {
			// TODO send data using buffered writer
			await this.#iface.send(data)
			console.debug(`BLUEPOWRON sent: ${data}`)
		}
	}

	get connected() {
		return this.#iface.getDeviceName()
	}

	async checkState() {
		// TODO maybe check present device by navigator.usb.getDevices()?
		return { id: this.id } // this.connected ? {id: this.id} : null
	}

	// async _on() {
	// 	this.#adapter.init && (await this.#adapter.init(async (data) => this._send(data)))
	// }

	// async _keepAlive() {
	// 	// do nothing
	// }

	// async _off() {
	// 	this.#adapter.close && (await this.#adapter.close())
	// }

	async checkState() {
		return { id: this.id } // this.connected ? {id: this.id} : null
	}

	get tcvrProps() {
		return this.#powron.tcvrProps
	}

	get tcvrDefaults() {
		return this.#powron.tcvrDefaults
	}

	get signals() {
		return this.#powron.signals
	}

	onReceive(data) {
		console.debug('BLUEPWRON rcvd:', data)
	}

	onReceiveError(error) {
		console.error('BLUEPWRON error:', error)
	}

}

export { PowronConnector, Pins as PowronPins }
