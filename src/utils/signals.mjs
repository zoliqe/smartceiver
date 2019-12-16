class TcvrSignal {
	constructor(type, value) {
		this._type = type
		this._value = value
	}
	get type() { return this._type }
	get value() { return this._value }
}

const SignalType = Object.freeze({
	freq: 'freq', rit: 'rit', xit: 'xit', split: 'split',
	wpm: 'wpm', mode: 'mode', vfo: 'vfo', filter: 'filter', gain: 'gain',
	keyDit: 'keyDit', keyDah: 'keyDah', keySpace: 'keySpace', keyTx: 'keyTx', reverse: 'reverse',
	ptt: 'ptt', agc: 'agc', pwrsw: 'pwrsw', keepAlive: 'keepAlive', step: 'step', 
	resetAudio: 'resetAudio', audioMute: 'audioMute',
})

class SignalBus {
	#listeners = []

	constructor() {}

	bind(type, owner, callback) {
		if (!(type in this.#listeners)) {
			this.#listeners[type] = []
		}
		this.#listeners[type].push(new SignalListener(owner, callback))
		console.debug(`bind: ${type} for ${owner}, callbacks`, this.#listeners[type].length)
	}

	unbind(owner) {
		for (let type in this.#listeners) {
			let stack = this.#listeners[type]
			for (let i = 0, l = stack.length; i < l; i++) {
				if (stack[i] && stack[i].owner == owner) {
					console.debug(`unbind ${type} for ${owner}`)
					stack.splice(i, 1)
				}
			}
		}
	}

	fire(signal) {
		let stack = this.#listeners[signal.type]
		stack && stack.forEach(listener => listener.callback.call(this, signal)) // TODO made async?
		return true //!event.defaultPrevented;
	}
}

class SignalsBinder {
	#out

	constructor(listenerId, outSignals) {
		this.#out = new Signals([
				SignalType.keyDit, SignalType.keyDah, SignalType.keySpace, SignalType.wpm, SignalType.ptt,
				SignalType.mode, SignalType.filter, SignalType.gain, SignalType.agc, SignalType.pwrsw,
				SignalType.freq, SignalType.rit, SignalType.xit, SignalType.split, SignalType.step,
			], outSignals, listenerId)
	}

	get out() {
		return out
	}
}

class Signals {
	#bindings
	#types
	#id
	constructor(types, bindings, listenerId) {
		this.#types = types || []
		this.#bindings = bindings || {}
		this.#id = listenerId
	}

	bind(bus) {
		this.#types.forEach(type => this._bind(bus, type))
	}

	_bind(bus, type) {
		const binding = this.#bindings[type]
		binding && bus.bind(type, this.#id, event => binding(event.value))
	}

	unbind(bus) {
		bus.unbind(this.#id)
	}
}

class SignalListener {
	#owner
	#callback
	constructor(owner, callback) {
		this.#owner = owner
		this.#callback = callback
	}
	get owner() { return this.#owner }
	get callback() { return this.#callback }
}


export {TcvrSignal, SignalType, SignalsBinder, SignalBus}