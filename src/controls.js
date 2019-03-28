
class TcvrControls {

	up = '+'
	dn = '-'

	freq = dir => this._tcvr.freq = dir === this.up ? (this._tcvr.freq + this._tcvr.step) : (this._tcvr.freq - this._tcvr.step)
	rit = dir => this._tcvr.freq = dir === this.up ? (this._tcvr.freq + 10) : (this._tcvr.freq - 10)
	wpm = dir => this._tcvr.wpm += (dir === this.up ? 1 : -1)
	ptt = state => this._tcvr.ptt = state
	toggleFast = _ => this._tcvr.step = this._tcvr.steps[this._shiftIndex(this._tcvr.steps, this._tcvr.steps.indexOf(this._tcvr.step))]
	switchBand = _ => this._tcvr.band = this._shiftIndex(this._tcvr.bands, this._tcvr.band)
	switchGain = _ => this._tcvr.gain = this._tcvr.gains[this._unshiftIndex(this._tcvr.gains, this._tcvr.gains.indexOf(this._tcvr.gain))]
	switchMode = _ => this._tcvr.mode = this._shiftIndex(this._tcvr.modes, this._tcvr.mode)
	switchFilter = _ => this._tcvr.filter = this._tcvr.filters[this._shiftIndex(this._tcvr.filters, this._tcvr.filters.indexOf(this._tcvr.filter))]

	_shiftIndex(list, index) {
		return (index + 1) < list.length ? (index + 1) : 0
	}

	_unshiftIndex(list, index) {
		return (index == 0 ? list.length : index) - 1
	}

	constructor(tcvr) {
		this._tcvr = tcvr
	}

	remoddleCommand(c) {
		if (c.charCodeAt(0) <= 32) return // whitespace
		// console.log('remoddle:', c)
		if      (c === '-') this.fire(new TcvrEvent(EventType.keyDah, 1))
		else if (c === '.') this.fire(new TcvrEvent(EventType.keyDit, 1))
		else if (c === '_') this.fire(new TcvrEvent(EventType.keySpace, 1))
		else if (c === '>') this.freq(this.up) // enc1 up
		else if (c === '<') this.freq(this.dn) // enc1 dn
		else if (c === ']') this.wpm(this.up) // enc2 up
		else if (c === '[') this.wpm(this.dn) // enc2 dn
		else if (c === '}') this.rit(this.up) // enc3 up
		else if (c === '{') this.rit(this.dn) // enc3 dn
		else if (c === '!') {} // btn1 push
		else if (c === '~') {} // btn2 push
		else if (c === '$') {} // btn3 push // TODO init HOLD timeout which zeroes current fnc (RIT/SPLIT)
		else if (c === '^') {} // btn4 push
		else if (c === '*') {} // btn5 push
		else if (c === ':') {} // btn6 push
		else if (c === ';') this.ptt(true) // btn7 push
		else if (c === '`') {} // btn8 push // TODO init HOLD Timeout after which play cwmem repeated
		else if (c === '@') this.toggleFast() // btn1 release
		else if (c === '#') {} // btn2 release // TODO enc2 fnc switch (WPM/FILTER)
		else if (c === '%') {} // btn3 release // TODO enc3 fnc switch (RIT/SPLIT), clear HOLD timeout
		else if (c === '&') this.switchGain() // btn4 release
		else if (c === '?') this.switchBand() // btn5 release
		else if (c === '"') this.switchMode() // btn6 release
		else if (c === '|') this.ptt(false) // btn7 release
		else if (c === '\'') {} // btn8 release // TODO clear HOLD timeout, play cwmem nonrepeat
		else console.error('Remoddle send unknown command:', c)
	}

}