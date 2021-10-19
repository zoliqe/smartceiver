/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
import {nextValue, prevValue, nextValueBounds, prevValueBounds} from '../../utils/lists.js'

class RemoddleMapper {

	up = '+'

	dn = '-'

	_encoderAvailableFunctions = {
		1: [
			{id: 'freq', fnc: dir => this.changeFreq(dir)}],
		2: [
			{id: 'wpm', fnc: dir => this.changeWpm(dir)}, 
			{id: 'filter', fnc: dir => this.switchFilter(dir)}],
		3: [
			{id: 'rit', fnc: dir => this.changeRit(dir)}, 
			{id: 'split', fnc: dir => this.changeSplit(dir)}]
	}

	_encoderFunction = { 
		1: this._encoderAvailableFunctions[1][0], 
		2: this._encoderAvailableFunctions[2][0], 
		3: this._encoderAvailableFunctions[3][0]
	}
	
	/**
	 * button functions execution:
	 * - tap: on short press
	 * - hold: on long press
	 * - push: immediately on press
	 * - release: immediately on release
	 */
	_buttonMainFunctions = {
		1: { tap: () => this.switchStep() }, // a
		2: { tap: () => this.switchEncoderFunction(2) }, // b
		3: { tap: () => this.switchEncoderFunction(3) }, // c // TODO hold: zeroes current fnc (RIT/SPLIT); release: disable rit/xit/split
		4: { tap: () => this.switchBandUp(), hold: () => this.switchBandDown() }, // d
		5: { tap: () => this.switchMode() }, // e
		6: { tap: () => this.switchGain() }, // f
		// 7: { tap: () => this.buttonCwSelectFunctions() }, // g
	}

	_buttonCwSelectFunctions = {
		1: () => this.buttonCwCancelFunction(1), 
		2: () => this.buttonCwCancelFunction(2), 
		3: () => this.buttonCwCancelFunction(3),
		4: () => this.buttonCwFunction(6),
		5: () => this.buttonCwCancelFunction(7), 
		6: () => this.buttonCwFunction(5), 
		7: () => this.buttonCwFunction(4), 
	}

	buttonCwFunction = btn => ({ tap: () => this.cwmem(btn), hold: () => this.cwmem(btn, { repeat: true }) })
	
	buttonCwCancelFunction = () => ({ release: () => this.buttonMainFunctions() })

	// buttonTimeout = 2000

	constructor(tcvr) {
		this._tcvr = tcvr
		this.buttonMainFunctions()
	}

	onEncFncChange(enc, fncId) {
		// handle encoder function change
	}

	remoddleCommand(c) {
		const code = c.charCodeAt(0);
		if (code <= 32) return // whitespace
		// console.log('remoddle:', c)
		if (c === '-') this._tcvr.keyDah()
		else if (c === '.') this._tcvr.keyDit()
		else if (c === '_') this._tcvr.keySpace()
		else if (c === '>') this.rotateEncoder(1, +1) // enc1 up
		else if (c === '<') this.rotateEncoder(1, -1) // enc1 dn
		else if (c === ']') this.rotateEncoder(2, +1) // enc2 up
		else if (c === '[') this.rotateEncoder(2, -1) // enc2 dn
		else if (c === '}') this.rotateEncoder(3, +1) // enc3 up
		else if (c === '{') this.rotateEncoder(3, -1) // enc3 dn
		else if (code >= 97 && code <= 122) this.tapButton(code - 96) // a - z
		else if (code >= 65 && code <= 90) this.holdButton(code - 64) // A - Z
		else if (c === '/') this.setPtt(true)
		else if (c === '\\') this.setPtt(false)
		else console.error('Remoddle sent unknown command:', c)
	}

	switchEncoderFunction = enc => {
		// this._encoderFunction[enc] = this._shiftIndex(this._encoderAvailableFunctions[enc], this._encoderFunction[enc])
		this._encoderFunction[enc] = nextValue(this._encoderAvailableFunctions[enc], this._encoderFunction[enc])
		this.onEncFncChange(enc, this._encoderFunction[enc].id)
	}

	rotateEncoder = (enc, delta) => {
		// const fnc = this._encoderAvailableFunctions[enc][this._encoderFunction[enc]]
		const fncobj = this._encoderFunction[enc]
		fncobj && fncobj.fnc(delta)
	}

	get encodersActiveFunctions() {
		return Object.values(this._encoderFunction)
			.map(fncobj => fncobj.id)
	}

