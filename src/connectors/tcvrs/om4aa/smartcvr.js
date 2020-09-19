import { Bands, Modes, AgcTypes, TransceiverProperties } from '../../../tcvr.js'

const bands = [160, 80, 40, 30, 20, 17, 15, 12, 10]
const filters = {}
filters[Modes.CW]  = [4000, 3000, 2200, 1200, 1000, 500]
filters[Modes.CWR] = filters[Modes.CW]
filters[Modes.LSB] = filters[Modes.CW]
filters[Modes.USB] = filters[Modes.CW]
const gains = {}
bands.forEach(b => {gains[b] = [-10]})

export default {
	model: 'smartcvr',
	baudrate: 115200,
	props: new TransceiverProperties({
		bands,
		modes: [Modes.CW, Modes.CWR, Modes.LSB, Modes.USB],
		agcTypes: [AgcTypes.OFF, AgcTypes.AUTO],
		bandGains: gains,
		modeFilters: filters
	}),
	defaults: {band: 20, mode: Modes.CW/*, agc: AgcTypes.FAST*/}
}
