/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
// import { delay } from '../utils/time.js'
import { Powron } from './extensions/powron.js'
import { BluetoothInterface } from '../interfaces/bluetooth.js'
import { SignalsBinder } from '../utils/signals.js'
import { BufferedWriter } from '../utils/bufwriter.js'

// Sky is blue and your CAT is looking for another mouse...

class PowronConnector {
	#iface
	#powron
	#writer
	#heartbeatTimer

	constructor(tcvrAdapter, { options, keyerConfig }) {
		if (!BluetoothInterface || !navigator.bluetooth) {
			window.alert('Bluetooth connection supported. Cannot connect to transceiver.')
			throw new Error('BLUEPOWRON: WebBluetooth is not supported!')
		}

		this.#powron = new Powron(tcvrAdapter,
			async (cmd) => this._send(cmd),
			{ options, keyerConfig })
		this.#writer = new BufferedWriter(async (data) => this.connected && this.#iface.send(data))
	}

	get id() {
		return 'bluepowron'
	}

	async connect() {
		this.#iface = new BluetoothInterface()
		this.#iface.receive = this.onReceive
		this.#iface.receiveError = this.onReceiveError
		try {
			await this.#iface.connect()
			// await delay(1000) // wait for gatt server ready
			await this.#powron.init()
		} catch (error) {
			console.error('BLUECAT: Connection error', error)
			this.disconnect()
			throw error
		}
		this.#enableHeartbeat()
		console.info(`BLUECAT device ${this.#iface.getDeviceName()} connected :-)`)

		return this
	}

	#enableHeartbeat() {
		this.#heartbeatTimer = setInterval(() => {
			this.connected && this._send('?')
		}, 30000);
	}

	async disconnect() {
		this.#heartbeatTimer && clearInterval(this.#heartbeatTimer)
		this.#heartbeatTimer = null
		await this.#powron.off()
		// await delay(1000) // for poweroff signals TODO
		this.#iface && this.#iface.disconnect()
		this.#iface = null
	}

	async _send(data) {
		if (this.connected) {
			await this.#writer.write(data)
			console.debug(`BLUEPOWRON sent: ${data}`)
		}
	}

	get connected() {
		return this.#iface && this.#iface.getDeviceName()
	}

	async checkState() {
		// TODO maybe check present device by navigator.usb.getDevices()?
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

export { PowronConnector }
