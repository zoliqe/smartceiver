// const _vfos = ['A', 'B']
const _bands = ['1.8', '3.5', '7', '10.1', '14', '18', '21', '24', '28']
const _bandLowEdges = [1800000, 3500000, 7000000, 10100000, 14000000, 18068000, 21000000, 24890000, 28000000]
const _modes = ['LSB', 'USB', 'CW', /*'CWR'*/] // order copies mode code for MDn cmd
// const _narrowFilters = [2000, 2000, 250, 250] // in _modes order
// const _wideFilters =   [2400, 2400, 2000, 2000] // in _modes order
// const _narrowFilters = ['1800', '1800', '0200', '0200']; // in _modes order
// const _wideFilters =   ['2700', '2700', '0600', '0600']; // in _modes order
const _sidetoneFreq = 650
// const _sidetoneLevel = 0.2

class Transceiver {
	constructor() {
		// this._rxVfo = 0
		// this._txVfo = 0
		this._band = 2
		this._mode = 2
		this._freq = []
		this._split = []
		this._gain = []
		for (let band in _bands) {
			this._freq[band] = []
			this._split[band] = []
			for (let mode in _modes) {
				this._freq[band][mode] = _bandLowEdges[band]
				this._split[band][mode] = 0
			}
			this._gain[band] = 0
		}
		// _bandLowEdges.forEach(freq => {
		// 	let band = _bandLowEdges.indexOf(freq)
		// 	if (!(band in this._freq)) {
		// 		this._freq[band] = []
		// 	}
		// 	for (const mode in _modes) {
		// 		if (!(mode in this._freq[band])) {
		// 			this._freq[band][mode] = []
		// 		}
		// 		for (const vfo in _vfos) {
		// 			this._freq[band][mode][vfo] = freq
		// 		}
		// 	}
			// this._gain[band] = 0
		// })
		console.log(`freqs=${this._freq}`)
		this._wpm = 28
		// this._narrow = false
		// this._preamp = false
		// this._attn = false
		this._ptt = false
		this._agc = true
		this._step = 20
		this._rit = 0
		this._xit = 0
		this._reversePaddle = false
		// this._txEnabled = true
		// this._txKeyed = false
		// this._autoSpace = true
		// this._buildBFO();

		this._connectorId = selectedConnector || SmartceiverWebUSBConnector.id
		// this._connectorId = typeof selectedConnector === 'undefined' ? SmartceiverWebUSBConnector.id : selectedConnector
		console.log('used connector: ' + this._connectorId)
		
		this._listeners = {}
		// this.bind(EventType.keyDit, 'tcvr', event => this._tone(1))
		// this.bind(EventType.keyDah, 'tcvr', event => this._tone(3))
		this.bind(EventType.keyDit, 'tcvr', _ => this._keyPtt())
		this.bind(EventType.keyDah, 'tcvr', _ => this._keyPtt())
		this._d("tcvr-init", "done")
	}

	switchPower(token, rig, remoddle, reversePaddle) {
		if ( /*! state &&*/ this._port) {
			this._d('disconnect', this._port && this._port.constructor.id)
			this.disconnectRemoddle()
			this._port.disconnect()
			this.unbind(this._connectorId)
			this._controls = null
			this._port = null
			this.fire(new TcvrEvent(EventType.pwrsw, this.powerSwState), true)
		} else /*if (state)*/ {
			this._d('connect', this._connectorId)
			this._reversePaddle = reversePaddle
			let connector = tcvrConnectors.get(this._connectorId)
			this.connectRemoddle(connector, remoddle)
			connector.connect(this, token, rig, (port) => {
				this._port = port
				this._controls = new TcvrControls(this)
				// reset tcvr configuration
				this.freq = this._freq[this._band][this._mode]
				setTimeout(_ => {
					this.mode = this._mode
					this.ptt = this._ptt
					this.wpm = this._wpm
					this.narrow = this._narrow
					// this.txEnabled = this._txEnabled
					// this.autoSpace = this._autoSpace
					// this.txKeyed = this._txKeyed
					// this.preamp = this._preamp
					// this.attn = this._attn
					this.gain = this._gain[this._band]
					this.agc = this._agc
					this.fire(new TcvrEvent(EventType.pwrsw, this.powerSwState), true)
				}, 2000) // wait for band change on tcvr

				window.onbeforeunload = _ => {
					this.disconnectRemoddle()
					this._port && this._port.disconnect()
				}
			})
		}
	}

	get powerSwState() {
		return this._port != null
	}

	async connectRemoddle(connector, type) {
		this.disconnectRemoddle() // remove previous instance

		try {
			this._remoddle = null
			if (type === 'usb') this._remoddle = await new RemoddleUsb(this).connect()
			else if (type === 'bt') this._remoddle = await new RemoddleBluetooth(this).connect()
		} catch (error) {
			console.error(`Remoddle: ${error}`)
		}
			
		if (this._remoddle) {
			this._remoddle.wpm = this.wpm // sync with current wpm state
			this._remoddle.reverse = this._reversePaddle
		}
	}

