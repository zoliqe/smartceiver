
export class TcvrController {
	#id
	#registered
	#tcvr

	constructor(controllerId) {
		this.#id = controllerId
	}

	get id() {
		return this.#id
	}

	get active() {
		return this.#registered
	}

	unregister() {
		this.#registered = false
		this.#tcvr = null
	}

	registerTo(tcvr) {
		tcvr.register(this)
		this.#tcvr = tcvr
		this.#registered = true
	}

	async switchPower(connector, remoddleOptions) {
		await this.#tcvr && this.#tcvr.switchPower(connector, remoddleOptions)
	}

	set ptt(value) {
		this.#tcvr && this.#tcvr.ptt(this, value)
	}

	set wpm(value) {
		this.#tcvr && this.#tcvr.wpm(this, value)
	}

	set reversePaddle(value) {
		this.#tcvr && this.#tcvr.reversePaddle(this, value)
	}

	get bands() {
		return this.#tcvr && this.#tcvr.bands
	}
	// get band() {
	// 	return this.#tcvr && this.#tcvr.band
	// }
	set band(value) {
		this.#tcvr && this.#tcvr.band(this, value)
	}

	// get freq() {
	// 	return this.#tcvr && this.#tcvr.freq
	// }
	set freq(value) {
		this.#tcvr && this.#tcvr.freq(this, value)
	}

	// get split() {
	// 	return this.#tcvr && this.#tcvr.split
	// }
	set split(value) {
		this.#tcvr && this.#tcvr.split(this, value)
	}

	// get rit() {
	// 	return this.#tcvr && this.#tcvr.rit
	// }
	set rit(value) {
		this.#tcvr && this.#tcvr.rit(this, value)
	}

	// get xit() {
	// 	return this.#tcvr && this.#tcvr.xit
	// }
	set xit(value) {
		this.#tcvr && this.#tcvr.xit(this, value)
	}

	get steps() {
		return this.#tcvr && this.#tcvr.steps
	}
	// get step() {
	// 	return this.#tcvr && this.#tcvr.step
	// }
	set step(value) {
		this.#tcvr && this.#tcvr.step(this, value)
	}

	get modes() {
		return this.#tcvr && this.#tcvr.modes
	}
	// get mode() {
	// 	return this.#tcvr && this.#tcvr.mode
	// }
	set mode(value) {
		this.#tcvr && this.#tcvr.mode(this, value)
	}

	get filters() {
		return this.#tcvr && this.#tcvr.filters
	}
	// get filter() {
	// 	return this.#tcvr && this.#tcvr.filter
	// }
	set filter(value) {
		this.#tcvr && this.#tcvr.filter(this, value)
	}

	get gains() {
		return this.#tcvr && this.#tcvr.gains
	}
	// get gain() {
	// 	return this.#tcvr && this.#tcvr.gain
	// }
	set gain(value) {
		this.#tcvr && this.#tcvr.gain(this, value)
	}

	get agcTypes() {
		return this.#tcvr && this.#tcvr.agcTypes
	}
	// get agc() {
	// 	return this.#tcvr && this.#tcvr.agc
	// }
	set agc(value) {
		this.#tcvr && this.#tcvr.agc(this, value)
	}
}
