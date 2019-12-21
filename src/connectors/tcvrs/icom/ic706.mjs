import {Bands, Modes, AgcTypes, TransceiverProperties} from '../../../tcvr.js'

const bands = [Bands[160], Bands[80], Bands[40], Bands[30],
Bands[20], Bands[17], Bands[15], Bands[12], Bands[10], Bands[6],
Bands[2], Bands[70]]
const gains = {}
bands.forEach(b => gains[b] = [-10, 10])

export default {
	model: 'ic706',
	address: 0x58, 
	baudrate: 9600,
	props: new TransceiverProperties({
		bands: bands,
		modes: [Modes.CW, Modes.CWR, Modes.LSB, Modes.USB],
		agcTypes: [AgcTypes.FAST, AgcTypes.SLOW, AgcTypes.AUTO],
		bandGains: gains,
		modeFilters: {} // no filters (TODO update to support optional filter)
	}),
	defaults: {band: Bands[20], mode: Modes.CW, agc: AgcTypes.FAST}
}
