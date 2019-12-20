import {Bands, Modes, AgcTypes, TransceiverProperties} from '../../../tcvr.mjs'

const bands = [
	Bands[160], Bands[80], Bands[40], Bands[30],
	Bands[20], Bands[17], Bands[15], Bands[12], Bands[10]]
const filters = {}
filters[Modes.CW]  = filters[Modes.CWR] = [2000, 1800, 1500, 600, 300, 200, 100]
filters[Modes.LSB] = filters[Modes.USB] = [2700, 2300, 2100, 1800, 1500, 1200, 1000, 800, 600]
const gains = {}
bands.forEach(b => gains[b] = [-10, 20])

export default {
	model: 'ts2000',
	powerViaCat: false, 
	baudrate: 9600,
	props: new TransceiverProperties({
		bands: bands,
		modes: [Modes.CW, Modes.CWR, Modes.LSB, Modes.USB],
		agcTypes: [AgcTypes.FAST, AgcTypes.MEDIUM, AgcTypes.SLOW, AgcTypes.AUTO, AgcTypes.OFF],
		bandGains: gains,
		modeFilters: filters
	}),
	defaults: {band: Bands[20], mode: Modes.CW, agc: AgcTypes.FAST}
}
