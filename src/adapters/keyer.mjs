
class Keyer {

	constructor({connector, pttTimeout = 5000}) {
		this._wpm = 0
		this._pttTimeout = pttTimeout
		this._cw = s => connector && connector.keyerCW(s)
		this._speed = v => connector && connector.keyerSpeed(v)
		this._key = state => 
			connector && connector.keyerPin != null && connector.pinState(connector.keyerPin, state)
		this._ptt = state => connector && connector.pttState(state)
		
		connector && connector.keyerState(true)
		this._ptt(false)
	}

	send(msg) {
		if (this.disabled) return
		this._cw(msg)
	}

	ptt(state, timeout = this._pttTimeout) {
		if (state) {
			if (!timeout) return; // disable PTT

			if (this._pttTimer != null) clearTimeout(this._pttTimer)
			this._ptt(true) // this resets powron ptt watchdog counter
			this._pttTimer = setTimeout(() => {
				this._pttTimer = null
				this._ptt(false)
			}, timeout)
		} else {
			this._ptt(false)
			this._pttTimer != null && clearTimeout(this._pttTimer)
			this._pttTimer = null
		}
	}

	key(state, timeout = this._pttTimeout) {
		if (state) {
			if (!timeout) return;

			if (this._keyTimer != null) clearTimeout(this._keyTimer)
			this._key(true) // reset powron watchdog timer
			this._keyTimer = setTimeout(() => {
				this._keyTimer = null
				this._key(false)
			}, timeout)
		} else {
			this._key(false)
			this._keyTimer != null && clearTimeout(this._keyTimer)
			this._keyTimer = null
		}
	}

	get wpm() {
		return this._wpm
	}

	set wpm(value) {
		this._wpm = Number(value)
		if (this.disabled) return
		this._speed(this._wpm)
	}

	get disabled() {
		return this._wpm < 1
	}

}

export {Keyer}
