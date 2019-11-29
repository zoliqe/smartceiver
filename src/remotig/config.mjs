import {PowronConnector, PowronPins} from '../connectors/powron.mjs'
import {ElecraftTcvr} from '../adapters/elecraft.mjs'
import {IcomTcvr} from '../adapters/icom.mjs'
import {YeasuTcvr} from '../adapters/yeasu.mjs'
import {KenwoodTcvr} from '../adapters/kenwood.mjs'

const rigQth = 'k2@om4aa.ddns.net'

// poweron || bluecat
const connector = new PowronConnector()
const tcvrAdapter = () => ElecraftTcvr.K2(connector) // deffer serial initialization
//const tcvrAdapter = () => KenwoodTcvr.TS2000(catConnector, {powerViaCat: true}) // deffer serial initialization
//const tcvrAdapter = () => YeasuTcvr.FT1000MP(catConnector) // deffer serial initialization

export {rigQth, tcvrAdapter}
