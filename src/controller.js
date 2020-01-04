/* eslint-disable no-unused-expressions */
import {SignalType, TcvrSignal} from './utils/signals.js'
import { Transceiver } from './tcvr.js'

export class TcvrController {
	#id

	#attached
	
	#tcvr

	exclusive = false

	preventSubcmd = false

	constructor(controllerId) {
		this.#id = controllerId
	}

	get id() {
		return this.#id
	}

	get active() {
		return this.#attached
	}

	detach() {
		this.#attached = false
		this.#tcvr = null
	}

	/**
	 * 
	 * @param {Transceiver} tcvr 
	 */
	attachTo(tcvr) {
		tcvr.attachController(this)
		this.#tcvr = tcvr
		this.#attached = true
	}

	async connect(connectors) {
		this.#tcvr && (await this.#tcvr.connect(connectors))
	}

	async disconnect() {
		this.#tcvr && this.#tcvr.disconnect()
	}

	async keepAlive() {
		this.#tcvr && this.#tcvr.keepAlive()
	}

	poweron() {
		this.#tcvr && this.#tcvr.fire(new TcvrSignal(SignalType.pwrsw, true), {force: true})
	}

	poweroff() {
		this.#tcvr && this.#tcvr.fire(new TcvrSignal(SignalType.pwrsw, false), {force: true})
	}

	keyDit() {
		this.#tcvr && this.#tcvr.fire(new TcvrSignal(SignalType.keyDit, 1))
	}

	keyDah() {
		this.#tcvr && this.#tcvr.fire(new TcvrSignal(SignalType.keyDah, 1))
	}

	keySpace() {
		this.#tcvr && this.#tcvr.fire(new TcvrSignal(SignalType.keySpace, 1))
	}

	get properties() {
		return this.#tcvr && this.#tcvr.properties
	}

	get propDefaults() {
		return this.#tcvr && this.#tcvr.defaultProps
	}

	set ptt(value) {
		this.#tcvr && this.#tcvr.setPtt(this, value)
	}

	get wpm() {
		return this.#tcvr && this.#tcvr.wpm
	}

	set wpm(value) {
		this.#tcvr && this.#tcvr.setWpm(this, value)
	}

	get reversePaddle() {
		return this.#tcvr && this.#tcvr.reversePaddle
	}

	set reversePaddle(value) {
		this.#tcvr && this.#tcvr.setReversePaddle(this, value)
	}

	get bands() {
		return this.#tcvr && this.#tcvr.bands
	}

	get band() {
		return this.#tcvr && this.#tcvr.band
	}

	set band(value) {
		this.#tcvr && this.#tcvr.setBand(this, value)
	}

	get freq() {
		return this.#tcvr && this.#tcvr.freq
	}

	set freq(value) {
		this.#tcvr && this.#tcvr.setFreq(this, value)
	}

	get split() {
		return this.#tcvr && this.#tcvr.split
	}

	set split(value) {
		this.#tcvr && this.#tcvr.setSplit(this, value)
	}

	get rit() {
		return this.#tcvr && this.#tcvr.rit
	}

	set rit(value) {
		this.#tcvr && this.#tcvr.setRit(this, value)
	}

	// get xit() {
	// 	return this.#tcvr && this.#tcvr.xit
	// }
	set xit(value) {
		this.#tcvr && this.#tcvr.setXit(this, value)
	}

	get steps() {
		return this.#tcvr && this.#tcvr.steps
	}

	get step() {
		return this.#tcvr && this.#tcvr.step
	}

	set step(value) {
		this.#tcvr && this.#tcvr.setStep(this, value)
	}

	get modes() {
		return this.#tcvr && this.#tcvr.modes
	}

	get mode() {
		return this.#tcvr && this.#tcvr.mode
	}

	set mode(value) {
		this.#tcvr && this.#tcvr.setMode(this, value)
	}

	get filters() {
		return this.#tcvr && this.#tcvr.filters
	}

	get filter() {
		return this.#tcvr && this.#tcvr.filter
	}

	set filter(value) {
		this.#tcvr && this.#tcvr.setFilter(this, value)
	}

	get gains() {
		return this.#tcvr && this.#tcvr.gains
	}

	get gain() {
		return this.#tcvr && this.#tcvr.gain
	}

	set gain(value) {
		this.#tcvr && this.#tcvr.setGain(this, value)
	}

	get agcTypes() {
		return this.#tcvr && this.#tcvr.agcTypes
	}

	get agc() {
		return this.#tcvr && this.#tcvr.agc
	}

	set agc(value) {
		this.#tcvr && this.#tcvr.setAgc(this, value)
	}

}
