
export const get = async (id) => {
	if (!id) return null
	if (id === 'RTC') {
		const conn = await import('./remotig-rtc-connector.mjs')
		return new conn.RemotigRTCConnector()
	}
	if (id === 'USB') {
		const conn = await import('./usb-connector.mjs')
		return new conn.WebUSBConnector()
	}

	throw new Error(`Unknown Connector.id=${id}`)
}
