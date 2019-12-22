import {Bands, Modes, AgcTypes} from '../../tcvr.js'
import {delay} from '../../utils/time.mjs'
import {selectFilter, resolveAgc, tcvrOptions} from './utils.mjs'


const MD = {}
MD[Modes.CW] = 3
MD[Modes.CWR] = 7
MD[Modes.LSB] = 1
MD[Modes.USB] = 2
MD[Modes.RTTY] = 6

export class Adapter {

	static async TS2000(options) {
		return new Adapter(await tcvrOptions('kenwood', 'ts2000', options))
	}

	static async forTcvr(model, options) {
		return new Adapter(await tcvrOptions(this.manufacturer, model, options))
	}

	static get manufacturer() {
		return 'kenwood'
	}

	static get models() {
		return ['ts2000']
	}

	_splitState = false
	_rit = 0
	_xit = 0
	#options

	constructor(options = {powerViaCat, baudrate, props}) {
		this._uart = _ => {} // do nothing
		this.#options = options || {}
	}

	async init(dataSender) {
		this._uart = async (data) => await dataSender(data + ';')
		await delay(4000) // wait for tcvr internal CPU start
		if (this.#options.powerViaCat) {
			await this._uart('PS1')
			await delay(2000)
		}
		await this._uart('FR0') // set VFO A as RX VFO + cancel SPLIT
	}

	async close() {
		this.#options.powerViaCat && (await this._uart('PS0'))
		this._uart = _ => {} // do nothing
	}

	get baudrate() {
		return this.#options.baudrate
	}

	get properties() {
		return this.#options.props
	}

	get defaults() {
		return this.#options.defaults
	}

	async frequency(freq) {
		let cmd = 'FA000'
		if (freq < 10000000) cmd += '0'
		await this._uart(cmd + freq)
	}

	async mode(mode) {
		const md = MD[mode]
		if (md != null) {
			await this._uart(`MD${md}`)
		} else {
			console.error('KendwoodTcvr: Unknown mode', mode)
		}
	}

	async agc({agc, mode}) { // 000=OFF, 001 (min.) ~ 020 (max.)
		let v = '001'
		agc = resolveAgc(agc, mode)
		if (agc == AgcTypes.SLOW) v = '020'
		else if (agc == AgcTypes.MEDIUM) v = '010'
		else if (agc == AgcTypes.OFF) v = '000'
		await this._uart('GT' + v)
	}

	async gain(gain) {
		await this._uart(`PA${gain > 0 ? 1 : 0}`)
		await this._uart(`RA0${gain < 0 ? 1 : 0}`)
	}

	// set preamp(gain) {
	// 	this._uart(`PA${gain > 0 ? 1 : 0}`)
	// }

	// set attn(attn) {
	// 	this._uart(`RA0${attn > 0 ? 1 : 0}`)
	// }

	async filter({value, mode}) {
		const filter = selectFilter(this.properties.filters(mode), value)
		await this._uart(`FW${String(filter).padStart(4, '0')}`)
	}

	async txpower(level) {
		await this._uart(`PC${String(level).padStart(3, '0')}`)
	}

	async split(value) {
		const state = value != 0
		if (state != this._splitState) {
			await this._uart(`FT${state ? 1 : 0}`)
			this._splitState = state
		}
		if (!state) return

		let cmd = 'FB000'
		if (value < 10000000) cmd += '0'
		await this._uart(cmd + value)
	}

	async rit(value) {
		if (!value) {
//			this.clearRit()
			this._rit = 0
			await this._uart('RT0')
			return
		}
		if (!this._rit) {
			this._xit && (await this.xit(0))
			await this._uart('RT1')
		}
		// P1: 00000 ~ 99999 (the offset frequency in Hz)
		this._rit = value
		await this._uart(`RU${String(value).padStart(5, '0')}`)
	}

	async xit(value) {
		if (!value) {
//			this.clearXit()
			this._xit = 0
			await this._uart('XT0')
			return
		}
		if (!this._xit) {
			this._rit && (await this.rit(0))
			await this._uart('XT1')
		}
		this._xit = value
		await this._uart(`RU${String(value).padStart(5, '0')}`)
	}

	_diff10(v1, v2) {
		return Math.floor(v2 / 10) - Math.floor(v1 / 10)
	}

	async clearRit() {
		await this._uart('RC')
		this._rit = 0
	}

	async clearXit() {
		await this._uart('RC')
		this._xit = 0
	}
}
