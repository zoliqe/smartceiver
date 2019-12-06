import {delay} from '../../utils/time.mjs'

// const hwWatchdogTimeout = 120 // sec
const State = {on: 'active', starting: 'starting', off: null, stoping: 'stoping'}
export class PowrSwitch {

	#state = State.off
	#connector

	constructor(powerConnector = {state}) {
		this.#connector = powerConnector
	}

	async on() {
		if (this.#state === State.stoping || this.#state === State.starting) {
			console.warn(`Remotig in progress state ${this.#state}, ignoring start`)
			return
		}

		if (this.#state === State.off) { // cold start
			console.info(`powerOn`)
		// 	this.connector.timeout = hwWatchdogTimeout
		}

		this.#state = State.starting
		await this.#connector.state(true)
		this.#state = State.on
	}

	async off() {
		if (this.#state === State.off || this.#state === State.stoping) return;

		this.#state = State.stoping
		console.info(`powerOff`)
		await this.#connector.state(false)
		await delay(500)
		await this.#connector.state(false)
		await delay(1000)

		this.#state = State.off
	}

}

