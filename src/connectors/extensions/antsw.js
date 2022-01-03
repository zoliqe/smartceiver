
const bandPins = {160: 4, 80: 5, 60: 6, 40: 7, 30: 8, 20: 9, 17: 10, 15: 11, 12: 12, 10: 13, 6: 14, 2: 15}
export class AntennaSwitch {

	#connector
	#timer
	#pin

	constructor(antConnector = {pinState: (pin, state) => {}, timeout: 60}) {
		this.#connector = antConnector
		this.#timer = null
		this.#pin = null
	}

	set band(b) {
		console.log(`AntennaSwitch: set band ${b}`)
		this.#reset()
		this.#pin = bandPins[b]
		if (this.#pin) {
			this.#timer = setInterval(_ => {
				console.debug(`AntennaSwitch: ant pin ${this.#pin} set active`)
				this.#connector.pinState(this.#pin, true)
			}, this.#connector.timeout)
		}
	}

	#reset() {
		console.debug('AntennaSwitch: pinState reset')
		this.#timer && clearInterval(this.#timer)
		this.#timer = null
		bandPins.values().forEach(pin => this.#connector.pinState(pin, false))
	}
}
