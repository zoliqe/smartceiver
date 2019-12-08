
/**
 * Finds first wider filter (declared by supported values)
 * for given value.
 */
selectFilter(values, valueRaw) {
	const value = parseInt(valueRaw, 10)
	values = values
		// .map(bw => parseInt(bw, 10))
		.sort((a, b) => a - b)
	const widest = parseInt(values[values.length - 1], 10)
	if (isNaN(value) || isNaN(widest)) return values[values.length - 1]

	const result = values
		.filter(bw => !isNaN(bw) && bw >= value)
		.reduce((nearestWider, bw) => bw < nearestWider ? bw : nearestWider, widest)
	console.debug('_findNearestWiderFilter:', {'for': valueRaw, 'found': result})
	if (result == null) return String(widest)
	return String(result)
}

export {selectFilter}
