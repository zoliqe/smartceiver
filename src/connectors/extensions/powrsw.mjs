import {delay} from '../../utils/time.mjs'

const State = {on: 'active', starting: 'starting', off: null, stoping: 'stoping'}
export class PowrSwitch {

	#state = State.off
	#connector
	#watchdog

	constructor(powerConnector = {state, timeout}) {
		this.#connector = powerConnector
	}

	async on() {
		if (this.#state === State.stoping || this.#state === State.starting) {
			console.warn(`Remotig in progress state ${this.#state}, ignoring start`)
			return
		}

		if (this.#state === State.off) { // cold start
			console.info(`powerOn`)
		}

		this.#state = State.starting
		await this.#connector.state(true)
		this._watchdogStart()
		this.#state = State.on
	}

	async off() {
		if (this.#state === State.off || this.#state === State.stoping) return;

		this.#state = State.stoping
		console.info(`powerOff`)
		this._watchdogStop()
		await this.#connector.state(false)
		await delay(500)
		await this.#connector.state(false)
		await delay(1000)

		this.#state = State.off
	}

	resetWatchdog() {
		this._watchdogStart({reset: true})
	}

	_watchdogStart({reset = false} = {}) {
		if (!#connector.timeout) return
		if (reset && #watchdog == null) return
		if (!reset) {
			if (#watchdog != null) clearTimeout(#watchdog)
			console.info('PowrSW watchdog active, timeout:', #connector.timeout)
		}

		#watchdog = setTimeout(() => {
			console.info('PowrSW watchdog timedout')
			this.off()
		}, #connector.timeout * 1000);
	}

	_watchdogStop() {
		if (#watchdog != null) {
			clearTimeout(#watchdog)
			#watchdog = null
		}
	}

}

