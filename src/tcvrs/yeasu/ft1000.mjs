import {Bands, Modes, AgcTypes, TransceiverProperties} from '../../tcvr.mjs'

const filters = {}
filters[Modes.CW]  = filters[Modes.CWR] = [6000, 2400, 2000, 500, 250]
filters[Modes.LSB] = filters[Modes.USB] = [6000, 2400, 2000, 500, 250]

export default {
	model: 'ft1000',
	baudrate: 4800,
	props: new TransceiverProperties({
		bands: [
			Bands[160], Bands[80], Bands[40], Bands[30],
			Bands[20], Bands[17], Bands[15], Bands[12], Bands[10]],
		modes: [Modes.CW, Modes.CWR, Modes.LSB, Modes.USB],
		modeFilters: filters
	})
}
