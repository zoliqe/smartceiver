import { Bands, Modes, AgcTypes, TransceiverProperties } from '../../../tcvr.mjs'

const bands = [
	Bands[160], Bands[80], Bands[40], Bands[30],
	Bands[20], Bands[17], Bands[15], Bands[12], Bands[10]]
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
	defaults: {band: Bands[20], mode: Modes.CW, agc: AgcTypes.FAST}
}
