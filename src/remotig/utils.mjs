
function log(str) {
	console.log(new Date().toISOString() + ' ' + str)
}

function whoIn(token) {
	if (!token) return null
	const delPos = token.indexOf('-')
	return delPos > 3 ? token.substring(0, delPos).toUpperCase() : null
}

export {log, whoIn}
