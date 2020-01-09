/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
import {SignalsBinder} from '../utils/signals.js'
import {AudioProcessor} from '../utils/audio.js'
// import {Microphone} from '../utils/mic.js'
import {delay} from '../utils/time.js'
import {WebRTC as ConnectionService} from '../utils/webrtc.js'
import {TransceiverProperties} from '../tcvr.js'

class RemotigConnector {

	#signals

	constructor(kredence, {options = {
		session: {
			connectDelay: 5000,   // delay in ms after connection establishment
			// reconnectDelay: 2000,   // delay in ms between disc and conn commands
		}}})
	{
		this.options = options || {}
		this.kredence = kredence || {}

		const conoptions = ConnectionService.defaultOptions
		conoptions.signaling.autoClose = true
		this._con = new ConnectionService(conoptions)
		this._con.onControlOpen = () => this._onControlOpen()
		this._con.onTrack = e => this.onTrack(e)
		this._con.onRemoveTrack = e => this._onRemoveTrack(e)
		this._con.ondisconnect = () => this.onDisconnect()
		
		this._initSignals()
	}

	get id() { return 'remotig'; }

 	async connect() {
		if (this._isReady || this._isStarted) return null

		this._con.connectTransceiver(this.kredence)
		return new Promise(resolve => {this._onconnect = () => resolve(this)})
	}

	async disconnect() {
		this._con && this._con.disconnect()
	}

	// async reconnect() {
	// 	this.sendSignal('restart')
	// 	await this.disconnect()
	// 	// this._socket && this._socket.disconnect()
	// 	setTimeout(_ => this._connectSignaling(), this.options.session.reconnectDelay)
	// }

	get connected() {
		return this._con.connected
	}

	checkState(kredence) {
		if (!kredence.qth || !kredence.rig) return null
		// const signaling = io.connect('wss://' + kredence.qth, {transports: ['websocket']}) 
		if (!this._con) return null
		const statePromise = new Promise((resolve) => {
			this._con.stateResolved = state => {
				this._con.stateResolved = null
				resolve(state)
			}
		})
		this._con.sendSignal('state', kredence.rig)
		return statePromise
	}

	get tcvrProps() {
		return this._con.info && new TransceiverProperties(this._con.info.props)
	}

	get tcvrDefaults() {
		return this._con.info && this._con.info.propDefaults
	}

	onDisconnect() {
		// this._audio && this._audio.close()
		// this._audio = null
		// this._mic && this._mic.close()
		// this._mic = null
	}
	
	onTrack(event) {
		// this._audio = new AudioProcessor(event)
	}

	_onRemoveTrack(event) {
		console.debug('Remote track removed: ', event)
		// this._audio && this._audio.trackRemoved(event)
	}

	async _onControlOpen() {
		console.log('ok, powering on')
		this._con.sendCommand('poweron')
		await delay(this.options.session.connectDelay)
		this._onconnect && this._onconnect()
	}

	// onControlClose() {
	// }

	_initSignals() {
		this.#signals = new SignalsBinder(this.constructor.id, {
			keyDit: async () => this._con.sendCommand('.'),
			keyDah: async () => this._con.sendCommand('-'),
			keySpace: async () => this._con.sendCommand('_'),
			wpm: async (value) => this._con.sendCommand(`wpm=${value}`),
			ptt: async (value) => {
				this._con.sendCommand(`ptt${value ? 'on' : 'off'}`)
				// if (value) this._audio.mute()
				// else this._audio.unmute()
			},
			mode: async (value) => this._con.sendCommand(`mode=${value}`),
			filter: async (value) => {
				this._con.sendCommand(`filter=${value.filter}`)
				// this._audio.updateFilter({bandwidth: value.filter * 1.0})
			},
			gain: async (value) => this._con.sendCommand(`gain=${value}`),
			agc: async (value) => this._con.sendCommand(`agc=${value.agc}`),
			freq: async (value) => this._con.sendCommand(`f=${value}`),
			band: async (value) => this._con.sendCommand(`band=${value}`),
			split: async (value) => this._con.sendCommand(`split=${value}`),
			rit: async (value) => this._con.sendCommand(`rit=${value}`),
			// xit: async (value) => this._con.sendCommand(`xit=${value}`),
			keepAlive: async () => this._con.sendCommand('poweron'),
			// audioMute: async () => this._audio.switchMute(),
		})
	}

	get signals() {
		return this.#signals
	}

}

// connectors.register(new RemotigRTCConnector())
export { RemotigConnector }
