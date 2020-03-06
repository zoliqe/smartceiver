/* eslint-disable no-unused-expressions */
import {SignalType, TcvrSignal} from './utils/signals.js'
import { Transceiver } from './tcvr.js'

export class TcvrController {
	exclusive = false

	preventSubcmd = false

	constructor(controllerId) {
		this._id = controllerId
	}

	get id() {
		return this._id
	}

	get active() {
		return this._attached
	}

	detach() {
		this._attached = false
		this._tcvr = null
	}

	/**
	 * 
	 * @param {Transceiver} tcvr 
	 */
	attachTo(tcvr) {
		tcvr.attachController(this)
		this._tcvr = tcvr
		this._attached = true
	}

	async connect(connectors) {
		this._tcvr && (await this._tcvr.connect(connectors))
	}

	async disconnect() {
		this._tcvr && this._tcvr.disconnect()
	}

	async keepAlive() {
		this._tcvr && this._tcvr.keepAlive()
	}

	poweron() {
		this._tcvr && this._tcvr.fire(new TcvrSignal(SignalType.pwrsw, true), {force: true})
	}

	poweroff() {
		this._tcvr && this._tcvr.fire(new TcvrSignal(SignalType.pwrsw, false), {force: true})
	}

	keyDit() {
		this._tcvr && this._tcvr.fire(new TcvrSignal(SignalType.keyDit, 1))
	}

	keyDah() {
		this._tcvr && this._tcvr.fire(new TcvrSignal(SignalType.keyDah, 1))
	}

	keySpace() {
		this._tcvr && this._tcvr.fire(new TcvrSignal(SignalType.keySpace, 1))
	}

	get properties() {
		return this._tcvr && this._tcvr.properties
	}

	get propDefaults() {
		return this._tcvr && this._tcvr.defaultProps
	}

	set ptt(value) {
		this._tcvr && this._tcvr.setPtt(this, value)
	}

	get wpm() {
		return this._tcvr && this._tcvr.wpm
	}

	set wpm(value) {
		this._tcvr && this._tcvr.setWpm(this, value)
	}

	get reversePaddle() {
		return this._tcvr && this._tcvr.reversePaddle
	}

	set reversePaddle(value) {
		this._tcvr && this._tcvr.setReversePaddle(this, value)
	}

	get bands() {
		return this._tcvr && this._tcvr.bands
	}

	get band() {
		return this._tcvr && this._tcvr.band
	}

	set band(value) {
		this._tcvr && this._tcvr.setBand(this, value)
	}

	get freq() {
		return this._tcvr && this._tcvr.freq
	}

	set freq(value) {
		if (!this._tcvr) return
		if (this.id === 'ui' && this._tcvr.freq === value) return
		this._tcvr.setFreq(this, value)
	}

	set freqAndBand(value) {
		if (!this._tcvr) return
		this._tcvr.setFreq(this, value, {allowBandChange: true})
	}

	get split() {
		return this._tcvr && this._tcvr.split
	}

	set split(value) {
		if (!this._tcvr) return
		if (this.id === 'ui' && this._tcvr.split === value) return
		this._tcvr.setSplit(this, value)
	}

	get rit() {
		return this._tcvr && this._tcvr.rit
	}

	set rit(value) {
		if (!this._tcvr) return
		if (this.id === 'ui' && this._tcvr.rit === value) return
		this._tcvr.setRit(this, value)
	}

	// get xit() {
	// 	return this._tcvr && this._tcvr.xit
	// }
	set xit(value) {
		this._tcvr && this._tcvr.setXit(this, value)
	}

	get steps() {
		return this._tcvr && this._tcvr.steps
	}

	get step() {
		return this._tcvr && this._tcvr.step
	}

	set step(value) {
		this._tcvr && this._tcvr.setStep(this, value)
	}

	get modes() {
		return this._tcvr && this._tcvr.modes
	}

	get mode() {
		return this._tcvr && this._tcvr.mode
	}

	set mode(value) {
		this._tcvr && this._tcvr.setMode(this, value)
	}

	get filters() {
		return this._tcvr && this._tcvr.filters
	}

	get filter() {
		return this._tcvr && this._tcvr.filter
	}

	set filter(value) {
		this._tcvr && this._tcvr.setFilter(this, value)
	}

	get gains() {
		return this._tcvr && this._tcvr.gains
	}

	get gain() {
		return this._tcvr && this._tcvr.gain
	}

	set gain(value) {
		this._tcvr && this._tcvr.setGain(this, value)
	}

	get agcTypes() {
		return this._tcvr && this._tcvr.agcTypes
	}

	get agc() {
		return this._tcvr && this._tcvr.agc
	}

	set agc(value) {
		this._tcvr && this._tcvr.setAgc(this, value)
	}

}
