const _vfos = ['A', 'B']
const _bands = ['1.8', '3.5', '7', '10.1', '14', '18', '21', '24', '28']
const _bandLowEdges = [1800000, 3500000, 7000000, 10100000, 14000000, 18068000, 21000000, 24890000, 28000000]
const _modes = ['LSB', 'USB', 'CW', /*'CWR'*/] // order copies mode code for MDn cmd
const _narrowFilters = [2000, 2000, 250, 250] // in _modes order
const _wideFilters =   [2400, 2400, 2000, 2000] // in _modes order
// const _narrowFilters = ['1800', '1800', '0200', '0200']; // in _modes order
// const _wideFilters =   ['2700', '2700', '0600', '0600']; // in _modes order
const _sidetoneFreq = 650
const _sidetoneLevel = 0.2

class Transceiver {
	constructor() {
		this._rxVfo = 0
		this._txVfo = 0 // TODO split operation
		this._band = 2
		this._mode = 2
		this._freq = []
		_bandLowEdges.forEach(freq => {
			let band = _bandLowEdges.indexOf(freq)
			if (!(band in this._freq)) {
				this._freq[band] = []
			}
			for (const mode in _modes) {
				if (!(mode in this._freq[band])) {
					this._freq[band][mode] = []
				}
				for (const vfo in _vfos) {
					this._freq[band][mode][vfo] = freq
				}
			}
		})
		console.log(`freqs=${this._freq}`)
		this._wpm = 28
		this._narrow = false
		this._preamp = false
		this._attn = false
		this._ptt = false
		this._agc = true
		this._step = 20
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
		this.bind(EventType.mainUp, 'tcvr', event => this.freq += this._step)
		this.bind(EventType.mainDown, 'tcvr', event => this.freq -= this._step)
		this.bind(EventType.mainButton, 'tcvr', event => {
			this.band = (this.band + 1) < _bands.length ? (this.band + 1) : 0
		})
		this.bind(EventType.subUp, 'tcvr', event => this.freq += this._step)
		this.bind(EventType.subDown, 'tcvr', event => this.freq -= this._step)
		// this.bind(EventType.subUp, 'tcvr', event => this.wpm += 2)
		// this.bind(EventType.subDown, 'tcvr', event => this.wpm -= 2)
		this._d("tcvr-init", "done")
	}

	switchPower(token, rig, remoddle) {
		if ( /*! state &&*/ this._port) {
			this._d(`disconnect ${this._port}`, true)
			this.disconnectRemoddle()
			this._port.disconnect()
			this.unbind(this._connectorId)
			this._port = null
			this.fire(new TcvrEvent(EventType.pwrsw, this.powerSwState))
		} else /*if (state)*/ {
			this._d('connect')
			let connector = tcvrConnectors.get(this._connectorId)
			this.connectRemoddle(connector, remoddle)
			connector.connect(this, token, rig, (port) => {
				this._port = port
				// reset tcvr configuration
				this.freq = this._freq[this._band][this._mode][this._rxVfo]
				this.mode = this._mode
				this.ptt = this._ptt
				this.wpm = this._wpm
				this.narrow = this._narrow
				// this.txEnabled = this._txEnabled
				// this.autoSpace = this._autoSpace
				// this.txKeyed = this._txKeyed
				this.preamp = this._preamp
				this.attn = this._attn
				this.agc = this._agc
				this.fire(new TcvrEvent(EventType.pwrsw, this.powerSwState))

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
			
		if (this._remoddle) this._remoddle.wpm = this.wpm // sync with current wpm state
	}

	disconnectRemoddle() {
		if (this._remoddle) {
			this.unbind(this._remoddle.constructor.id)
			this._remoddle.disconnect()
			this._remoddle = null
		}
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
		if (this._port && this._port.connected !== false) { // connected may be also undefined
			proceed()
		}
	}

	get allBands() {
		// return this._freq.keys();
		return _bands
	}

	get allModes() {
		return _modes
	}

	get allVfos() {
		return _vfos
	}

	get band() {
		return this._band
	}
	set band(band) {
		this.whenConnected(() => {
			this._d("band", band)
			if (band in _bands) {
				this._band = band
				this.freq = this._freq[this._band][this._mode][this._rxVfo] // call setter
				// reset state - some tcvrs may store state on per band basis
				this.preamp = this._preamp
				this.attn = this._attn
				this.agc = this._agc
			}
		})
	}

	get mode() {
		return this._mode
	}
	set mode(value) {
		this.whenConnected(() => {
			this._d("mode", value)
			if (value in _modes) {
				this._mode = value
				this.freq = this._freq[this._band][this._mode][this._rxVfo] // call setter
				this.fire(new TcvrEvent(EventType.mode, _modes[this._mode]))
			}
		});
	}

	get freq() {
		return this._freq[this._band][this._mode][this._rxVfo]
	}
	set freq(freq) {
		this.whenConnected(() => {
			this._freq[this._band][this._mode][this._rxVfo] = freq
			this._d("freq", freq)
			this.fire(new TcvrEvent(EventType.freq, freq))
		});
	}

	get step() {
		return this._step
	}
	set step(value) {
		this._step = value
	}

	get wpm() {
		return this._wpm
	}
	set wpm(wpm) {
		this.whenConnected(() => {
			this._wpm = wpm
			this._d("wpm", wpm)
			this.fire(new TcvrEvent(EventType.wpm, wpm))
		})
	}

	get narrow() {
		return this._narrow
	}
	set narrow(narrow) {
		this.whenConnected(() => {
			this._narrow = narrow
			this._d("narrow", narrow)
			let bandwidth = narrow ? _narrowFilters[this._mode] : _wideFilters[this._mode]
			this.fire(new TcvrEvent(EventType.filter, bandwidth))
		})
	}

	get preamp() {
		return this._preamp
	}
	set preamp(state) {
		this.whenConnected(() => {
			this._preamp = state
			this._d("preamp", this._preamp)
			this.fire(new TcvrEvent(EventType.preamp, this._preamp))
		})
	}

	get attn() {
		return this._attn
	}
	set attn(state) {
		this.whenConnected(() => {
			this._attn = state
			this._d("attn", this._attn)
			this.fire(new TcvrEvent(EventType.attn, this._attn))
		});
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

	fire(event) {
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
	freq: 'freq', wpm: 'wpm', mode: 'mode', vfo: 'vfo', filter: 'filter', 
	preamp: 'preamp', attn: 'attn', keyDit: 'keyDit', keyDah: 'keyDah', keySpace: 'keySpace', 
	ptt: 'ptt', agc: 'agc', pwrsw: 'pwrsw', resetAudio: 'resetAudio', 
	mainUp: 'mainUp', mainDown: 'mainDown', mainButton: 'mainButton',
	subUp: 'subUp', subDown: 'subDown', subButton: 'subButton',
})

class ConnectorRegister {
	constructor() { this._reg = {} }

	register(connector) { this._reg[connector.constructor.id] = connector }
	get(id) { return this._reg[id] }

	get all() { return Object.values(this._reg) }
}

var tcvrConnectors = new ConnectorRegister();
