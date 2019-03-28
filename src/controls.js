
class TcvrControls {

	up = '+'
	dn = '-'

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

	_rotateByDir(dir, list, index) {
		return dir === '+' ? this._shiftIndex(list, index) : this._unshiftIndex(list, index)
	}

	_shiftIndex(list, index) {
		return (index + 1) < list.length ? (index + 1) : 0
	}

	_unshiftIndex(list, index) {
		return (index == 0 ? list.length : index) - 1
	}

	encoderAvailableFunctions = {
		1: [this.changeFreq],
		2: [this.changeWpm, this.changeFilter],
		3: [this.changeRit]
	}
	encoderFunction = {1: 0, 2: 0, 3: 0}

	switchEncoderFunction = enc => this.encoderFunction[enc] = this._shiftIndex(this.encoderAvailableFunctions[enc], this.encoderFunction[enc])

	rotateEncoder = (enc, dir) => this.encoderAvailableFunctions[enc][this.encoderFunction[enc]](dir)

	constructor(tcvr) {
		this._tcvr = tcvr
	}

	remoddleCommand(c) {
		if (c.charCodeAt(0) <= 32) return // whitespace
		// console.log('remoddle:', c)
		if      (c === '-') this.fire(new TcvrEvent(EventType.keyDah, 1))
		else if (c === '.') this.fire(new TcvrEvent(EventType.keyDit, 1))
		else if (c === '_') this.fire(new TcvrEvent(EventType.keySpace, 1))
		else if (c === '>') this.rotateEncoder(1, '+') // enc1 up
		else if (c === '<') this.rotateEncoder(1, '-') // enc1 dn
		else if (c === ']') this.rotateEncoder(2, '+') // enc2 up
		else if (c === '[') this.rotateEncoder(2, '-') // enc2 dn
		else if (c === '}') this.rotateEncoder(3, '+') // enc3 up
		else if (c === '{') this.rotateEncoder(3, '-') // enc3 dn
		else if (c === '!') {} // btn1 push
		else if (c === '~') {} // btn2 push
		else if (c === '$') {} // btn3 push // TODO init HOLD timeout which zeroes current fnc (RIT/SPLIT)
		else if (c === '^') {} // btn4 push
		else if (c === '*') {} // btn5 push
		else if (c === ':') {} // btn6 push
		else if (c === ';') this.setPtt(true) // btn7 push
		else if (c === '`') {} // btn8 push // TODO init HOLD Timeout after which play cwmem repeated
		else if (c === '@') this.switchStep() // btn1 release
		else if (c === '#') this.switchEncoderFunction(2) // btn2 release
		else if (c === '%') { // btn3 release
			this.switchEncoderFunction(3) // TODO enc3 clear HOLD timeout
		}
		else if (c === '&') this.switchGain() // btn4 release
		else if (c === '?') this.switchBand() // btn5 release
		else if (c === '"') this.switchMode() // btn6 release
		else if (c === '|') this.setPtt(false) // btn7 release
		else if (c === '\'') {} // btn8 release // TODO clear HOLD timeout, play cwmem nonrepeat
		else console.error('Remoddle send unknown command:', c)
	}

}