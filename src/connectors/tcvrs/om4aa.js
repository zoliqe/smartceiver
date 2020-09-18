/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
import { Modes, AgcTypes } from '../../tcvr.js'
import { delay } from '../../utils/time.js'
import { selectFilter, resolveAgc, tcvrOptions } from './utils.js'

const MD = {}
MD[Modes.CW] = 3
MD[Modes.CWR] = 7
MD[Modes.LSB] = 1
MD[Modes.USB] = 2

export class Adapter {

	static async smartcvr(options) {
		return new Adapter(await tcvrOptions(this.manufacturer, 'smartcvr', options))
	}

	static async forTcvr(model, options) {
		return new Adapter(await tcvrOptions(this.manufacturer, model, options))
	}

	static get manufacturer() {
		return 'om4aa'
	}

	static get models() {
		return ['smartcvr']
	}

	_splitState = false

	_rit = 0

	_xit = 0

	constructor(options = { model: null, baudrate: null, props: null }) {
		this._uart = () => { } // do nothing
		this._options = options || {}
		this._model = options.model || ''
	}

	async init(dataSender) {
		this._uart = async (data) => dataSender(`${data};`)
		await delay(2000) // wait for tcvr internal CPU start
	}

	async close() {
		this._uart = () => { } // do nothing
	}

	get properties() {
		return this._options.props
	}

	get defaults() {
		return this._options.defaults
	}

	get baudrate() {
		return this._options.baudrate
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
			console.error('OM4AATcvr: Unknown mode', mode)
		}
	}

	async agc({agc, mode}) {
//		await this._uart(`GT00${resolveAgc(agc, mode) === AgcTypes.SLOW ? 4 : 2}`)
	}

	async gain(gain) {
//		await this._uart(`PA${gain > 0 ? 1 : 0}`)
		await this._uart(`RA0${gain < 0 ? 1 : 0}`)
	}

	async filter({filter, mode}) {
		const bandwidth = selectFilter(this.properties.filters(mode), filter)
		let bw = Number(bandwidth) / 10
		bw = String(bw).padStart(4, '0')
		await this._uart(`BW${bw}`)
	}

	async txpower(level) {
//		await this._uart(`PC${String(level).padStart(3, '0')}`)
	}

	async wpm(wpm) {
		if (wpm < 8 || wpm > 50) return
		await this._uart(`KS${String(wpm).padStart(3, '0')}`)
	}

	async keymsg(msg) {
//		if (!msg) return
//		await this._uart(`KY ${msg.length > 24 ? msg.substring(0, 24) : msg}`)
	}

	async ptt(state) {
//		await this._uart(state ? 'TX' : 'RX')
	}

	async split(value) {
	}

	async rit(value) {
	}

}
