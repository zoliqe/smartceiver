import { Bands, Modes, AgcTypes, TransceiverProperties } from '../../../tcvr.js'

const bands = [160, 80, 40, 30, 20, 17, 15, 12, 10]
const filters = {}
filters[Modes.CW]  = filters[Modes.CWR] = [1500, 700, 400, 250]
filters[Modes.LSB] = filters[Modes.USB] = [2100, 2300, 700, 400]
const gains = {}
bands.forEach(b => gains[b] = [-10, 20])

export default {
	model: 'k2',
	baudrate: 4800,
	props: new TransceiverProperties({
		bands: bands,
		modes: [Modes.CW, Modes.CWR, Modes.LSB, Modes.USB],
		agcTypes: [AgcTypes.FAST, AgcTypes.SLOW, AgcTypes.AUTO],
		bandGains: gains,
		modeFilters: filters
	}),
	defaults: {band: 20, mode: Modes.CW, agc: AgcTypes.FAST}
}
