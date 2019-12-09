
const adapters = ['elecraft', 'icom', 'kenwood', 'yeasu']
const tcvrs

async function transceivers() {
	if (tcvrs) return tcvrs
	tcvrs = {}
	await adapters.forEach(async (manufacturer) => 
		tcvrs[manufacturer] = (await import(`./${manufacturer}.mjs`)).Adapter.models)
}

async function adapterFor(manufacturer, model, options) {
	const module = await import(`./${manufacturer}.mjs`)
	const adapter = await module.Adapter.forTcvr(model, options)
	return adapter
}

// import { Keyer } from "./adapter/keyer.mjs";

// const startFrequency = 7020000

class TcvrAdapter {
	constructor() {
		// if (this._outOfBand(startFrequency)) {
		// 	this.frequency = this.bands[0].freqFrom + 20*1000
		// } else {
		// 	this.frequency = startFrequency
		// }

		// this.mode = this.modes[0]
		// if (this.agcTypes.length > 0) this.agc = this.agcTypes[0]
		// this.gain = 0
		// if (this.filters.length > 0) this.filter = this.filters[0]
	}

	set wpm(value) {
		this._keyer && (this._keyer.wpm = value)
	}

	set ptt(value) {
		if (this._mode == modes.LSB || this._mode == modes.USB) {
			this._keyer && this._keyer.ptt(value)
		}
	}

	set key(value) {
		if (this._mode == modes.CW || this._mode == modes.CWR) {
			this._keyer && this._keyer.key(value)
		}
	}

	sendCw(msg) {
		this._keyer && this._keyer.send(msg)
	}

	_outOfBand(f) {
		const band = Band.byFreq(f)
		return !band || !this.bands.includes(band)
	}

	set frequency(value) {
		const freq = Number(value)
		if (this._outOfBand(freq)) return

		this._adapter.frequency = freq
		this._freq = freq // for split checks
	}

	// get frequency() {
	// 	return this._freq
	// }

	set split(value) {
		if (!this._freq) return // freq must be set first
		const freq = Number(value)
		if (this._outOfBand(freq) || Band.byFreq(freq) !== Band.byFreq(this._freq)) return

		this._adapter.split = freq
		// this._split = freq
	}

	// get split() {
	// 	return this._split
	// }

	set rit(value) {
		Math.abs(value) < 10000 && (this._adapter.rit = value)
	}

	set xit(value) {
		Math.abs(value) < 10000 && (this._adapter.xit = value)
	}

	clearRit() {
		this._adapter.clearRit()
	}

	clearXit() {
		this._adapter.clearXit()
	}

	set mode(value) {
		if (!value) return
		const mode = modes[value.toUpperCase()]
		if (mode && this.modes.includes(mode)) {
			this._adapter.mode = mode
			this._mode = mode // for filter bank
		}
	}

	// get mode() {
	// 	return this._mode
	// }

	set gain(value) {
		const gain = Number(value)
		if (gain != null && this.gainLevels.includes(gain)) { // could be 0
			let preamp = 0
			let attn = 0
			if (gain < 0) {
				attn = 0 - gain
			} else if (gain > 0) {
				preamp = gain
			}
			this._adapter.attn = attn
			setTimeout(_ => this._adapter.preamp = preamp, 500)
			// this._gain = gain
		}
	}

	// get gain() {
	// 	return this._gain
	// }

	set agc(value) {
		if (!value) return
		const agc = agcTypes[value.toUpperCase()]
		if (agc && this.agcTypes.includes(agc)) {
			this._adapter.agc = agc
			// this._agc = agc
		}
	}

	// get agc() {
	// 	return this._agc
	// }

	set filter(value) {
		if (!this._mode) return // mode must be set first
		// if (value === this._filter) return
		const filter = this._findNearestWiderFilter(value)
		// if (filter === this._filter) return
		this._adapter.filter(filter, this._mode)
		// this._filter = filter
	// if (this.filters.includes(value) && value != this._filter) {
	// 		this._adapter.filter(value, this._mode)
	// 		this._filter = value
	// 	}
	}

	// get filter() {
	// 	return this._filter
	// }
}

export {transceivers, adapterFor}
