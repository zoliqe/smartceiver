import {Bands, Modes, AgcTypes, TransceiverProperties} from '../../../tcvr.mjs'

const filters = {}
filters[Modes.CW]  = filters[Modes.CWR] = [6000, 2400, 2000, 500, 250]
filters[Modes.LSB] = filters[Modes.USB] = [6000, 2400, 2000, 500, 250]

const modeValues = {}
modeValues[Modes.LSB] = 0x00
modeValues[Modes.USB] = 0x01
modeValues[Modes.CW]  = 0x02
modeValues[Modes.CWR] = 0x03
modeValues[Modes.AM]  = 0x04
modeValues[Modes.NFM] = 0x08
modeValues[Modes.RTTY] = 0x0A

export default {
	model: 'ft817',
	baudrate: 4800,
	freqdata: (mhz100_10, khz1000_100, khz10_1, hz100_10) => [mhz100_10, khz1000_100, khz10_1, hz100_10, 0x01],
	modedata: mode => modeValues[mode] && [modeValues[mode], 0, 0, 0, 0x07],
	filterdata: filter => [],
	props: new TransceiverProperties({
		bands: [
			Bands[160], Bands[80], Bands[40], Bands[30],
			Bands[20], Bands[17], Bands[15], Bands[12], Bands[10]],
		modes: [Modes.CW, Modes.CWR, Modes.LSB, Modes.USB],
	}),
	defaults: {band: Bands[20], mode: Modes.CW, agc: AgcTypes.AUTO}
}
