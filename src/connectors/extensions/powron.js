/* eslint-disable no-await-in-loop */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
import { delay } from '../../utils/time.js'
import { SignalsBinder } from '../../utils/signals.js'
import { Keyer } from './keyer.js'
import { PowrSwitch } from './powrsw.js'

const cmdByState = state => (state && 'WH') || 'WL'
const startSeq = '$OM4AA#'
const startSeqDelay = 3000
const serialInitDelay = 1000
// const Pins = Object.freeze({
//   pin2: 0, pin3: 1, pin4: 2, pin5: 3,
//   pin6: 4, pin7: 5, pin8: 6, pin9: 7, pin10: 8,
//   pinA0: 0, pinA1: 1, pinA2: 2, pinA3: 3, pinA4: 4, pinA5: 5,
//   pinA6: 6, pinA7: 7
// })

const defaultOptions = Object.freeze({
  keyerPin: 2, pttPins: [1],
  powerPins: [0],
  powerTimeout: 30,
  useStartSeq: false,
})

class Powron {

  #powerPins
  #pttPins
  #keyerPin
  #adapter
  #powr
  #keyer
  #signals
  #timeout
  #useStartSeq

  constructor(tcvrAdapter, send, {
    options = defaultOptions,
    keyerConfig = {
      pttTimeout: 5000,
      ditCoef: 120, dahCoef: 120, elementSpaceCoef: 60, letterSpaceCoef: 60,
    } }
  ) {
    this._send = async (data) => send(data)
    const opts = options || {}
    this.#keyerPin = opts.keyerPin
    this.#pttPins = opts.pttPins || []
    this.#powerPins = opts.powerPins || []
    this.#timeout = opts.powerTimeout || 0
    this.#useStartSeq = opts.useStartSeq
    // this.keyerState(true)
    // this.pttState(false)

    this.#adapter = tcvrAdapter
    this.#powr = new PowrSwitch({
      state: async (state) => this.pinState(this.#powerPins, state),
      timeout: this.#timeout
    })
    this.#keyer = new Keyer({
      send: async (cmd) => this._send(cmd),
      speed: async (wpm) => this._send(`KS${wpm}`),
      state: () => this.#keyerPin != null,
      key: async (state) => this.pinState(this.#keyerPin, state),
      ptt: async (state) => this.pinState(this.#pttPins, state)
    }, keyerConfig)

    this._initSignals()
    window.powron = this
  }

  get tcvrProps() {
    return this.#adapter.properties
  }

  get tcvrDefaults() {
    return this.#adapter.defaults
  }

  async serialData(data) {
    return data != null && this._send(`>${data}`)
  }

  onReceive(data) {
    console.debug('POWRON rcvd:', data)
  }

  onReceiveError(error) {
    console.error('POWRON error:', error)
  }

  async on() {
    console.debug('POWRON: poweron')
    await this.#powr.on()
    this.#adapter.init && (await this.#adapter.init(async (data) => this.serialData(data)))
  }

  async off() {
    console.debug('POWRON: poweroff')
    this.#adapter.close && (await this.#adapter.close())
    await this.#powr.off()
  }

  async init() {
    if (this.#useStartSeq) {
      await delay(startSeqDelay)
      await this._send(startSeq)
      await delay(serialInitDelay)
    }
    await this._initPwrSwitch()
    await this._initSerial()
    await this._initKeyer()
  }

  async _initSerial() {
    if (this.#adapter.baudrate >= 1200 && this.#adapter.baudrate <= 115200)
      await this._send(`PO${this.#adapter.baudrate / 100}`)
    else
      console.error(`POWRON: serial baudrate = ${this.#adapter.baudrate} not in range, value not set`)
  }

  async _initPwrSwitch() {
    await this._send(`WT${this.#powr.watchdogTimeout > 0 ? this.#powr.watchdogTimeout + 30 : 0}`)
  }

  async _initKeyer() {
    if (!this.#keyerPin) {
      console.info('POWRON: Disabling keyer')
      await this._send('KK0')
      return
    }
    console.info('POWRON: Enabling keyer on pin', this.#keyerPin)
    await this._send(`KK${this.#keyerPin}`)
    await this._send(`KD${this.#keyer.coefs.dit}`) // ditCoef
    await this._send(`KA${this.#keyer.coefs.dah}`) // dahCoef
    await this._send(`KE${this.#keyer.coefs.elementSpace}`)  // elementSpaceCoef
    await this._send(`KC${this.#keyer.coefs.letterSpace}`)  // letterSpaceCoef
  }

  async pinState(pin, state) {
    if (Array.isArray(pin)) {
      for (const p of pin) await this.pinState(p, state)
      return
    }
    if (pin >= 0 && pin <= 50)
      await this._send(cmdByState(state) + pin)
    else
      console.error(`POWRON pinState: pin ${pin} not known`)
  }

  _initSignals() {
    this.#signals = new SignalsBinder(this.id, {
      keyDit: async () => this.#keyer.send('.'),
      keyDah: async () => this.#keyer.send('-'),
      keySpace: async () => this.#keyer.send('_'),
      wpm: async (value) => {
        this.#keyer.setwpm(value);
        this.#adapter.wpm(value);
      },
      keyMsg: async (value) => this.#adapter.keymsg(value),
      ptt: async (value) => {
        this.#adapter.ptt(value)
        this.#keyer.ptt(value)
      },
      mode: async (value) => this.#adapter.mode(value),
      filter: async (value) => this.#adapter.filter(value),
      gain: async (value) => this.#adapter.gain(value),
      agc: async (value) => this.#adapter.agc(value),
      freq: async (value) => this.#adapter.frequency(value),
      split: async (value) => this.#adapter.split(value),
      rit: async (value) => this.#adapter.rit(value),
      xit: async (value) => this.#adapter.xit(value),
      keepAlive: async () => this.#powr.resetWatchdog(),
      pwrsw: async (value) => value ? this.on() : this.off(),
    })
  }

  get signals() {
    return this.#signals
  }
}

export { Powron, defaultOptions }
