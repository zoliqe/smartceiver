import { Keyer } from "./adapter/keyer.mjs";

const startFrequency = 7020000

class Band {
	constructor(name, id, minFreq, maxFreq) {
		this.name = name 
		this.id = id
		this.freqFrom = minFreq
		this.freqTo = maxFreq
	}

	static byId(id) {
		// return _bands.find(band => band.id == id)
		return _bands[id]
	}

	static byFreq(freq) {
		const f = Number(freq)
		return Object.values(_bands)
			.find(band => band.freqFrom <= f && band.freqTo >= f)
	}
}

const _bands = {}
const addBand = (name, id, minFreq, maxFreq) => _bands[id] = new Band(name, id, minFreq * 1000, maxFreq * 1000)
addBand(1.8,	160,	1810,			2000)
addBand(3.5,	80,		3500,			3800)
addBand(5,		60,		5351,			5368)
addBand(7,		40,		7000,			7200)
addBand(10.1,	30,		10100,		10150)
addBand(14,		20,		14000,		14350)
addBand(18,		17,		18068,		18168)
addBand(21,		15,		21000,		21450)
addBand(24,		12,		24890,		24990)
addBand(28,		10,		28000,		29700)
addBand(50,		6,		50000,		54000)
addBand(70,		4,		70000,		70500)
addBand(144,	2,		144000,		146000)
addBand(430,	70,		430000,		440000)
addBand(1296,	23,		1240000,	1300000)
const bands = Object.freeze(_bands)

// class Mode {
// 	constructor(id) {
// 		this.id = id
// 	}

// 	static byId(id) {
// 		return _modes.find(mode => mode.id == id)
// 	}
// }

const _modes = {}
const addMode = (id) => _modes[id] = id //_modes.push(new Mode(id))
addMode('CW')
addMode('CWR')
addMode('LSB')
addMode('USB')
addMode('RTTY')
addMode('RTTYR')
addMode('NFM')
addMode('WFM')
addMode('AM')
const modes = Object.freeze(_modes)

const _agcTypes = {}
const addAgc = (agc) => _agcTypes[agc] = agc
addAgc('FAST')
addAgc('SLOW')
addAgc('MEDIUM')
addAgc('AUTO')
addAgc('NONE')
const agcTypes = Object.freeze(_agcTypes)

class TcvrAdapter {
	constructor(tcvrAdapter) {
		this._adapter = tcvrAdapter

		tcvrAdapter.keyerConfiguration = tcvrAdapter.keyerConfiguration || {}
		if (!tcvrAdapter.keyerConfiguration.connector)
			tcvrAdapter.keyerConfiguration.connector = tcvrAdapter.connector
		this._keyer = new Keyer(tcvrAdapter.keyerConfiguration)

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

	async on() {
		this._adapter.init && (await this._adapter.init())
	}

	off() {
		this._adapter && this._adapter.close && this._adapter.close()
		this._adapter = null
	}

	get bands() {
		return this._adapter.bands || [] //.map(Band.byId)
	}

	get modes() {
		return this._adapter.modes || [modes.LSB]
	}

	get filters() {
		if (!this._mode) return []
		return this._adapter.filters(this._mode) || []
	}

	get filtersAllModes() {
		const filters = {}
		this.modes.forEach(mode => filters[mode] = this._adapter.filters(mode))
		return filters
	}

	get attnLevels() {
		return this._adapter.attns || []
	}

	get preampLevels() {
		return this._adapter.preamps || []
	}

	get gainLevels() {
		const res = this.attnLevels.map(v => 0 - v)
		res.push(0)
		res.push(...this.preampLevels)
		return res
	}

	get agcTypes() {
		return this._adapter.agcTypes || []
	}

	get info() {
		return {
			bands: this.bands, 
			modes: this.modes, //mode: this.mode,
			filters: this.filtersAllModes, //filter: this.filter,
			gainLevels: this.gainLevels, //gain: this.gain,
			attnLevels: this.attnLevels,
			preampLevels: this.preampLevels,
			agcTypes: this.agcTypes, //agc: this.agc,
			//frequency: this.frequency, split: this.split,
			//wpm: this.wpm,
		}
	}

	// get wpm() {
	// 	return this._keyer && this._keyer.wpm
	// }

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

	_findNearestWiderFilter(valueString) {
		const value = parseInt(valueString, 10)
		const values = this.filters
			.map(bw => parseInt(bw, 10))
			.sort((a, b) => a - b)
		const widest = parseInt(values[values.length - 1], 10)
		if (isNaN(value) || isNaN(widest)) return values[values.length - 1]

		const result = values
			.filter(bw => !isNaN(bw) && bw >= value)
			.reduce((nearestWider, bw) => bw < nearestWider ? bw : nearestWider, widest)
		console.debug('_findNearestWiderFilter:', {'for': valueString, 'found': result})
		if (result == null) return String(widest)
		return String(result)
	}

	// get filter() {
	// 	return this._filter
	// }
}

export {TcvrAdapter, bands, modes, agcTypes}