	disconnectRemoddle() {
		if (this._remoddle) {
			this.unbind(this._remoddle.constructor.id)
			this._remoddle.disconnect()
			this._remoddle = null
		}
	}

	remoddleCommand(c) {
		this._controls && this._controls.remoddleCommand(c)
	}

	_keyPtt() {
		if (!this.ptt) this.ptt = true
		if (this._pttTimer) {
			clearTimeout(this._pttTimer)
			this._pttTimer = null
		}
		this._pttTimer = setTimeout(() => {
			this._pttTimer = null
			if (this.ptt) this.ptt = false
		}, 400)
	}

	get connectorId() {
		return this._connectorId
	}

	whenConnected(proceed) {
		if (this.online) { // connected may be also undefined
			proceed()
		}
	}

	get online() {
		return this._port && this._port.connected !== false
	}

	get allBands() {
		// return this._freq.keys();
		return this.bands
	}

	get allModes() {
		return this.modes
	}

	// get allVfos() {
	// 	return _vfos
	// }

	get bands() {
		return _bands
	}

	get band() {
		return this._band
	}
	set band(band) {
		this.whenConnected(() => {
			this._d("band", band)
			if (band in this.bands) {
				this._band = band
				this.freq = this._freq[this._band][this._mode] // call setter
				// reset state - some tcvrs may store state on per band basis
				setTimeout(_ => {
					this.agc = this._agc
					this.gain = this._gain[this._band]
					// this.preamp = this._preamp
					// this.attn = this._attn
				}, 2000) // wait for band change on tcvr
			}
		})
	}

	get modes() {
		return _modes
	}
	get mode() {
		return this._mode
	}
	set mode(value) {
		this.whenConnected(() => {
			this._d("mode", value)
			if (value in this.modes) {
				this._mode = value
				this.freq = this._freq[this._band][this._mode] // call setter
				this.fire(new TcvrEvent(EventType.mode, _modes[this._mode]))
			}
		});
	}

	get freq() {
		return this._freq[this._band][this._mode]
	}
	set freq(freq) {
		this.whenConnected(() => {
			this._freq[this._band][this._mode] = freq
			this._d("freq", freq)
			this.fire(new TcvrEvent(EventType.freq, freq))
		});
	}

	get split() {
		return this._split[this._band][this._mode]
	}
	set split(freq) {
		if (this.online) {
			this._split[this._band][this._mode] = freq
			this._d('split', freq)
			this.fire(new TcvrEvent(EventType.split, freq))
		}
	}
	clearSplit() {
		this.split = 0
	}

	get rit() {
		return this._rit
	}
	set rit(value) {
		if (this.online) {
			this._d('rit', value)
			if (Math.abs(value) < 10000) {
				this._rit = value
				this.fire(new TcvrEvent(EventType.rit, value))
			}
		}
	}
	clearRit() {
		this.rit = 0
	}

	get xit() {
		return this._xit
	}
	set xit(value) {
		if (this.online) {
			this._d('xit', value)
			if (Math.abs(value) < 10000) {
				this._xit = value
				this.fire(new TcvrEvent(EventType.xit, value))
			}
		}
	}
	clearXit() {
		this.xit = 0
	}

	get steps() {
		return [20, 200]
	}
	get step() {
		return this._step
	}
	set step(value) {
		this._d('step', value)
		if (this.steps.includes(value)) {
			this._step = value
			this.fire(new TcvrEvent(EventType.step, value))
		}
	}

	get wpm() {
		return this._wpm
	}
	set wpm(wpm) {
		this.whenConnected(() => {
			this._d("wpm", wpm)
			if (wpm < 16 || wpm > 40) return
			this._wpm = wpm
			this.fire(new TcvrEvent(EventType.wpm, wpm))
		})
	}

	get reverse() {
		return this._reversePaddle
	}
	set reverse(value) {
		if (!this.online) return
		this._reversePaddle = value
		this._d('reverse', value)
		this.fire(new TcvrEvent(EventType.reverse, value))
	}

	get filters() {
		const filters = {
			'CW': [250, 2000], 'CWR': [250, 2000],
			'LSB': [2000, 2400], 'USB': [2000, 2400]
		}
		return filters[this.modes[this.mode]]
	}
	get filter() {
		return this._filter
	}
	set filter(bw) {
		if (!this.online) return
		this._d('filter', bw)
		if (this.filters.includes(bw)) {
			this._filter = bw
			this.fire(new TcvrEvent(EventType.filter, bw))
		}
	}

	get narrow() {
		return this.filter < this.filters[this.filters.length - 1]
	}
	set narrow(narrow) {
		this.filter = narrow ? this.filters[0] : this.filters[this.filters.length - 1]
		// this.whenConnected(() => {
		// 	this._narrow = narrow
		// 	this._d("narrow", narrow)
		// 	let bandwidth = narrow ? _narrowFilters[this._mode] : _wideFilters[this._mode]
		// 	this.fire(new TcvrEvent(EventType.filter, bandwidth))
		// })
	}

	get gains() {
		return [-10, 0, 20]
	}