	holdButton(btn) {
		const fnc = this._buttonFunctions[btn] || {}
		fnc.hold && fnc.hold()
		// fnc.push && fnc.push()
		// if (fnc.tap) fnc.time = Date.now()
		// if (fnc.hold) {
		// 	fnc.timeout = setTimeout(_ => {
		// 		fnc.timeout = null
		// 		fnc.hold()
		// 	}, this.buttonTimeout)
		// }
	}

	tapButton(btn) {
		const fnc = this._buttonFunctions[btn] || {}
		fnc.tap && fnc.tap()
		// fnc.release && fnc.release()
		// if (fnc.timeout != null) {
		// 	clearTimeout(fnc.timeout)
		// 	fnc.timeout = null
		// }
		// if (fnc.time) {
		// 	if (fnc.tap && (Date.now() - fnc.time) < this.buttonTimeout) {
		// 		fnc.tap()
		// 	}
		// 	fnc.time = null
		// }
	}

	buttonCwSelectFunctions() {
		this._buttonFunctions = this._buttonCwSelectFunctions
	}

	buttonMainFunctions() {
		this._buttonFunctions = this._buttonMainFunctions
	}

	changeFreq = delta => { this._tcvr.freq += this._tcvr.step * delta }
	
	changeSplit = delta => {
		const split = /*this._tcvr.split === 0 ? this._tcvr.freq :*/ this._tcvr.split
		this._tcvr.split = split + this._tcvr.step * delta
	}
	
	changeRit = delta => { this._tcvr.rit += delta * 10 }
	
	changeWpm = delta => { this._tcvr.wpm += delta }
	
	// changeFilter = dir => this._tcvr.filter = dir === '+' ? (this._tcvr.filter + 50) : (this._tcvr.filter - 50)
	// this._tcvr.filters[this._rotateByDir(dir, this._tcvr.filters, this._tcvr.filters.indexOf(this._tcvr.filter))]
	
	setPtt = state => { /*this._tcvr.ptt = state*/ } // FIXME: need more testing on powron side
	
	switchStep = () => {
		// this._tcvr.step = this._tcvr.steps[this._shiftIndex(this._tcvr.steps, this._tcvr.steps.indexOf(this._tcvr.step))]
		this._tcvr.step = nextValue(this._tcvr.steps, this._tcvr.step)
	}
	
	switchBandUp = () => {
		// this._tcvr.band = this._tcvr.bands[this._shiftIndex(this._tcvr.bands, this._tcvr.band)]
		this._tcvr.band = nextValue(this._tcvr.bands, this._tcvr.band)
	}
	
	switchBandDown = () => {
		// this._tcvr.band = this._unshiftIndex(this._tcvr.bands, this._tcvr.band)
		this._tcvr.band = prevValue(this._tcvr.bands, this._tcvr.band)
	}
	
	switchGain = () => {
		// this._tcvr.gain = this._tcvr.gains[this._shiftIndex(this._tcvr.gains, this._tcvr.gains.indexOf(this._tcvr.gain))]
		this._tcvr.gain = nextValue(this._tcvr.gains, this._tcvr.gain)
	}
	
	switchMode = () => {
		// this._tcvr.mode = this._tcvr.modes[this._shiftIndex(this._tcvr.modes, this._tcvr.mode)]
		this._tcvr.mode = nextValue(this._tcvr.modes, this._tcvr.mode)
	}
	
	switchFilter = delta => {
		// this._tcvr.filter = this._tcvr.filters[
		// 	this._shiftIndex(this._tcvr.filters, this._tcvr.filters.indexOf(this._tcvr.filter))]
		// filters has inverted order
		this._tcvr.filter = delta < 0 ? nextValueBounds(this._tcvr.filters, this._tcvr.filter)
			: prevValueBounds(this._tcvr.filters, this._tcvr.filter)
	}
	
	cwmem = (mem, { repeat = false }) => {
		// TODO
	}
	
	// _rotateByDir(dir, list, index) {
	// 	return dir === '+' ? this._shiftIndex(list, index) : prevValue(list, index)
	// }

	// _shiftIndex(list, index) {
	// 	return (index + 1) < list.length ? (index + 1) : 0
	// }

	// _unshiftIndex(list, index) {
	// 	return (index == 0 ? list.length : index) - 1
	// }

}

export {RemoddleMapper}
