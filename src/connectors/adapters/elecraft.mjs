import {bands, modes, agcTypes} from '../../tcvr.mjs'
import {delay} from '../../utils/time.mjs'

const _bands = [bands[160], bands[80], bands[40], bands[30], 
	bands[20], bands[17], bands[15], bands[12], bands[10]]
const _modes = [modes.CW, modes.CWR, modes.LSB, modes.USB]
const _agc = [agcTypes.FAST, agcTypes.SLOW]

const MD = {}
MD[modes.CW] = 3
MD[modes.CWR] = 7
MD[modes.LSB] = 1
MD[modes.USB] = 2
MD[modes.RTTY] = 6

const filters = {}
filters[modes.CW] = filters[modes.CWR] = ['1500', '700', '400', '250']
// filters[modes.CW] = filters[modes.CWR] = ['1k5', '700', '400', '200']
filters[modes.LSB] = filters[modes.USB] = ['2100', '2300', '700', '400']
// filters[modes.LSB] = filters[modes.USB] = filters[modes.RTTY] = ['1k5', 'OP1', '400', '200']

class ElecraftTcvr {
	
	_splitState = false
	_rit = 0
	_xit = 0

	constructor(connector, options = {}) {
		this._uart = data => connector.serialData(data + ';')
	}

	static K2(connector) { //baudrate = 4800
		return new ElecraftTcvr(connector)
	}

	async init() {
		await delay(2000) // wait for tcvr internal CPU start
		this._uart('FR0') // set VFO A as RX VFO + cancel SPLIT
	}

	close() {
		this._uart = data => {} // do nothing
	}

	get agcTypes() {
		return _agc
	}

	get bands() {
		return _bands
	}
	
	get modes() {
		return _modes
	}

	get preamps() {
		return [20]
	}

	get attns() {
		return [10]
	}

	filters(mode) {
		return filters[mode]
	}

	set frequency(freq) {
		let cmd = 'FA000'
		if (freq < 10000000) cmd += '0'
		this._uart(cmd + freq)
	}

	set mode(mode) {
		this._uart(`MD${MD[mode]}`)
	}

	set agc(agc) {
		this._uart(`GT00${agc == agcTypes.SLOW ? 4 : 2}`)
	}

	set preamp(gain) {
		this._uart(`PA${gain > 0 ? 1 : 0}`)
	}

	set attn(attn) {
		this._uart(`RA0${attn > 0 ? 1 : 0}`)
	}

	filter(filter, mode) {
		// const count = Object.keys(filters[mode]).length / 2
		const index = filters[mode].indexOf(filter)
		if (index < 0) return
		this._uart('K22')
		this._uart(`FW0000${index + 1}`)
		this._uart('K20')
		// for (let i = 0; i < count; i++) this._uart(`FW0000${index}`) // cycle trought filters (basic cmd format)
	}

	set txpower(level) {
		this._uart(`PC${String(level).padStart(3, '0')}`)
	}

	set split(value) {
		const state = value != 0
		if (state != this._splitState) {
			this._uart(`FT${state ? 1 : 0}`)
			this._splitState = state
		}
		if (!state) return

		let cmd = 'FB000'
		if (value < 10000000) cmd += '0'
		this._uart(cmd + value)
	}

	set rit(value) {
		if (!value) {
			this._uart('RT0')
			this._uart('RC')
			this._rit = -1
			return
		}
		if (this._rit == -1) {
			this._xit && this.xit(0)
			this._uart('RT1')
			this._rit = 0
			this.clearRit()
		}
		const steps = this._diff10(this._rit, value)
		const up = steps > 0
		for (let step = 0; step < Math.abs(steps); step++) this._uart(up ? 'RU' : 'RD')
	}

	set xit(value) {
		if (!value) {
			this._uart('XT0')
			this._uart('RC')
			this._xit = -1
			return
		}
		if (this._xit == -1) {
			this._rit && this.rit(0)
			this._uart('XT1')
			this._xit = 0
			this.clearXit()
		}
		const steps = this._diff10(this._xit, value)
		const up = steps > 0
		for (let step = 0; step < Math.abs(steps); step++) this._uart(up ? 'RU' : 'RD')
	}

	_diff10(v1, v2) {
		return Math.floor(v2 / 10) - Math.floor(v1 / 10)
	}

	clearRit() {
		if (this._rit != -1) {
			this._uart('RC')
			this._rit = 0
		}
	}

	clearXit() {
		if (this._xit != -1) {
			this._uart('RC')
			this._xit = 0
		}
	}
}

export {ElecraftTcvr}
