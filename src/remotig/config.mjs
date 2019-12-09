import {PowronConnector, PowronPins} from '../connectors/powron.mjs'

const rigQth = 'k2@om4aa.ddns.net'
const manufaturer = 'elecraft' // one of ['elecraft', 'icom', 'kenwood', 'yeasu']

let connector
(async () => {
	const module = await import('../connectors/adapters/' + manufaturer + '.mjs')
	const tcvrAdapter = await module.Adapter.K2()
	//const tcvrAdapter = () => KenwoodTcvr.TS2000({powerViaCat: true})
	//const tcvrAdapter = () => YeasuTcvr.FT1000MP()
	
	// poweron || bluecat
	connector = new PowronConnector(tcvrAdapter)	
})()

export {rigQth, tcvrAdapter}
