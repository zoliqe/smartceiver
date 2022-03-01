/* eslint-disable class-methods-use-this */
// import { delay } from '../utils/time.js'
import { Remotig } from './extensions/remotig.js'
import { USBInterface } from '../interfaces/usb.js'

class RemotigConnector {

  #iface

  #remotig

  constructor(tcvrAdapter, { options, keyerConfig }) {
    this.#iface = new USBInterface()
    this.#iface.receive = this.onReceive
    this.#iface.receiveError = this.onReceiveError
    this.#remotig = new Remotig(tcvrAdapter,
      async (cmd) => this.#iface.send(cmd + ';'),
      { options, keyerConfig })
  }

  get id() {
    return 'remotig-usb'
  }

  async connect() {
    try {
      await this.#iface.connect()
      await this.#remotig.init()
    } catch (error) {
      if (error === 'unsupported') {
        window.alert('USB not supported by browser. Cannot connect to transceiver.')
        throw new Error('UsbRemotig: API is not supported!')
      }
      console.error('UsbRemotig Connection error:', error)
      throw error
    }
		window.sendRemotig = async data => this.#iface.send(data)
    return this
  }

  async disconnect() {
    if (!this.connected) return
    await this.#remotig.off()
    // await delay(1000) // for poweroff signals TODO
    await this.#iface.disconnect()
  }

  get connected() {
    return this.#iface.connected
  }

  async checkState() {
    // TODO maybe check present device by navigator.usb.getDevices()?
    return { id: this.id } // this.connected ? {id: this.id} : null
  }

  onReceive(data) {
    console.debug('UsbRemotig rcvd:', data)
  }

  onReceiveError(error) {
    console.error('UsbRemotig error:', error)
  }

  get tcvrProps() {
    9
    return this.#remotig.tcvrProps
  }

  get tcvrDefaults() {
    return this.#remotig.tcvrDefaults
  }

  get signals() {
    return this.#remotig.signals
  }
}

export { RemotigConnector }
