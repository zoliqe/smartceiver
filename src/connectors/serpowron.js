/* eslint-disable class-methods-use-this */
import { delay } from '../utils/time.js'
import { Powron, Pins } from './extensions/powron.js'
import { SerialInterface } from '../interfaces/serial.js'

class PowronConnector {

	#iface
	
	#powron
	
	constructor(tcvrAdapter, {options, keyerConfig}) {
		this.#powron = new Powron(tcvrAdapter, async (cmd) => this.#iface.send(cmd), {options, keyerConfig})
		this.#iface = new SerialInterface(4800, [])
    this.#iface.receive = this.onReceive
    this.#iface.receiveError = this.onReceiveError
	}

	get id() {
		return 'serpowron'
	}

	async connect() {
		try {
      await this.#iface.connect()
			await this.#powron.init()
		} catch (error) {
      if (error === 'unsupported') {
        window.alert('Serial not supported by browser. Cannot connect to transceiver.')
        throw new Error('SERPWRON: API is not supported!')
      }
			console.error('SERPWRON Connection error:', error)
			throw error
		}
		return this
	}
	
	async disconnect() {
		if (!this.connected) return

		await delay(1000) // for poweroff signals 
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
		console.debug('SERPWRON rcvd:', data)
	}

	onReceiveError(error) {
		console.error('SERPWRON error:', error)
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
