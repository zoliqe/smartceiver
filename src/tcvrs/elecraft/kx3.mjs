import { Bands, Modes, AgcTypes, TransceiverProperties } from '../../tcvr.mjs'

const bands = [
	Bands[160], Bands[80], Bands[40], Bands[30],
	Bands[20], Bands[17], Bands[15], Bands[12], Bands[10]]
const filters = {}
filters[Modes.CW]  = filters[Modes.CWR] = [1800, 1500, 600, 300, 200, 100]
filters[Modes.LSB] = filters[Modes.USB] = [2700, 2300, 2100, 1800, 1500, 1200, 1000, 800, 600]
const gains = {}
bands.forEach(b => gains[b] = [-10, 0, 20]) // TODO kx3 supports more preamps (10/20/30) per band - can we handle this via CAT?

export default {
	model: 'kx3',
	baudrate: 38400,
	props: new TransceiverProperties({
		bands: bands,
		modes: [Modes.CW, Modes.CWR, Modes.LSB, Modes.USB],
		agcTypes: [AgcTypes.FAST, AgcTypes.SLOW],
		bandGains: gains,
		modeFilters: filters
	})
}
