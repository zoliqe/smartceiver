/* eslint-disable class-methods-use-this */
import { delay } from '../utils/time.js'
import { Powron, Pins } from './extensions/powron.js'

const devFilters = [
	{ 'vendorId': 0x2341, 'productId': 0x8036 },
	{ 'vendorId': 0x2341, 'productId': 0x8037 },
]
const encoder = new TextEncoder()
const decoder = new TextDecoder()

class PowronConnector {

	#interfaceNumber = 2  // original interface number of WebUSB Arduino demo
	
	#endpointIn = 5       // original in endpoint ID of WebUSB Arduino demo
	
	#endpointOut = 4      // original out endpoint ID of WebUSB Arduino demo
	
	#device
	
	#powron

	constructor(tcvrAdapter, {options, keyerConfig}) {
		this.#powron = new Powron(tcvrAdapter, async (cmd) => this._send(cmd), {options, keyerConfig})
	}

	get id() {
		return 'usbpowron'
	}

	async connect() {
		if (!navigator.usb) {
			alert('USB not supported. Cannot connect to transceiver.')
			throw new Error('POWRON: WebUSB is not supported!')
		}
		try {
			const paired = await navigator.usb.getDevices()
			if (paired.length === 1) {
				[this.#device] = paired
			} else {
				this.#device = await navigator.usb.requestDevice({ 'filters': devFilters })
			}
			console.debug(`POWRON device: ${this.#device.productName} (${this.#device.manufacturerName})`)
			await this._open()
			console.info('POWRON Connected ' + this.#device.productName)
			await this.#powron.init()
		} catch (error) {
			console.error('POWRON Connection error: ' + error)
			throw error
		}
		return this
  }

  _open() {
    return this.#device.open()
      .then(() => {
        if (this.#device.configuration === null) {
          return this.#device.selectConfiguration(1)
        }
			})
			.then(() => {
				const configurationInterfaces = this.#device.configuration.interfaces
				configurationInterfaces.forEach(element => {
					element.alternates.forEach(elementalt => {
						if (elementalt.interfaceClass === 0xff) {
							this.#interfaceNumber = element.interfaceNumber
							elementalt.endpoints.forEach(elementendpoint => {
								if (elementendpoint.direction === "out") {
									this.#endpointOut = elementendpoint.endpointNumber
								}
								if (elementendpoint.direction === "in") {
									this.#endpointIn = elementendpoint.endpointNumber
								}
							})
						}
					})
				})
			})
      .then(() => this.#device.claimInterface(this.#interfaceNumber))
			.then(() => this.#device.selectAlternateInterface(this.#interfaceNumber, 0))
      .then(() => this.#device.controlTransferOut({
        'requestType': 'class',
        'recipient': 'interface',
        'request': 0x22,
        'value': 0x01,
        'index': this.#interfaceNumber
      }))
      .then(() => this._readLoop())
  }

	_readLoop() {
	  this.#device.transferIn(this.#endpointIn, 64).then(result => {
	    this.#powron.onReceive(decoder.decode(result.data))
	    this._readLoop()
	  }, error => this.#powron.onReceiveError(error))
	}

	async disconnect() {
		if (!this.#device) return

		await delay(1000) // for poweroff signals 
		// await this._off()
		await this.#device.controlTransferOut({
			'requestType': 'class',
			'recipient': 'interface',
			'request': 0x22,
			'value': 0x00,
			'index': this.#interfaceNumber
		})
		console.debug('POWRON close()')
		await this.#device.close()
		this.#device = null
	}

	get connected() {
		return this.#device != null
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

	async _send(data) {
		console.debug(`POWRON <= ${data} `)
		if (this.connected) {
			const bytes = typeof data === 'string' ? encoder.encode(`${data}\n`) : data
			await this.#device.transferOut(this.#endpointOut, bytes)
			return true
		} 
		console.error(`POWRON: data not sent ${ data }`)
		return false
	}

	get signals() {
		return this.#powron.signals
	}
}

export {PowronConnector, Pins as PowronPins}
