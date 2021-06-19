import { adapterFor } from './connectors/adapter.js'

function requireTcvr(params) {
	// options.tcvr = { manufacturer, model, options }
	if (!params || !params.tcvr)
		throw new Error("Transceiver not specified");
	if (!params.tcvr.manufacturer)
		throw new Error('Transceiver manufacturer not specified');
	if (!params.tcvr.model)
		throw new Error('Transceiver model not specified');
}

export const get = async (connector, params) => {
	if (!connector) return null
	if (connector === 'remotig') {
		if (!params || !params.kredence)
			throw new Error('Remote connection credentials required')
		const conn = await import('./connectors/remotig.js')
		return new conn.RemotigConnector(params.kredence, params)
	}
	if (connector === 'usbpowron') {
		requireTcvr(params)
		const adapter = await adapterFor(params.tcvr)
		const conn = await import('./connectors/usbpowron.js')
		return new conn.PowronConnector(adapter, params)
	}
	if (connector === 'serpowron') {
		requireTcvr(params)
		const adapter = await adapterFor(params.tcvr)
		const conn = await import('./connectors/serpowron.js')
		return new conn.PowronConnector(adapter, params)
	}
	if (connector === 'sercat') {
		requireTcvr(params)
		const adapter = await adapterFor(params.tcvr)
		const conn = await import('./connectors/sercat.js')
		return new conn.SercatConnector(adapter, params)
	}
	if (connector === 'bluecat') {
		requireTcvr(params)
		const adapter = await adapterFor(params.tcvr)
		const conn = await import('./connectors/bluecat.js')
		return new conn.BlueCatConnector(adapter, params)
	}
	if (connector === 'usbcat') {
		requireTcvr(params)
		const adapter = await adapterFor(params.tcvr)
		const conn = await import('./connectors/usbcat.js')
		return new conn.UsbcatConnector(adapter, params)
	}
	if (connector === 'nocat') {
//		requireTcvr(params)
    params.tcvr = params.tcvr || {}
    params.tcvr.manufacturer = params.tcvr.manufacturer || 'none'
    params.tcvr.model = params.tcvr.model || 'none'
		const adapter = await adapterFor(params.tcvr)
		const conn = await import('./connectors/nocat.js')
		return new conn.UsbcatConnector(adapter, params)
	}

	throw new Error(`Unknown connector=${connector}`)
}

