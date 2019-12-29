/* eslint-disable no-unused-expressions */
import {nextValue, prevValue, nextValueBounds} from '../../utils/lists.js'

class RemoddleMapper {

	up = '+'

	dn = '-'

	_encoderAvailableFunctions = {
		1: [dir => this.changeFreq(dir)],
		2: [dir => this.changeWpm(dir), dir => this.switchFilter(dir)],
		3: [dir => this.changeRit(dir)]
	}

	_encoderFunction = { 
		1: this._encoderAvailableFunctions[1][0], 
		2: this._encoderAvailableFunctions[2][0], 
		3: this._encoderAvailableFunctions[3][0] }
	
	/**
	 * button functions execution:
	 * - tap: on short press
	 * - hold: on long press
	 * - push: immediately on press
	 * - release: immediately on release
	 */
	_buttonMainFunctions = {
		1: { tap: _ => this.switchStep() }, // a
		2: { tap: _ => this.switchEncoderFunction(2) }, // b
		3: { tap: _ => this.switchEncoderFunction(3), hold: null }, // c // TODO hold: zeroes current fnc (RIT/SPLIT); release: disable rit/xit/split
		10: { tap: _ => this.switchBandUp(), hold: _ => this.switchBandDown() }, // j
		9: { tap: _ => this.switchMode() }, // i
		4: { tap: _ => this.switchGain() }, // d
		5: { tap: _ => this.buttonCwSelectFunctions(), hold: null }, // e
		// 8: { push: _ => this.setPtt(true), release: _ => this.setPtt(false) },
	}

	_buttonCwSelectFunctions = {
		1: _ => this.buttonCwCancelFunction(1), 
		2: _ => this.buttonCwCancelFunction(2), 
		3: _ => this.buttonCwCancelFunction(3),
		10: _ => this.buttonCwFunction(4), 
		9: _ => this.buttonCwFunction(5), 
		4: _ => this.buttonCwFunction(6),
		5: _ => this.buttonCwCancelFunction(7), 
		// 8: _ => this.buttonCwCancelFunction(8)
	}

	buttonCwFunction = btn => ({ tap: _ => this.cwmem(btn), hold: _ => this.cwmem(btn, { repeat: true }) })
	
	buttonCwCancelFunction = () => ({ release: _ => this.buttonMainFunctions() })

	// buttonTimeout = 2000

	constructor(tcvr) {
		this._tcvr = tcvr
		this.buttonMainFunctions()
	}

	remoddleCommand(c) {
		const code = c.charCodeAt(0);
		if (code <= 32) return // whitespace
		// console.log('remoddle:', c)
		if (c === '-') this._tcvr.keyDah()
		else if (c === '.') this._tcvr.keyDit()
		else if (c === '_') this._tcvr.keySpace()
		else if (c === '>') this.rotateEncoder(1, '+') // enc1 up
		else if (c === '<') this.rotateEncoder(1, '-') // enc1 dn
		else if (c === ']') this.rotateEncoder(2, '+') // enc2 up
		else if (c === '[') this.rotateEncoder(2, '-') // enc2 dn
		else if (c === '}') this.rotateEncoder(3, '+') // enc3 up
		else if (c === '{') this.rotateEncoder(3, '-') // enc3 dn
		else if (code >= 97 && code <= 122) this.tapButton(code - 96) // a - z
		else if (code >= 65 && code <= 90) this.holdButton(code - 64) // A - Z
		else if (c === '!') this.setPtt(true)
		else if (c === '~') this.setPtt(false)
		// else if (c === '$') this.pushButton(3) // btn3 push
		// else if (c === '^') this.pushButton(4) // btn4 push
		// else if (c === '*') this.pushButton(5) // btn5 push
		// else if (c === ':') this.pushButton(6) // btn6 push
		// else if (c === ';') this.pushButton(7) // btn7 push
		// else if (c === '`') this.pushButton(8) // btn8 push
		// else if (c === '@') this.releaseButton(1) // btn1 release
		// else if (c === '#') this.releaseButton(2) // btn2 release
		// else if (c === '%') this.releaseButton(3) // btn3 release
		// else if (c === '&') this.releaseButton(4) // btn4 release
		// else if (c === '?') this.releaseButton(5) // btn5 release
		// else if (c === '"') this.releaseButton(6) // btn6 release
		// else if (c === '|') this.releaseButton(7) // btn7 release
		// else if (c === '\'') this.releaseButton(8) // btn8 release
		else console.error('Remoddle sent unknown command:', c)
	}

	switchEncoderFunction = enc => {
		// this._encoderFunction[enc] = this._shiftIndex(this._encoderAvailableFunctions[enc], this._encoderFunction[enc])
		this._encoderFunction[enc] = nextValue(this._encoderAvailableFunctions[enc], this._encoderFunction[enc])
	}

	rotateEncoder = (enc, dir) => {
		// const fnc = this._encoderAvailableFunctions[enc][this._encoderFunction[enc]]
		const fnc = this._encoderFunction[enc]
		fnc && fnc(dir)
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

	changeFreq = dir => {
		this._tcvr.freq = dir === '+' ? (this._tcvr.freq + this._tcvr.step) : (this._tcvr.freq - this._tcvr.step)
	}
	
	changeRit = dir => { 
		this._tcvr.freq = dir === '+' ? (this._tcvr.freq + 10) : (this._tcvr.freq - 10) 
	}
	
	changeWpm = dir => { this._tcvr.wpm += (dir === '+' ? 1 : -1) }
	
	// changeFilter = dir => this._tcvr.filter = dir === '+' ? (this._tcvr.filter + 50) : (this._tcvr.filter - 50)
	// this._tcvr.filters[this._rotateByDir(dir, this._tcvr.filters, this._tcvr.filters.indexOf(this._tcvr.filter))]
	
	setPtt = state => { this._tcvr.ptt = state }
	
	switchStep = _ => {
		// this._tcvr.step = this._tcvr.steps[this._shiftIndex(this._tcvr.steps, this._tcvr.steps.indexOf(this._tcvr.step))]
		this._tcvr.step = nextValue(this._tcvr.steps, this._tcvr.step)
	}
	
	switchBandUp = _ => {
		// this._tcvr.band = this._tcvr.bands[this._shiftIndex(this._tcvr.bands, this._tcvr.band)]
		this._tcvr.band = nextValue(this._tcvr.bands, this._tcvr.band)
	}
	
	switchBandDown = _ => {
		// this._tcvr.band = this._unshiftIndex(this._tcvr.bands, this._tcvr.band)
		this._tcvr.band = prevValue(this._tcvr.bands, this._tcvr.band)
	}
	
	switchGain = _ => {
		// this._tcvr.gain = this._tcvr.gains[this._shiftIndex(this._tcvr.gains, this._tcvr.gains.indexOf(this._tcvr.gain))]
		this._tcvr.gain = nextValue(this._tcvr.gains, this._tcvr.gain)
	}
	
	switchMode = _ => {
		// this._tcvr.mode = this._tcvr.modes[this._shiftIndex(this._tcvr.modes, this._tcvr.mode)]
		this._tcvr.mode = nextValue(this._tcvr.modes, this._tcvr.mode)
	}
	
	switchFilter = _ => {
		// this._tcvr.filter = this._tcvr.filters[
		// 	this._shiftIndex(this._tcvr.filters, this._tcvr.filters.indexOf(this._tcvr.filter))]
		this._tcvr.filter = nextValueBounds(this._tcvr.filters, this._tcvr.filter)
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
