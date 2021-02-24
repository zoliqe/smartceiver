/* eslint-disable class-methods-use-this */
import { delay } from '../utils/time.js'
import { Powron, Pins } from './extensions/powron.js'
import { USBInterface } from '../interfaces/usb.js'

class PowronConnector {

	#iface
	
	#device
	
	#powron

	constructor(tcvrAdapter, {options, keyerConfig}) {
		this.#powron = new Powron(tcvrAdapter, async (cmd) => this._send(cmd), {options, keyerConfig})
    this.#iface = new USBInterface()
    this.#iface.receive = this.onReceive
    this.#iface.receiveError = this.onReceiveError
	}

	get id() {
		return 'usbpowron'
	}

	async connect() {
		try {
      await this.#iface.connect()
			await this.#powron.init()
		} catch (error) {
      if (error === 'unsupported') {
        window.alert('USB not supported by browser. Cannot connect to transceiver.')
        throw new Error('WebUSB: API is not supported!')
      }
			console.error('WebUSB Connection error:', error)
			throw error
		}
		return this
  }

	async disconnect() {
		await delay(1000) // for poweroff signals TODO
    await this.#iface.disconnect()
	}

	get connected() {
		return this.#iface.connected
	}

	async checkState() {
		// TODO maybe check present device by navigator.usb.getDevices()?
		return {id: this.id} // this.connected ? {id: this.id} : null
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
}

export {PowronConnector, Pins as PowronPins}
