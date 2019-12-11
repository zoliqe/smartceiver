import {TcvrEvent, EventType} from './utils/events.mjs'

const _bands = ['1.8', '3.5', '7', /* '10.1', */ '14', /* '18', */ '21', /* '24', */ '28']
const _bandLowEdges = [1810, 3500, 7000, /* 10100, */ 14000, /* 18068, */ 21000, /* 24890, */ 28000]
const _startFreqFromLowEdge = 21
const _modes = ['LSB', 'USB', 'CW', /*'CWR'*/] // order copies mode code for MDn cmd
const _filters = {
	'CW': {min: 200, max: 2000}, 'CWR': {min: 200, max: 2000},
	'LSB': {min: 1800, max: 3000}, 'USB': {min: 1800, max: 3000}
}
const _sidetoneFreq = 650

class Transceiver {

	#props
	#state = {
		// bands: [Bands[40]],
		band: 40,
		mode: Modes.CW,
		freq: {40: 7021000},
		split: {},
		rit: 0,
		xit: 0,
		step: 20,
		gains: {40: 0},
		agc: AgcTypes.AUTO,
		filters: {'CW': 2000},
		wpm: 28,
		ptt: false,
		keyed: false,
		paddleReverse: false,
	}
	#listeners = {}

	constructor() {
		// this._band = 2
		// this._mode = 2
		// this._freq = {}
		// this._split = {}
		// this._gain = {}
		// for (let band in _bands) {
		// 	this._freq[band] = {}
		// 	this._split[band] = {}
		// 	for (let mode in _modes) {
		// 		this._freq[band][mode] = (_bandLowEdges[band] + _startFreqFromLowEdge) * 1000
		// 		this._split[band][mode] = 0
		// 	}
		// 	this._gain[band] = 0
		// }
		// console.log(`freqs=${this._freq}`)

		// this._filter = []
		// for (let mode in _modes) {
		// 	this._filter[mode] = _filters[_modes[mode]].max
		// }

		// this._wpm = 28
		// this._ptt = false
		// this._agc = true
		// this._step = 20
		// this._rit = 0
		// this._xit = 0
		// this._reversePaddle = false
		// this._listeners = {}
		// this._d("tcvr-init", "done")
	}

	async switchPower(connector, remoddleOptions, reversePaddle) {
		if (this._port) {
			this._d('disconnect', this._port && this._port.constructor.id)
			this.controller = null
			this.disconnectRemoddle()
			this._port.disconnect()
			this.unbind(connector.id)
			this._port = null
			this.fire(new TcvrEvent(EventType.pwrsw, false), true)
			this._unbindSignals()
		} else if (connector) {
			this._d('connect connector', connector.id)
			this._reversePaddle = reversePaddle
			this.connectRemoddle(remoddleOptions)
			this._port = await connector.connect(this)
			this._bindSignals()
			// reset tcvr configuration
			#props = await connector.tcvrProps
			this._buildFreqTable()
			// TODO check default band,mode,agc,gain, filter
			this.band = #state.band
			this.wpm = #state.wpm
			this.fire(new TcvrEvent(EventType.pwrsw, this._port != null), true)
			// const ctlModule = await import('./remoddle/controls.mjs')
			// this._controls = new ctlModule.TcvrControls(this)

			window.onbeforeunload = _ => {
				this.disconnectRemoddle()
				this._port && this._port.disconnect()
			}
		}
	}

	_buildFreqTable() {
		for (let band of #props.bands) {
			#state.freq[band.id] = {}
			#state.split[band.id] = {}
			for (let mode of #props.modes) {
				#state.freq[band.id][mode] = band.freqFrom + (_startFreqFromLowEdge * 1000)
				#state.split[band.id][mode] = 0
			}
			#state.gains[band.id] = 0
		}
	}

	_bindSignals() {
		this.bind(EventType.keyDit, 'tcvr', _ => this._keyTx())
		this.bind(EventType.keyDah, 'tcvr', _ => this._keyTx())
		this.bind(EventType.keySpace, 'tcvr', _ => this._keyTx())
	}

	_unbindSignals() {
		this.unbind('tcvr')
	}

	async connectRemoddle(options) {
		this.disconnectRemoddle() // remove previous instance

		try {
			const module = await import('./remoddle/connector.mjs')
			this._remoddle = await new module.RemoddleBluetooth(this).connect()
		} catch (error) {
			console.error(`Remoddle: ${error}`)
		}

		if (this._remoddle) {
			this._remoddle.wpm = this.wpm // sync with current wpm state
			this._remoddle.reverse = this._reversePaddle
			const ctlModule = await import('./remoddle/controller.mjs')
			this.controller = new ctlModule.RemoddleController(this)
		}
	}

	disconnectRemoddle() {
		if (this._remoddle) {
			this.unbind(this._remoddle.constructor.id)
			this._remoddle.disconnect()
			this._remoddle = null
		}
	}

	remoddleCommand(c) {
		this.controller && this.controller.remoddleCommand(c)
	}

	_keyTx() {
		if (!#state.keyed) {
			#state.keyed = true
			this.fire(new TcvrEvent(EventType.keyTx, true))
		}
		if (this._txTimer) {
			clearTimeout(this._txTimer)
			this._txTimer = null
		}
		this._txTimer = setTimeout(() => {
			this._txTimer = null
			if (#state.keyed) {
				#state.keyed = false
				this.fire(new TcvrEvent(EventType.keyTx, false))
			} 
		}, 100)
	}

	get ptt() {
		return #state.ptt
	}
	set ptt(state) {
		if (!this.online) return
		if (#state.mode !== Modes.LSB && #state.mode !== Modes.USB) return
		#state.ptt = state
		this._d("ptt", status)
		this.fire(new TcvrEvent(EventType.ptt, state))
	}

	get wpm() {
		return #state.wpm
	}
	set wpm(wpm) {
		if (!this.online) return
		if (wpm < 16 || wpm > 40) return
		this._d("wpm", wpm)
		#state.wpm = wpm
		this.fire(new TcvrEvent(EventType.wpm, wpm))
	}

	get reverse() {
		return #state.paddleReverse
	}
	set reverse(value) {
		if (!this.online) return
		#state.paddleReverse = value
		this._d('reverse', value)
		this.fire(new TcvrEvent(EventType.reverse, value))
	}

	get connectorId() {
		return this._connectorId
	}

	get online() {
		return this._port && this._port.connected
	}

	get bands() {
		return #props.bands
	}

	get band() {
		return #state.band
	}
	set band(band) {
		if (!this.online) return
		if (!#props.bands.includes(band)) return

		this._d("band", band)
		#state.band = band
		this.freq = #state.freq[#state.band][#state.mode] // call setter
		// reset state - some tcvrs may store state on per band basis
		setTimeout(_ => {
			this.fire(new TcvrEvent(EventType.mode, this.mode))
			this.fire(new TcvrEvent(EventType.gain, this.gain))
			this.fire(new TcvrEvent(EventType.agc, this.agc))
			this.fire(new TcvrEvent(EventType.filter, this.filter))
		}, 2000) // wait for band change on tcvr
	}

	_outOfBand(f) {
		const band = Band.byFreq(f)
		return !band || !this.bands.includes(band)
	}

	get freq() {
		return #state.freq[#state.band][#state.mode]
	}
	set freq(freq) {
		if (!this.online) return
		if (this._outOfBand(freq)) return
		// if (freq < (_bandLowEdges[this._band] - 1) * 1000 || freq > (_bandLowEdges[this._band] + 510) * 1000)
		// 	return
		#state.freq[#state.band][#state.mode] = freq
		this._d("freq", freq)
		this.fire(new TcvrEvent(EventType.freq, freq))
	}

	get split() {
		return #state.split[#state.band][#state.mode]
	}
	set split(freq) {
		if (!this.online) return
		if (this._outOfBand(freq) || Band.byFreq(freq) !== Band.byFreq(this.freq)) return
		#state.split[#state.band][#state.mode] = freq
		this._d('split', freq)
		this.fire(new TcvrEvent(EventType.split, freq))
	}
	clearSplit() {
		this.split = 0
	}

	get rit() {
		return #state.rit
	}
	set rit(value) {
		if (!this.online) return
		this._d('rit', value)
		if (Math.abs(value) < 10000) {
			#state.rit = value
			this.fire(new TcvrEvent(EventType.rit, value))
		}
	}
	clearRit() {
		this.rit = 0
	}

	get xit() {
		return #state.xit
	}
	set xit(value) {
		if (!this.online) return
		this._d('xit', value)
		if (Math.abs(value) < 10000) {
			#state.xit = value
			this.fire(new TcvrEvent(EventType.xit, value))
		}
	}
	clearXit() {
		this.xit = 0
	}

	get steps() {
		return [20, 200]
	}
	get step() {
		return #state.step
	}
	set step(value) {
		this._d('step', value)
		if (this.steps.includes(value)) {
			#state.step = value
			this.fire(new TcvrEvent(EventType.step, value))
		}
	}

	get modes() {
		return #props.modes
	}
	get mode() {
		return #state.mode
	}
	set mode(value) {
		if (!this.online) return
		this._d("mode", value)
		if (this.modes.includes(mode)) {
			#state.mode = value
			this.fire(new TcvrEvent(EventType.mode, #state.mode))
			this.fire(new TcvrEvent(EventType.freq, #state.freq[#state.band][#state.mode]))
			this.fire(new TcvrEvent(EventType.filter, #state.filter[#state.mode]))
		}
	}

	get filter() {
		return #state.filter[#state.mode]
	}
	set filter(bw) {
		if (!this.online) return
		this._d('filter', bw)
		const filterRange = _filters[this.mode]
		if (filterRange.min <= bw && filterRange.max >= bw) {
			#state.filter[#state.mode] = bw
			this.fire(new TcvrEvent(EventType.filter, {filter: bw, mode: #state.mode}))
		}
	}

	get gains() {
		return #props.bandGains[#state.band]
	}

	get gain() {
		return #state.gain[#state.band]
	}
	set gain(value) {
		if (this.online && this.gains.includes(value)) {
			#state.gain[#state.band] = value
			this.fire(new TcvrEvent(EventType.gain, value))
		}
	}

	get agcTypes() {
		return #props.agcTypes
	}

	get agc() {
		return #state.agc
	}
	set agc(value) {
		if (this.online && this.agcTypes.includes(value)) {
			#state.agc = value
			this._d('agc', value)
			this.fire(new TcvrEvent(EventType.agc, value))
		}
	}

	toggleFast() {
		#state.step = #state.step == 20 ? 200 : 20
	}

	bind(type, owner, callback) {
		if (!(type in #listeners)) {
			#listeners[type] = []
		}
		#listeners[type].push(new EventListener(owner, callback))
		this._d(`bind: ${type} for ${owner}, callbacks`, #listeners[type].length)
	}

	unbind(owner) {
		for (let type in #listeners) {
			let stack = #listeners[type]
			for (let i = 0, l = stack.length; i < l; i++) {
				if (stack[i] && stack[i].owner == owner) {
					this._d(`unbind ${type} for ${owner}`)
					stack.splice(i, 1)
				}
			}
		}
	}

	fire(event, force) {
		if (!force && !this.online) return false
		let stack = #listeners[event.type]
		stack && stack.forEach(listener => listener.callback.call(this, event))
		return true //!event.defaultPrevented;
	}

	_d(what, value) {
		console.debug(`[${new Date()}] ${what}:`, value);
	}
}

class EventListener {
	constructor(owner, callback) {
		this._owner = owner
		this._callback = callback
	}
	get owner() { return this._owner }
	get callback() { return this._callback }
}


class Band {

	#name
	#id
	#freqFrom
	#freqTo

	constructor(name, id, minFreq, maxFreq) {
		this.#name = name
		this.#id = id
		this.#freqFrom = minFreq
		this.#freqTo = maxFreq
	}

	static byId(id) {
		// return _bands.find(band => band.id == id)
		return Bands[id]
	}

	static byFreq(freq) {
		const f = Number(freq)
		return Object.values(Bands)
			.find(band => band.freqFrom <= f && band.freqTo >= f)
	}

	toString() {
		return JSON.stringify(this)
	}

	toJSON() {
		return {id: this.#id, name: this.#name, freqFrom: this.#freqFrom, freqTo: this.#freqTo}
	}

	get name() {
		return this.#name
	}

	get id() {
		return this.#id
	}

	get freqFrom() {
		return this.#freqFrom
	}

	get freqTo() {
		return this.#freqTo
	}
}

const _bands = {}
// const addBand = ([name, id, minFreq, maxFreq]) => _bands[id] = new Band(name, id, minFreq * 1000, maxFreq * 1000)
[
	[1.8,		160,		 1810,			2000],
	[3.5,		80,			 3500,			3800],
	[5,			60,			 5351,			5368],
	[7,			40,			 7000,			7200],
	[10.1,	30,			10100,		 10150],
	[14,		20,			14000,		 14350],
	[18,		17,			18068,		 18168],
	[21,		15,			21000,		 21450],
	[24,		12,			24890,		 24990],
	[28,		10,	 		28000,		 29700],
	[50,		6,			50000,		 54000],
	[70,		4,			70000,		 70500],
	[144,		2,		 144000,		146000],
	[430,		70,		 430000,		440000],
	[1296,	23,		1240000,	 1300000]
].forEach(([name, id, minFreq, maxFreq]) => _bands[id] = new Band(name, id, minFreq * 1000, maxFreq * 1000))
const Bands = Object.freeze(_bands)

const _modes = {}
['CW', 'CWR', 'LSB', 'USB', 'RTTY', 'RTTYR', 'NFM', 'WFM', 'AM'].forEach(id => _modes[id] = id)
const Modes = Object.freeze(_modes)

const _agcTypes = {}
['FAST', 'SLOW', 'MEDIUM', 'AUTO', 'NONE'].forEach(agc => _agcTypes[agc] = agc)
const AgcTypes = Object.freeze(_agcTypes)

class TransceiverProperties {

	#bands
	#modes
	#agcTypes
	#bandGains
	#modeFilters

	constructor({ bands, modes, agcTypes, bandGains, modeFilters }) {
		if (!bands || !bands.length) throw new Error('No bands declared')
		this.#bands = bands
		this.#modes = modes && modes.length ? modes : [Modes.LSB]
		this.#agcTypes = agcTypes && agcTypes.length ? agcTypes : [AgcTypes.NONE]

		if (bandGains && bandGains.length) {
			this.#bandGains = bandGains
		} else {
			this.#bandGains = []
			bands.forEach(b => this.#bandGains[b] = [0])
		}

		if (modeFilters && modeFilters.length) {
			this.#modeFilters = modeFilters
		} else {
			this.#modeFilters = []
			modes.forEach(m => this.#modeFilters[m] = [3000])
		}
	}

	static fromJSON(json) {
		return new TransceiverProperties(JSON.parse(json))
	}

	toJSON() {
		return {
			bands: this.#bands,
			modes: this.#modes,
			agcTypes: this.#agcTypes,
			bandGains: this.#bandGains,
			modeFilters: this.#modeFilters
		}
	}

	toString() {
		return JSON.stringify(this)
	}

	gains(band) {
		return this.#bands.includes(band) ? [...this.#bandGains[band]] : []
	}

	filters(mode) {
		return this.#modes.includes(mode) ? [...this.#modeFilters[mode]] : []
	}

	get bands() {
		return [...this.#bands]
	}

	get modes() {
		return [...this.#modes]
	}

	get agcTypes() {
		return [...this.#agcTypes]
	}

	get bandGains() {
		const bandGains = {}
		Object.keys(this.#bandGains)
			.forEach(b => bandGains[b] = [...this.#bandGains[b]])
		return bandGains
	}

	get modeFilters() {
		const modeFilters = {}
		Object.keys(this.#modeFilters)
			.forEach(m => modeFilters[m] = [...this.#modeFilters[m]])
		return modeFilters
	}
}

export {Transceiver, TransceiverProperties, Bands, Modes, AgcTypes}
