import { Bands, Modes, AgcTypes } from '../../tcvr.js'
import { delay } from '../../utils/time.mjs'
import { selectFilter, resolveAgc, tcvrOptions } from './utils.mjs'

const MD = {}
MD[Modes.CW] = 3
MD[Modes.CWR] = 7
MD[Modes.LSB] = 1
MD[Modes.USB] = 2
MD[Modes.RTTY] = 6

export class Adapter {

	_splitState = false
	_rit = 0
	_xit = 0
	#model
	#options

	constructor(options = { model, baudrate, props }) {
		this._uart = _ => { } // do nothing
		this.#options = options || {}
		this.#model = options.model || ''
	}

	async static K2(options) {
		return new Adapter(await tcvrOptions(this.manufacturer, 'k2', options))
	}

	async static KX3(options) {
		return new Adapter(await tcvrOptions(this.manufacturer, 'kx3', options))
	}

	async static forTcvr(model, options) {
		return new Adapter(await tcvrOptions(this.manufacturer, model, options))
	}

	static get manufacturer() {
		return 'elecraft'
	}

	static get models() {
		return ['k2', 'kx3']
	}

	async init(dataSender) {
		this._uart = async (data) => await dataSender(data + ';')
		await delay(2000) // wait for tcvr internal CPU start
		await this._uart('FR0') // set VFO A as RX VFO + cancel SPLIT
	}

	async close() {
		this._uart = _ => { } // do nothing
	}

	get properties() {
		return this.#options.props
	}

	get defaults() {
		return this.#options.defaults
	}

	get baudrate() {
		return this.#options.baudrate
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
			console.error('ElecraftTcvr: Unknown mode', mode)
		}
	}

	async agc({agc, mode}) {
		await this._uart(`GT00${resolveAgc(agc, mode) == AgcTypes.SLOW ? 4 : 2}`)
	}

	async gain(gain) {
		await this._uart(`PA${gain > 0 ? 1 : 0}`)
		await this._uart(`RA0${gain < 0 ? 1 : 0}`)
	}

	// async preamp(gain) {
	// 	await this._uart(`PA${gain > 0 ? 1 : 0}`)
	// }

	// async attn(attn) {
	// 	await this._uart(`RA0${attn > 0 ? 1 : 0}`)
	// }

	async filter({value, mode}) {
		const filter = selectFilter(this.properties.filters(mode), value)
		if (this.#model === 'k2') await this._filterK2(filter, mode)
    else await this._filterK3(filter)
	}

	async _filterK2(filter, mode) {
		const index = this.#options.filters[mode].indexOf(Number(filter))
		if (index < 0) return
		await this._uart('K22')
		await this._uart(`FW0000${index + 1}`)
		await this._uart('K20')
		// const count = Object.keys(filters[mode]).length / 2
		// for (let i = 0; i < count; i++) this._uart(`FW0000${index}`) // cycle trought filters (basic cmd format)
	}

	async _filterK3(bw) {
		bw = Number(bw) / 10
		bw = String(bw).padStart(4, '0')
		await this._uart('BW' + bw)
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

	// TODO see newer impl for kenwood
	async rit(value) {
		if (!value) {
			await this._uart('RT0')
			await this._uart('RC')
			this._rit = -1 // mark as disabled
			return
		}

		if (this._rit == -1) { // was disabled
			this._xit && (await this.xit(0))
			await this._uart('RT1')
			this._rit = 0
			await this.clearRit()
		}

		const steps = this._diff10(this._rit, value)
		const up = steps > 0
		for (let step = 0; step < Math.abs(steps); step++) {
			await this._uart(up ? 'RU' : 'RD')
		}
	}

	// TODO see newer impl for kenwood
	async xit(value) {
		if (!value) {
			await this._uart('XT0')
			await this._uart('RC')
			this._xit = -1 // mark as disabled
			return
		}

		if (this._xit == -1) { // was disabled
			this._rit && (await this.rit(0))
			await this._uart('XT1')
			this._xit = 0
			await this.clearXit()
		}

		const steps = this._diff10(this._xit, value)
		const up = steps > 0
		for (let step = 0; step < Math.abs(steps); step++) {
			await this._uart(up ? 'RU' : 'RD')
		}
	}

	_diff10(v1, v2) {
		return Math.floor(v2 / 10) - Math.floor(v1 / 10)
	}

	async clearRit() {
		if (this._rit != -1) {
			await this._uart('RC')
			this._rit = 0
		}
	}

	async clearXit() {
		if (this._xit != -1) {
			await this._uart('RC')
			this._xit = 0
		}
	}
}
