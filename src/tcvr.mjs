import {TcvrEvent, EventType} from './util/events.mjs'

const _bands = ['1.8', '3.5', '7', /* '10.1', */ '14', /* '18', */ '21', /* '24', */ '28']
const _bandLowEdges = [1810, 3500, 7000, /* 10100, */ 14000, /* 18068, */ 21000, /* 24890, */ 28000]
const _startFreqFromLowEdge = 21
const _modes = ['LSB', 'USB', 'CW', /*'CWR'*/] // order copies mode code for MDn cmd
const _filters = {
	'CW': {min: 200, max: 2000}, 'CWR': {min: 200, max: 2000},
	'LSB': {min: 1800, max: 3000}, 'USB': {min: 1800, max: 3000}
}
const _sidetoneFreq = 650

const connectorConfig = {
	session: {
		heartbeat: 5000,      // time interval in ms for sending 'poweron' command
		connectDelay: 5000,   // delay in ms after connection establishment
		reconnectDelay: 2000,   // delay in ms between disc and conn commands
	},
	signaling: {
		transports: ['websocket'],
		reconnectionDelay: 10000,
		reconnectionDelayMax: 60000,
	},
}

class Transceiver {
	constructor() {
		this._band = 2
		this._mode = 2
		this._freq = []
		this._split = []
		this._gain = []
		for (let band in _bands) {
			this._freq[band] = []
			this._split[band] = []
			for (let mode in _modes) {
				this._freq[band][mode] = (_bandLowEdges[band] + _startFreqFromLowEdge) * 1000
				this._split[band][mode] = 0
			}
			this._gain[band] = 0
		}
		console.log(`freqs=${this._freq}`)

		this._filter = []
		for (let mode in _modes) {
			this._filter[mode] = _filters[_modes[mode]].max
		}

		this._wpm = 28
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

		// this._connectorId = connectorId //selectedConnector || SmartceiverWebUSBConnector.id
		// this._connectorId = typeof selectedConnector === 'undefined' ? SmartceiverWebUSBConnector.id : selectedConnector
		
		this._listeners = {}
		// this.bind(EventType.keyDit, 'tcvr', event => this._tone(1))
		// this.bind(EventType.keyDah, 'tcvr', event => this._tone(3))
		this.bind(EventType.keyDit, 'tcvr', _ => this._keyPtt())
		this.bind(EventType.keyDah, 'tcvr', _ => this._keyPtt())
		this._d("tcvr-init", "done")
	}

	async switchPower(connector, kredence, remoddle, reversePaddle) {
		if (this._port) {
			this._d('disconnect', this._port && this._port.constructor.id)
			this._controls = null
			this.disconnectRemoddle()
			this._port.disconnect()
			this.unbind(connector.id)
			this._port = null
			this.fire(new TcvrEvent(EventType.pwrsw, this.powerSwState), true)
		} else if (connector) {
			this._d('connect connector', connector.id)
			this._reversePaddle = reversePaddle
			this.connectRemoddle(connector, remoddle)
			this._port = await connector.connect(this, kredence, connectorConfig)
			// reset tcvr configuration
			this.band = this._band
			this.wpm = this._wpm
			this.fire(new TcvrEvent(EventType.pwrsw, this.powerSwState), true)
			// const ctlModule = await import('./remoddle/controls.mjs')
			// this._controls = new ctlModule.TcvrControls(this)

			window.onbeforeunload = _ => {
				this.disconnectRemoddle()
				this._port && this._port.disconnect()
			}
		}
	}

	get powerSwState() {
		return this._port != null
	}

	async connectRemoddle(connector, type) {
		this.disconnectRemoddle() // remove previous instance

		try {
			this._remoddle = null
			if (type === 'usb') {
				const module = await import('./remoddle/remoddle-usb.mjs')
				this._remoddle = await new module.RemoddleUsb(this).connect()
			} else if (type === 'bt') {
				const module = await import('./remoddle/remoddle-bt.mjs')
				this._remoddle = await new module.RemoddleBluetooth(this).connect()
			}
		} catch (error) {
			console.error(`Remoddle: ${error}`)
		}
			
		if (this._remoddle) {
			this._remoddle.wpm = this.wpm // sync with current wpm state
			this._remoddle.reverse = this._reversePaddle
			const ctlModule = await import('./remoddle/controls.mjs')
			this._controls = new ctlModule.TcvrControls(this)
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
					this.fire(new TcvrEvent(EventType.mode, _modes[this._mode]))
					this.fire(new TcvrEvent(EventType.gain, this._gain[this._band]))
					this.fire(new TcvrEvent(EventType.agc, this._agc))
					this.fire(new TcvrEvent(EventType.filter, this._filter[this._mode]))
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
				this.fire(new TcvrEvent(EventType.mode, _modes[this.mode]))
				this.fire(new TcvrEvent(EventType.freq, this._freq[this._band][this._mode]))
				this.fire(new TcvrEvent(EventType.filter, this._filter[this._mode]))
			}
		});
	}

	get freq() {
		return this._freq[this._band][this._mode]
	}
	set freq(freq) {
		this.whenConnected(() => {
			if (freq < (_bandLowEdges[this._band] - 1) * 1000 || freq > (_bandLowEdges[this._band] + 510) * 1000)
				return
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
		this.online && this.fire(new TcvrEvent(EventType.split, 0))
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
		this.online && this.fire(new TcvrEvent(EventType.rit, 0))
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
		this.online && this.fire(new TcvrEvent(EventType.xit, 0))
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

	get filterRange() {
		return _filters[this.modes[this._mode]]
	}
	get filter() {
		return this._filter[this._mode]
	}
	set filter(bw) {
		if (!this.online) return
		this._d('filter', bw)
		if (this.filterRange.min <= bw && this.filterRange.max >= bw) {
			this._filter[this._mode] = bw
			this.fire(new TcvrEvent(EventType.filter, bw))
		}
	}

	get gains() {
		return [-10, 0, 20]
	}

	get gain() {
		return this._gain[this._band]
	}
	set gain(value) {
		if (this.online) {
			this._gain[this._band] = value
			this.fire(new TcvrEvent(EventType.gain, value))
		}
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

class EventListener {
	constructor(owner, callback) {
		this._owner = owner
		this._callback = callback
	}
	get owner() { return this._owner }
	get callback() { return this._callback }
}

export {Transceiver}
