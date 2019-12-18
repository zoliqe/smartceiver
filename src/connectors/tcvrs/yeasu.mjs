import {Bands, Modes, AgcTypes} from '../../tcvr.mjs'
import {delay} from '../../utils/time.mjs'
import {selectFilter, tcvrOptions} from './utils.mjs'

const modeValues = {}
modeValues[Modes.LSB] = 0x00
modeValues[Modes.USB] = 0x01
modeValues[Modes.CW]  = 0x03
modeValues[Modes.CWR] = 0x02
modeValues[Modes.AM]  = 0x04
modeValues[Modes.NFM] = 0x06
modeValues[Modes.WFM] = 0x07
modeValues[Modes.RTTY] = 0x08
modeValues[Modes.RTTYR] = 0x09
const filterValues = {
	6000: 4,
	2400: 0,
	2000: 1,
	500: 2,
	250: 3,
}

const hex2dec = (h) => {
	const s = Math.floor(h / 10)
	return s * 16 + (h - s * 10)
}

export class Adapter {

	#options

	constructor(options = {baudrate}) {
		this._uart = _ => {} // do nothing
		this.#options = options || {}
	}

	static FT1000MP(options) {
		return new Adapter(await tcvrOptions('yeasu', 'ft1000', options))
	}

	async static forTcvr(model, options) {
		return new Adapter(await tcvrOptions(this.manufacturer, model, options))
	}

	static get manufacturer() {
		return 'yeasu'
	}

	static get models() {
		return ['ft1000']
	}

	async init(dataSender) {
		this._uart = dataSender
		await delay(2000) // wait for tcvr internal CPU start
	}

	close() {
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

	async frequency(f) {
		let mhz100_10 = 0
		if (f >=                     10000000) { // 10MHz
			mhz100_10 = Math.floor(f / 10000000)
			f = f - (mhz100_10 *       10000000)
		}
		// log(`f=${f}`)
		const khz1000_100 = Math.floor(f / 100000) // 100kHz
		f = f - (khz1000_100 *             100000)
		// log(`f=${f}`)
		const khz10_1 = Math.floor(f / 1000) // 1kHz
		f = f - (khz10_1 *             1000)
		// log(`f=${f}`)
		const hz100_10 = Math.floor(f / 10) // 10Hz
		f = f - (hz100_10 *             10)
		// log(`f=${f}`)

		const data = [hex2dec(hz100_10), hex2dec(khz10_1), hex2dec(khz1000_100), hex2dec(mhz100_10),
			0x0A]
		// log(`TCVR f: ${data}`)
		await this._uart(data) //, (err) => err && log(`TCVR ${err.message}`))
	}

	async mode(mode) {
		const value = modeValues[mode]
		if (value == null) {
			console.error('YeasuTcvr: Unknown mode', mode)
			return
		}
		const data = [0, 0, 0, value, 0x0C]
		await this._uart(data)
	}

	async filter({value, mode}) {
		const filter = selectFilter(this.properties.filters(mode), value)
		const fvalue = filterValues[filter]
		if (fvalue == null) {
			console.error('YeasuTcvr: Unknown filter', value)
			return
		}
		const data = [0, 0, 0, fvalue, 0x8C]
		await this._uart(data)
	}

	async agc(agc) {
	}

	async preamp(gain) {
	}

	async attn(attn) {
	}
}
