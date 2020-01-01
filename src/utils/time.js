const secondsNow = () => Date.now() / 1000

function delay(ms) {
	if (ms == null) return null
	return new Promise(resolve => setTimeout(resolve, ms))
}

export {secondsNow, delay}
