import {PowronConnector, PowronPins} from '../connectors/powron.mjs'
import {ElecraftTcvr} from '../connectors/adapters/elecraft.mjs'
import {IcomTcvr} from '../connectors/adapters/icom.mjs'
import {YeasuTcvr} from '../connectors/adapters/yeasu.mjs'
import {KenwoodTcvr} from '../connectors/adapters/kenwood.mjs'

const rigQth = 'k2@om4aa.ddns.net'

// TODO refactor to async static methods and use import()
const tcvrAdapter = ElecraftTcvr.K2()
//const tcvrAdapter = () => KenwoodTcvr.TS2000({powerViaCat: true})
//const tcvrAdapter = () => YeasuTcvr.FT1000MP()

// poweron || bluecat
const connector = new PowronConnector(tcvrAdapter)

export {rigQth, tcvrAdapter}
