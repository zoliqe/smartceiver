/* eslint-disable no-unused-expressions */
/* eslint-disable class-methods-use-this */
import {WebRTC as ConnectionService} from '../utils/webrtc.js'
import {delay} from '../utils/time.js'

const poweroffDelay = 5 // delay (in sec) to poweroff tcvr after client disconnect

export class RemotigController {

	#local

	#remote

	#kredence

	#connectors

	constructor(tcvrController, kredence, connectors) {
		this.#local = tcvrController
		this.#local.exclusive = true
		this.#local.preventSubcmd = true
		this.#kredence = kredence || {}
		this.#connectors = connectors

		this.#remote = new ConnectionService()
		this.#remote.onControlOpen = () => this._onControlOpen()
		this.#remote.onControlClose = () => this._onControlClose()
		this.#remote.onControlMessage = e => this._onControlMessage(e)
		// this.#remote.onTrack = e => this._onTrack(e)
		// this.#remote.onRemoveTrack = e => this._onRemoveTrack(e)
		// this.#remote.ondisconnect = () => this._onDisconnect()
		this.#remote.serveTransceiver(this.#kredence, () => this.info)
	}

	async _onControlOpen() {
		await this.#local.poweron() // disable remoddle
	}

	async _onControlClose() {
		this.#remote.sendMessage('bye')
		this.#remote.sendSignal('logout', this.#kredence.rig)
		this.#remote.disconnect()
		
		await delay(poweroffDelay) // delayed poweroff
		this.#local.poweroff()
	}

	_onControlMessage(event) {
		const msg = event.data
		console.debug(`${new Date().toISOString()} cmd: ${msg}`)
	
		if (msg === 'poweron') {
			this.#local.keepAlive() // heartbeat for session live
		} else if (msg === 'poweroff') {
			// shouldn't be not used
		} else if (['ptton', 'pttoff'].includes(msg)) {
			this.#local.ptt = msg.endsWith('on')
		} else if (msg === '.') {
			this.#local.keyDit()
		} else if (msg === '-') {
			this.#local.keyDah()
		} else if (msg === '_') {
			this.#local.keySpace()
		} else if (msg.startsWith('wpm=')) {
			this.#local.wpm = Number(msg.substring(4))
		} else if (msg.startsWith('f=')) {
			this.#local.freq = Number(msg.substring(2))
		} else if (msg.startsWith('band=')) {
			this.#local.band = Number(msg.substring(5))
		} else if (msg.startsWith('split=')) {
			this.#local.split = Number(msg.substring(6))
		} else if (msg.startsWith('rit=')) {
			this.#local.rit = Number(msg.substring(4))
		// } else if (msg.startsWith('xit=')) {
		// 	this.#local.xit = msg.substring(4)
		// } else if (msg.startsWith('ritclr')) {
		// 	this.#local.clearRit()
		// } else if (msg.startsWith('xitclr')) {
		// 	tcvr && this.#local.clearXit()
		} else if (msg.startsWith('mode=')) {
			this.#local.mode = msg.substring(5)
		} else if (msg.startsWith('filter=')) {
			this.#local.filter = Number(msg.substring(7))
		} else if (msg.startsWith('gain=')) {
			this.#local.gain = Number(msg.substring(5))
		} else if (msg.startsWith('agc=')) {
			this.#local.agc = msg.substring(4)
		} else if (msg === 'info?') {
			this.#remote.sendSignal('info', this.info)
		} else if (msg.startsWith('ping=')) {
			this.#remote.sendCommand(msg.replace('ping', 'pong'))
		} else {
			console.warn(`ERROR unknown cmd: '${msg}'`)
		}
	}

	get info() {
		return { 
			props: this.#local.properties.toJSON(), 
			propDefaults: this.#local.propDefaults,
		}
	}
	
}

// function whoIn(token) {
// 	if (!token) return null
// 	const delPos = token.indexOf('-')
// 	return delPos > 3 ? token.substring(0, delPos).toUpperCase() : null
// }
