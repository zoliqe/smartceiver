
function nextValue(values, value) {
	const i = values.indexOf(value)
	return values[i < (values.length - 1) ? i + 1 : 0]
}

function prevValue(values, value) {
	const i = values.indexOf(value)
	return values[i > 0 ? i - 1 : values.length - 1]
}

export {nextValue, prevValue}