	get gain() {
		// if (this.preamp) return 10
		// if (this.attn) return -10
		// return 0
		return this._gain[this._band]
	}
	set gain(value) {
		if (this.online) {
			this._gain[this._band] = value
			this.fire(new TcvrEvent(EventType.gain, value))
		}
		// let attn = false
		// let preamp = false
		// if (value > 0) this.preamp = true
		// else if (value < 0) this.attn = true

		// this.preamp = preamp
		// this.attn = attn
	}

	get preamp() {
		return this.gain > 0
	}
	set preamp(state) {
		this.gain = state ? 10 : 0
		// this.whenConnected(() => {
		// 	this._preamp = state
		// 	this._d("preamp", this._preamp)
		// 	this.fire(new TcvrEvent(EventType.preamp, this._preamp))
		// })
	}

	get attn() {
		return this.gain < 0
	}
	set attn(state) {
		this.gain = state ? -10 : 0
		// this.whenConnected(() => {
		// 	this._attn = state
		// 	this._d("attn", this._attn)
		// 	this.fire(new TcvrEvent(EventType.attn, this._attn))
		// });
	}

	get ptt() {
		return this._ptt
	}
	set ptt(state) {
		this.whenConnected(() => {
			this._ptt = state
			this._d("ptt", this._ptt)
			this.fire(new TcvrEvent(EventType.ptt, this._ptt))
		});
	}

	get agc() {
		return this._agc
	}
	set agc(state) {
		this.whenConnected(() => {
			this._agc = state
			this._d('agc', this._agc)
			this.fire(new TcvrEvent(EventType.agc, this._agc))
		})
	}

	// get txEnabled() {
	//   return this._txEnabled;
	// }
	// set txEnabled(txEnabled) {
	//   this.whenConnected(() => {
	//     this._txEnabled = txEnabled;
	//     this._d("txEnabled", txEnabled);
	//     // let data = "KE" + (txEnabled ? "1" : "0");
	//     // this._port.send(data + ";");
	//   });
	// }

	// get autoSpace() {
	//   return this._autoSpace;
	// }
	// set autoSpace(autoSpace) {
	//   this.whenConnected(() => {
	//     this._autoSpace = autoSpace;
	//     this._d("autoSpace", autoSpace);
	//     // let data = "KA" + (autoSpace ? "1" : "0");
	//     // this._port.send(data + ";");
	//   });
	// }

	// get txKeyed() {
	//   return this._txKeyed;
	// }
	// set txKeyed(txKeyed) {
	//   this.whenConnected(() => {
	//     this._txKeyed = txKeyed;
	//     this._d("txKeyed", txKeyed);
	//     // let data = "KT" + (txKeyed ? "1" : "0");
	//     // this._port.send(data + ";");
	//   });
	// }

	// get sidetone() {
	//   return this._bfoAmp !== undefined;
	// }
	// set sidetone(state) {
	//   if (state) {
	//     if ( ! this.sidetone) {
	//       this._buildBFO();
	//     }
	//   } else {
	//     this._bfoAmp = undefined;
	//     this._bfo.stop();
	//   }
	// }

	get sidetoneFreq() {
		return _sidetoneFreq
	}

	toggleFast() {
		this.step = this.step == 20 ? 200 : 20
	}

	bind(type, owner, callback) {
		if (!(type in this._listeners)) {
			this._listeners[type] = []
		}
		this._listeners[type].push(new EventListener(owner, callback))
		this._d(`bind: ${type} for ${owner}, callbacks`, this._listeners[type].length)
	}

	unbind(owner) {
		for (let type in this._listeners) {
			let stack = this._listeners[type]
			for (let i = 0, l = stack.length; i < l; i++) {
				if (stack[i] && stack[i].owner == owner) {
					this._d(`unbind ${type} for ${owner}`)
					stack.splice(i, 1)
				}
			}
		}
	}

	fire(event, force) {
		if (!force && !this.online) return false
		let stack = this._listeners[event.type]
		stack && stack.forEach(listenner => listenner.callback.call(this, event))
		return true //!event.defaultPrevented;
	}

	_d(what, value) {
		console.debug(what + "=" + value);
	}
}

class TcvrEvent {
	constructor(type, value) {
		this._type = type
		this._value = value
	}
	get type() { return this._type }
	get value() { return this._value }
}

class EventListener {
	constructor(owner, callback) {
		this._owner = owner
		this._callback = callback
	}
	get owner() { return this._owner }
	get callback() { return this._callback }
}

const EventType = Object.freeze({
	freq: 'freq', rit: 'rit', xit: 'xit', split: 'split',
	wpm: 'wpm', mode: 'mode', vfo: 'vfo', filter: 'filter', gain: 'gain',
	keyDit: 'keyDit', keyDah: 'keyDah', keySpace: 'keySpace', reverse: 'reverse',
	ptt: 'ptt', agc: 'agc', pwrsw: 'pwrsw', resetAudio: 'resetAudio', step: 'step',
})

class ConnectorRegister {
	constructor() { this._reg = {} }

	register(connector) { this._reg[connector.constructor.id] = connector }
	get(id) { return this._reg[id] }

	get all() { return Object.values(this._reg) }
}

var tcvrConnectors = new ConnectorRegister();
