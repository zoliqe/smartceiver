
const manufacturers = ['elecraft', 'icom', 'kenwood', 'yeasu']
const tcvrs

async function transceivers() {
	if (tcvrs) return tcvrs
	tcvrs = {}
	await manufacturers.forEach(async (manufacturer) => 
		tcvrs[manufacturer] = (await import(`./tcvrs/${manufacturer}.mjs`)).Adapter.models)
}

async function adapterFor(manufacturer, model, options) {
	const module = await import(`./tcvrs/${manufacturer}.mjs`)
	const adapter = await module.Adapter.forTcvr(model, options)
	return adapter
}

export {transceivers, adapterFor}
