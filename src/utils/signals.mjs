class TcvrEvent {
	constructor(type, value) {
		this._type = type
		this._value = value
	}
	get type() { return this._type }
	get value() { return this._value }
}

const EventType = Object.freeze({
	freq: 'freq', rit: 'rit', xit: 'xit', split: 'split',
	wpm: 'wpm', mode: 'mode', vfo: 'vfo', filter: 'filter', gain: 'gain',
	keyDit: 'keyDit', keyDah: 'keyDah', keySpace: 'keySpace', keyTx: 'keyTx', reverse: 'reverse',
	ptt: 'ptt', agc: 'agc', pwrsw: 'pwrsw', keepAlive: 'keepAlive', step: 'step', resetAudio: 'resetAudio',
	audioMute: 'audioMute',
})

class SignalsBinder {
	
	#out

	constructor(connectorId, outSignals) {
		this.#out = new Signals([
				EventType.keyDit, EventType.keyDah, EventType.keySpace, EventType.wpm, EventType.ptt,
				EventType.mode, EventType.filter, EventType.gain, EventType.agc,
				EventType.freq, EventType.rit, EventType.xit, EventType.split
			], outSignals, connectorId)
	}

	get out() {
		return out
	}
}

class Signals {
	#bindings
	#types
	#id
	constructor(types, bindings, connectorId) {
		this.#types = types || []
		this.#bindings = bindings || {}
		this.#id = connectorId
	}

	bind(tcvr) {
		this.#types.forEach(type => this._bind(tcvr, type))
	}

	_bind(tcvr, type) {
		const binding = this.#bindings[type]
		binding && tcvr.bind(type, this.#id, event => binding(event.value))
	}

	unbind(tcvr) {
		tcvr.unbind(this.#id)
	}
}

export {TcvrEvent, EventType}
