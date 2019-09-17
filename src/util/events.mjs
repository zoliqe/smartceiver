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
	keyDit: 'keyDit', keyDah: 'keyDah', keySpace: 'keySpace', reverse: 'reverse',
	ptt: 'ptt', agc: 'agc', pwrsw: 'pwrsw', step: 'step', resetAudio: 'resetAudio',
	audioMute: 'audioMute',
})

export {TcvrEvent, EventType}
