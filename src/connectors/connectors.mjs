
export const get = async (id, options = []) => {
	if (!id) return null
	if (id === 'remotig') {
		const conn = await import('./remotig.mjs')
		return new conn.RemotigConnector(...options)
	}
	if (id === 'powron') {
		const conn = await import('./powron.mjs')
		return new conn.PowronConnector(...options)
	}
	if (id === 'bluecat') {
		const conn = await import('./bluecat.mjs')
		return new conn.BlueCatConnector(...options)
	}

	throw new Error(`Unknown Connector.id=${id}`)
}
