
export class Keyer {

	#wpm = 0
	#connector
	#pttTimeout
	#pttTimer
	#keyTimer

	constructor(keyerConnector = {send, speed, state, key, ptt}, options = {pttTimeout}) {
		this.#pttTimeout = options.pttTimeout
		this.#connector = keyerConnector
	}

	async send(msg) {
		if (this.disabled) return
		await this.#connector.send(msg)
	}

	async ptt(state, timeout = this.#pttTimeout) {
		if (state) {
			await this.#connector.ptt(false)
			this.#pttTimer != null && clearTimeout(this.#pttTimer)
			this.#pttTimer = null
			return
		}

		if (!timeout) return; // disable PTT

		this.#pttTimer != null && clearTimeout(this.#pttTimer)
		await this.#connector.ptt(true) // this resets powron ptt watchdog counter
		this.#pttTimer = setTimeout(async () => {
			this.#pttTimer = null
			await this.#connector.ptt(false)
		}, timeout)
	}

	async key(state, timeout = this.#pttTimeout) {
		if (this.disabled) return

		if (!state) {
			await this.#connector.key(false)
			this.#keyTimer != null && clearTimeout(this.#keyTimer)
			this.#keyTimer = null
			return
		}

		if (!timeout) return;

		this.#keyTimer != null && clearTimeout(this.#keyTimer)
		await this.#connector.key(true) // reset powron watchdog timer
		this.#keyTimer = setTimeout(async () => {
			this.#keyTimer = null
			await this.#connector.key(false)
		}, timeout)
	}

	async wpm(value) {
		this.#wpm = Number(value)
		if (this.disabled) return // check after setting value, to allow disable/enable keyer
		await this.#connector.speed(this.#wpm)
	}

	get wpm() {
		return this.#wpm
	}

	get disabled() {
		return this.#wpm < 1 || !this.#connector.state()
	}

}
