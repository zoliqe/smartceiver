/* eslint-disable class-methods-use-this */
import { delay } from '../utils/time.js'
import { Powron, Pins } from './extensions/powron.js'
import { USBInterface } from '../interfaces/usb.js'

class PowronConnector {

	#iface
	
	#powron

	constructor(tcvrAdapter, {options, keyerConfig}) {
		this.#powron = new Powron(tcvrAdapter, async (cmd) => this.#iface.send(cmd), {options, keyerConfig})
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
        throw new Error('USBPWRON: API is not supported!')
      }
			console.error('USBPWRON Connection error:', error)
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
	
	onReceive(data) {
		console.debug('USBPWRON rcvd:', data)
	}

	onReceiveError(error) {
		console.error('USBPWRON error:', error)
	}
	
	get tcvrProps() {9
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
