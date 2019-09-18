import {Powron, PowronPins} from '../connectors/powron.mjs'
import {ElecraftTcvr} from '../adapters/elecraft.mjs'
import {IcomTcvr} from '../adapters/icom.mjs'
import {YeasuTcvr} from '../adapters/yeasu.mjs'
import {KenwoodTcvr} from '../adapters/kenwood.mjs'

const rigQth = 'k2@om4aa.ddns.net'

const powerPins = [PowronPins.pin2, PowronPins.pin4]

// poweron || bluecat
const connector = new Powron({
	keyerPin: PowronPins.pin5,
	pttPin: PowronPins.pin6,
	serialBaudRate: 4800
})

const tcvrAdapter = () => ElecraftTcvr.K2(connector) // deffer serial initialization
//const tcvrAdapter = () => KenwoodTcvr.TS2000(catConnector, keyerOptions, {powerViaCat: true}) // deffer serial initialization
//const tcvrAdapter = () => YeasuTcvr.FT1000MP(catConnector, keyerOptions) // deffer serial initialization

export {rigQth, powerPins, connector, tcvrAdapter}
