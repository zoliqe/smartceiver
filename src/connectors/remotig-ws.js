/* eslint-disable class-methods-use-this */
import { Remotig } from './extensions/remotig.js'

class RemotigConnector {

  #iface
  #remotig

  constructor(tcvrAdapter, { options, keyerConfig }) {
    const url = `ws://${options.host || '192.168.4.1'}/ctl`
    this.#remotig = new Remotig(tcvrAdapter,
      async (cmd) => this.connected && this.#iface.send(cmd),
      { options, keyerConfig })
  }

  get id() {
    return 'remotig-ws'
  }

  async init() {
    this.#iface = new WebSocket(url)
    this.#iface.onmessage = event => this.onReceive(event.data)
    this.#iface.onopen = _ => {
      this.onReceive('opened')
    }
    this.#iface.onclose = _ => {
      this.onReceive('closed')
      setTimeout(this.init, 5000)
    }
    this.#iface.onerror = this.onReceiveError
  }

  async connect() {
    try {
      await this.#remotig.init()
    } catch (error) {
      console.error('UsbRemotig Connection error:', error)
      throw error
    }
		window.sendRemotig = async data => this.#iface.send(data)
    return this
  }

  async disconnect() {
    if (!this.connected) return
    await this.#remotig.off()
    // await delay(200) // for poweroff signals TODO
    this.#iface.close()
  }

  get connected() {
    return this.#iface != null && this.#iface.readyState == 1
  }

  async checkState() {
    return { id: this.id } // this.connected ? {id: this.id} : null
  }

  onReceive(data) {
    console.debug('WsRemotig rcvd:', data)
  }

  onReceiveError(error) {
    console.error('WsRemotig error:', error)
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