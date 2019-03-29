
class TcvrControls {

	up = '+'
	dn = '-'

	_encoderAvailableFunctions = {
		1: [this.changeFreq],
		2: [this.changeWpm, this.changeFilter],
		3: [this.changeRit]
	}
	_encoderFunction = { 1: 0, 2: 0, 3: 0 }
	
	/**
	 * button functions execution:
	 * - tap: on short press
	 * - hold: on long press
	 * - push: immediately on press
	 * - release: immediately on release
	 */
	_buttonMainFunctions = {
		1: { tap: _ => this.switchStep() },
		2: { tap: _ => this.switchEncoderFunction(2) },
		3: { tap: _ => this.switchEncoderFunction(3), hold: null, push: null, release: null }, // TODO hold: zeroes current fnc (RIT/SPLIT); release: disable rit/xit/split
		4: { tap: _ => this.switchGain() },
		5: { tap: _ => this.switchBand() },
		6: { tap: _ => this.switchMode() },
		7: { push: _ => this.setPtt(true), release: _ => this.setPtt(false) },
		8: { tap: _ => this.buttonCwSelectFunctions(), hold: null, push: null, release: null },
	}
	_buttonCwSelectFunctions = {
		1: this.buttonCwCancelFunction(1), 2: this.buttonCwCancelFunction(2), 3: this.buttonCwCancelFunction(3),
		4: this.buttonCwFunction(4), 5: this.buttonCwFunction(5), 6: this.buttonCwFunction(6),
		7: this.buttonCwCancelFunction(7), 8: this.buttonCwCancelFunction(8)
	}

	buttonCwFunction = btn => {
		return { tap: _ => this.cwmem(btn), hold: _ => this.cwmem(btn, { repeat: true }) }
	}
	buttonCwCancelFunction = btn => {
		return { release: _ => this.buttonMainFunctions() }
	}

	buttonTimeout = 2000

	constructor(tcvr) {
		this._tcvr = tcvr
		this.buttonMainFunctions()
	}

	remoddleCommand(c) {
		const code = c.charCodeAt(0);
		if (code <= 32) return // whitespace
		// console.log('remoddle:', c)
		if (c === '-') this.fire(new TcvrEvent(EventType.keyDah, 1))
		else if (c === '.') this.fire(new TcvrEvent(EventType.keyDit, 1))
		else if (c === '_') this.fire(new TcvrEvent(EventType.keySpace, 1))
		else if (c === '>') this.rotateEncoder(1, '+') // enc1 up
		else if (c === '<') this.rotateEncoder(1, '-') // enc1 dn
		else if (c === ']') this.rotateEncoder(2, '+') // enc2 up
		else if (c === '[') this.rotateEncoder(2, '-') // enc2 dn
		else if (c === '}') this.rotateEncoder(3, '+') // enc3 up
		else if (c === '{') this.rotateEncoder(3, '-') // enc3 dn
		else if (code >= 65 && code <= 90) this.pushButton(code - 64) // A - Z
		else if (code >= 97 && code <= 122) this.releaseButton(code - 96) // a - z
		// else if (c === '!') this.pushButton(1) // btn1 push
		// else if (c === '~') this.pushButton(2) // btn2 push
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

	switchEncoderFunction = enc => this._encoderFunction[enc] = this._shiftIndex(this._encoderAvailableFunctions[enc], this._encoderFunction[enc])

	rotateEncoder = (enc, dir) => this._encoderAvailableFunctions[enc][this._encoderFunction[enc]](dir)

	pushButton(btn) {
		const fnc = this._buttonFunctions[btn] || {}
		fnc.push && fnc.push()
		if (fnc.tap) fnc.time = Date.now()
		if (fnc.hold) {
			fnc.timeout = setTimeout(_ => {
				fnc.timeout = null
				fnc.hold()
			}, this.buttonTimeout)
		}
	}

	releaseButton(btn) {
		const fnc = this._buttonFunctions[btn] || {}
		fnc.release && fnc.release()
		if (fnc.timeout != null) {
			clearTimeout(fnc.timeout)
			fnc.timeout = null
		}
		if (fnc.time) {
			if (fnc.tap && (Date.now() - fnc.time) < this.buttonTimeout) {
				fnc.tap()
			}
			fnc.time = null
		}
	}

	buttonCwSelectFunctions() {
		this._buttonFunctions = this._buttonCwSelectFunctions
	}

	buttonMainFunctions() {
		this._buttonFunctions = this._buttonMainFunctions
	}

	changeFreq = dir => this._tcvr.freq = dir === '+' ? (this._tcvr.freq + this._tcvr.step) : (this._tcvr.freq - this._tcvr.step)
	changeRit = dir => this._tcvr.freq = dir === '+' ? (this._tcvr.freq + 10) : (this._tcvr.freq - 10)
	changeWpm = dir => this._tcvr.wpm += (dir === '+' ? 1 : -1)
	changeFilter = dir => this._tcvr.filter = this._tcvr.filters[this._rotateByDir(dir, this._tcvr.filters, this._tcvr.filters.indexOf(this._tcvr.filter))]
	setPtt = state => this._tcvr.ptt = state
	switchStep = _ => this._tcvr.step = this._tcvr.steps[this._shiftIndex(this._tcvr.steps, this._tcvr.steps.indexOf(this._tcvr.step))]
	switchBand = _ => this._tcvr.band = this._shiftIndex(this._tcvr.bands, this._tcvr.band)
	switchGain = _ => this._tcvr.gain = this._tcvr.gains[this._unshiftIndex(this._tcvr.gains, this._tcvr.gains.indexOf(this._tcvr.gain))]
	switchMode = _ => this._tcvr.mode = this._shiftIndex(this._tcvr.modes, this._tcvr.mode)
	switchFilter = _ => this._tcvr.filter = this._tcvr.filters[this._shiftIndex(this._tcvr.filters, this._tcvr.filters.indexOf(this._tcvr.filter))]
	cwmem = (mem, { repeat = false }) => {
		// TODO
	}
	
	_rotateByDir(dir, list, index) {
		return dir === '+' ? this._shiftIndex(list, index) : this._unshiftIndex(list, index)
	}

	_shiftIndex(list, index) {
		return (index + 1) < list.length ? (index + 1) : 0
	}

	_unshiftIndex(list, index) {
		return (index == 0 ? list.length : index) - 1
	}

}