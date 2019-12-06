import {Bands, Modes, AgcTypes, TransceiverProperties} from '../../tcvr.mjs'
import {delay} from '../../utils/time.mjs'

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

class YeasuTcvr {

    #options

	constructor(options = {baudrate}) {
		this._uart = _ => {} // do nothing
		this.#options = options || {}
	}

	static FT1000MP(options = {baudrate: 4800}) {
		const filters = {}
		filters[Modes.CW]  = filters[Modes.CWR] = [6000, 2400, 2000, 500, 250]
		filters[Modes.LSB] = filters[Modes.USB] = [6000, 2400, 2000, 500, 250]

		options.props = new TransceiverProperties({
			bands: [
				Bands[160], Bands[80], Bands[40], Bands[30],
				Bands[20], Bands[17], Bands[15], Bands[12], Bands[10]],
			modes: [Modes.CW, Modes.CWR, Modes.LSB, Modes.USB],
			modeFilters: filters
		})
		return new YeasuTcvr(options)
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

	async filter(filter, mode) {
		const value = filterValues[Number(filter)]
		if (value == null) {
			console.error('YeasuTcvr: Unknown filter', filter)
			return
		}
		const data = [0, 0, 0, value, 0x8C]
		await this._uart(data)
	}

	async agc(agc) {
	}

	async preamp(gain) {
	}

	async attn(attn) {
	}
}

export {YeasuTcvr}
