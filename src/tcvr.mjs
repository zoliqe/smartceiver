import {TcvrSignal, SignalType} from './utils/signals.mjs'
import { SignalBus } from './utils/signals.mjs'

// const _bands = ['1.8', '3.5', '7', /* '10.1', */ '14', /* '18', */ '21', /* '24', */ '28']
// const _bandLowEdges = [1810, 3500, 7000, /* 10100, */ 14000, /* 18068, */ 21000, /* 24890, */ 28000]
// const _startFreqFromLowEdge = 21
// const _modes = ['LSB', 'USB', 'CW', /*'CWR'*/] // order copies mode code for MDn cmd
const _filters = {
	'CW': {min: 200, max: 2000}, 'CWR': {min: 200, max: 2000},
	'LSB': {min: 1800, max: 3000}, 'USB': {min: 1800, max: 3000}
}
// const defaultMode = Mode.CW
const _sidetoneFreq = 650

class Transceiver {

	#props
	#state = {}
	#defaults = { rit: 0, xit: 0, step: 20, wpm: 28, paddleReverse: false }
	#bus = new SignalBus()
	#acl = []

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

	async switchPower(connector, remoddleOptions) {
		if (this._port) {
			this._d('disconnect', this._port && this._port.constructor.id)
			this.controller = null
			this.disconnectRemoddle()
			this._port.disconnect()
			this._port.signals.out.unbind(this)
			this._port = null
			
			this.fire(new TcvrSignal(SignalType.pwrsw, false), true)
			this._unbindSignals()
			this.#props = null
		} else if (connector) {
			this._d('connect connector', connector.id)
			this.connectRemoddle(remoddleOptions)
			this._port = await connector.connect(this)
			this._bindSignals()
			this._port.signals.out.bind(this.#bus)
			
			await this._initState(connector)
			this.fire(new TcvrSignal(SignalType.pwrsw, this._port != null), true)
			// const ctlModule = await import('./remoddle/controls.mjs')
			// this._controls = new ctlModule.TcvrControls(this)

			window.onbeforeunload = _ => {
				this.disconnectRemoddle()
				this._port && this._port.disconnect()
			}
		}
	}

	async _initState(connector) {
		this.#state = {} // TODO load state from KV storage
		Object.keys(this.#defaults).forEach(this._mergeDefault)
		this.#state.ptt = false
		this.#state.keyed = false

		const props = await connector.tcvrProps
		const defaults = await connector.tcvrDefaults
		this._mergePropsToState(props, defaults)

		// reset tcvr configuration
		this.band = this.#state.band
		this.wpm = this.#state.wpm
	}

	_mergeDefault(prop) {
		this.#state[prop] = this.#state[prop] || this.#defaults[prop]
	}

	_mergePropsToState(props, defaults) {
		if (props == null) throw new Error('TCVR: Connector returns empty props!')
		this._buildFreqTable(props)
		this._buildFilterTable(props)
		this._buildGainsTable(props)
		
		if (!this.#state.band || !props.bands.includes(this.#state.band))
			this.#state.band = defaults.band
		if (!this.#state.mode || !props.modes.includes(this.#state.mode))
			this.#state.mode = defaults.mode
		if (!this.#state.agc || !props.agcTypes.includes(this.#state.agc))
			this.#state.agc = defaults.agc
		
		this.#props = props // set field after everything is set
	}

	_buildFreqTable(props) {
		this.#state.freq = this.#state.freq || {}
		this.#state.split = this.#state.split || {}
		for (let band of props.bands) {
			this.#state.freq[band.id] = this.#state.freq[band.id] || {}
			this.#state.split[band.id] = this.#state.split[band.id] || {}
			for (let mode of props.modes) {
				this.#state.freq[band.id][mode] = this.#state.freq[band.id][mode] || band.freqFrom
				this.#state.split[band.id][mode] = this.#state.split[band.id][mode] || 0
			}
			this.#state.gains[band.id] = 0
		}
	}
		
	_buildFilterTable(props) {
		this.#state.filters = this.#state.filters || {}
		props.modes.forEach(mode => 
				    this.#state.filters[mode] = this.#state.filters[mode] || _filters[mode].max)
	}
	
	_buildGainsTable(props) {
		this.#state.gains = this.#state.gains || {}
		props.bands.forEach(band => {
			const gain = this.#state.gains[band]
			this.#state.gains[band] = (gain && props.gains(band).includes(gain)) || 0
		})
	}

	_bindSignals() {
		this.bind(SignalType.keyDit, 'tcvr', _ => this._keyTx())
		this.bind(SignalType.keyDah, 'tcvr', _ => this._keyTx())
		this.bind(SignalType.keySpace, 'tcvr', _ => this._keyTx())
	}

	_unbindSignals() {
		this.unbind('tcvr')
	}

	keepAlive() {
		this.online && this.fire(new TcvrSignal(SignalType.keepAlive, Date.now()))
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
			this._remoddle.reverse = this.reversePaddle
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
		if (!this.#state.keyed) {
			this.#state.keyed = true
			this.fire(new TcvrSignal(SignalType.keyTx, true))
		}
		if (this._txTimer) {
			clearTimeout(this._txTimer)
			this._txTimer = null
		}
		this._txTimer = setTimeout(() => {
			this._txTimer = null
			if (this.#state.keyed) {
				this.#state.keyed = false
				this.fire(new TcvrSignal(SignalType.keyTx, false))
			} 
		}, 100)
	}

	get ptt() {
		return this.#state.ptt
	}
	ptt(controller, state) {
		if (!this.online || this._denieded(controller)) return
		if (this.#state.mode !== Modes.LSB && this.#state.mode !== Modes.USB) return
		this.#state.ptt = state
		this._d("ptt", status)
		this.fire(new TcvrSignal(SignalType.ptt, state))
	}

	get wpm() {
		return this.#state.wpm
	}
	wpm(controller, wpm) {
		if (!this.online || this._denieded(controller)) return
		if (wpm < 16 || wpm > 40) return
		this._d("wpm", wpm)
		this.#state.wpm = wpm
		this.fire(new TcvrSignal(SignalType.wpm, wpm))
	}

	get reversePaddle() {
		return this.#state.paddleReverse
	}
	reversePaddle(controller, value) {
		if (!this.online || this._denieded(controller)) return
		this.#state.paddleReverse = value
		this._d('reverse', value)
		this.fire(new TcvrSignal(SignalType.reverse, value))
	}

	get connectorId() {
		return this._connectorId
	}

	get online() {
		return this._port && this._port.connected && this.#props
	}

	get bands() {
		return this.#props && this.#props.bands
	}

	get band() {
		return this.#state.band
	}
	band(controller, band) {
		if (!this.online || this._denieded(controller)) return
		if (!this.#props.bands.includes(band)) return

		this._d("band", band)
		this.#state.band = band
		this.freq = this.#state.freq[this.#state.band][this.#state.mode] // call setter
		// reset state - some tcvrs may store state on per band basis
		setTimeout(_ => {
			this.fire(new TcvrSignal(SignalType.mode, this.mode))
			this.fire(new TcvrSignal(SignalType.gain, this.gain))
			this.fire(new TcvrSignal(SignalType.agc, this.agc))
			this.fire(new TcvrSignal(SignalType.filter, {filter: this.filter, mode: this.mode}))
		}, 2000) // wait for band change on tcvr
	}

	_outOfBand(f) {
		const band = Band.byFreq(f)
		return !band || !this.bands.includes(band)
	}

	get freq() {
		return this.#state.freq[this.#state.band][this.#state.mode]
	}
	freq(controller, freq) {
		if (!this.online || this._denieded(controller)) return
		if (this._outOfBand(freq)) return
		// if (freq < (_bandLowEdges[this._band] - 1) * 1000 || freq > (_bandLowEdges[this._band] + 510) * 1000)
		// 	return
		this.#state.freq[this.#state.band][this.#state.mode] = freq
		this._d("freq", freq)
		this.fire(new TcvrSignal(SignalType.freq, freq))
	}

	get split() {
		return this.#state.split[this.#state.band][this.#state.mode]
	}
	split(controller, freq) {
		if (!this.online || this._denieded(controller)) return
		if (this._outOfBand(freq) || Band.byFreq(freq) !== Band.byFreq(this.freq)) return
		this.#state.split[this.#state.band][this.#state.mode] = freq
		this._d('split', freq)
		this.fire(new TcvrSignal(SignalType.split, freq))
	}
	clearSplit() {
		this.split = 0
	}

	get rit() {
		return this.#state.rit
	}
	rit(controller, value) {
		if (!this.online || this._denieded(controller)) return
		this._d('rit', value)
		if (Math.abs(value) < 10000) {
			this.#state.rit = value
			this.fire(new TcvrSignal(SignalType.rit, value))
		}
	}
	clearRit() {
		this.rit = 0
	}

	get xit() {
		return this.#state.xit
	}
	xit(controller, value) {
		if (!this.online || this._denieded(controller)) return
		this._d('xit', value)
		if (Math.abs(value) < 10000) {
			this.#state.xit = value
			this.fire(new TcvrSignal(SignalType.xit, value))
		}
	}
	clearXit() {
		this.xit = 0
	}

	get steps() {
		return [20, 200]
	}
	get step() {
		return this.#state.step
	}
	step(controller, value) {
		if (this._denieded(controller)) return
		this._d('step', value)
		if (this.steps.includes(value)) {
			this.#state.step = value
			this.fire(new TcvrSignal(SignalType.step, value))
		}
	}

	get modes() {
		return this.#props && this.#props.modes
	}
	get mode() {
		return this.#state.mode
	}
	mode(controller, value) {
		if (!this.online || this._denieded(controller)) return
		this._d("mode", value)
		if (this.modes.includes(mode)) {
			this.#state.mode = value
			this.fire(new TcvrSignal(SignalType.mode, this.#state.mode))
			this.fire(new TcvrSignal(SignalType.freq, this.#state.freq[this.#state.band][this.#state.mode]))
			this.fire(new TcvrSignal(SignalType.filter, {filter: this.filter, mode: this.mode}))
		}
	}

	get filters() {
		return this.#props && this.#props.filters(this.mode)
	}
	get filter() {
		return this.#state.filter[this.mode]
	}
	filter(controller, bw) {
		if (!this.online || this._denieded(controller)) return
		this._d('filter', bw)
		const filterRange = _filters[this.mode]
		if (filterRange.min <= bw && filterRange.max >= bw) {
			this.#state.filter[this.mode] = bw
			this.fire(new TcvrSignal(SignalType.filter, {filter: bw, mode: this.mode}))
		}
	}

	get gains() {
		return this.#props && this.#props.bandGains[this.band]
	}

	get gain() {
		return this.#state.gain[this.band]
	}
	gain(controller, value) {
		if (!this.online || this._denieded(controller)) return
		if (this.gains.includes(value)) {
			this.#state.gain[this.band] = value
			this.fire(new TcvrSignal(SignalType.gain, value))
		}
	}

	get agcTypes() {
		return this.#props && this.#props.agcTypes
	}
	get agc() {
		return this.#state.agc
	}
	agc(controller, value) {
		if (!this.online || this._denieded(controller)) return
		if (this.agcTypes.includes(value)) {
			this.#state.agc = value
			this._d('agc', value)
			this.fire(new TcvrSignal(SignalType.agc, value))
		}
	}

	toggleFast() {
		this.#state.step = this.#state.step == 20 ? 200 : 20
	}

	bind(type, owner, callback) {
		this.#bus.bind(type, owner, callback)
	}

	unbind(owner) {
		this.#bus.unbind(owner)
	}

	fire(signal, force) {
		if (!force && !this.online) return false
		this.#bus.fire(signal)
	}

	register(controller) {
		if (controller.exclusive) {
			this.#acl.forEach(ctlr => ctlr.unregister())
			this.#acl = []
		}
		this.#acl.push(controller)
	}

	_denieded(controller) {
		return this.#acl.find(ctlr => controller.id === ctlr.id) == null
	}

	_d(what, value) {
		console.debug(`[${new Date().toJSON()}] ${what}:`, value);
	}
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
['FAST', 'SLOW', 'MEDIUM', 'AUTO', 'OFF'].forEach(agc => _agcTypes[agc] = agc)
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
			this.#bandGains = {}
			bands.forEach(b => this.#bandGains[b] = [0])
		}

		if (modeFilters && modeFilters.length) {
			this.#modeFilters = modeFilters
		} else {
			this.#modeFilters = {}
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
