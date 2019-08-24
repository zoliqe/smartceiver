class RemotigRTCConnector {
	static get id() { return 'remotig-rtc'; }
	static get name() { return 'Remotig remote via WebRTC'; }
	static get capabilities() { return [Remoddle.id]; }

	constructor() {
		this._isReady = false;
		this._isStarted = false;
	}

 	connect(tcvr, kredence, options, successCallback, discCallback) {
		if (this._isReady || this._isStarted) return;

		this.tcvr = tcvr
		this.kredence = kredence || {}
		this.options = options || {}
		this.onconnect = successCallback
		this.ondisconnect = discCallback
		this._connectSignaling()
	}

	reconnect() {
		this.sendSignal('restart')
		this.disconnect()
		// this._socket && this._socket.disconnect()
		setTimeout(_ => this._connectSignaling(), this.options.session.reconnectDelay)
	}

	disconnect(options = {alertUser: false}) {
		this.sendSignal('bye')
		this._audio && this._audio.close()
		this._audio = null
		// this._mic && this._mic.close()
		// this._mic = null

		this._isStarted = false
		this._isReady = false
		if (this._cmdChannel) {
			this._cmdChannel.close()
			this._cmdChannel.onopen = null
			// this._cmdChannel.onclose = null
			this._cmdChannel.onerror = null
			this._cmdChannel.onmessage = null
			this._cmdChannel = null
		}
	
		if (this._pc) {
			this._pc.close()
			this._pc.onicecandidate = null
			this._pc.ontrack = null
			// this._pc.onremovetrack = null
			this._pc = null
		}
		this._signaling && this._signaling.disconnect()
		this._signaling = null

		if (options.alertUser) {
			window.alert('Transceiver control disconnected!')
			this.ondisconnect && this.ondisconnect()
		}
	}
	
	get connected() {
		return this._isStarted && this._pc && this._cmdChannel
	}

	filter(bandWidth, centerFreq) {
		this.sendCommand('filter=' + bandWidth)
	}

	////////////////////////////////////////////////////

	_connectSignaling() {
		if (!this.kredence.rig || !this.kredence.token) return;

		console.info('connectSignaling:', this.kredence.qth)
		this._signaling = io.connect('wss://' + this.kredence.qth, this.options.signaling)

		this._signaling.on('full', rig => {
			console.error(`Rig ${rig} is busy`)
			window.alert('Transceiver is busy.')
			this.disconnect()
		})
		this._signaling.on('empty', rig => {
			console.error(`Rig ${rig} empty`)
			window.alert('Transceiver is not connected.')
			this.disconnect()
		})

		this._signaling.on('joined', async (rig) => {
			console.info('Operating ' + rig)
			this._isReady = true
			// this._mic = await new Microphone(this.tcvr).request()
			this.sendSignal('ready')
		})

		this._signaling.on('log', (array) => {
			console.debug.apply(console, array)
		})

		// This client receives a message
		this._signaling.on('message', (message) => {
			console.info('signal message:', message)
			if (message === 'ready') {
				this._maybeStart()
			} else if (message.type === 'offer') {
				!this._isStarted && this._maybeStart()
				this._pc.setRemoteDescription(new RTCSessionDescription(message))
				this._doAnswer()
			} else if (message.type === 'answer' && this._isStarted) {
				this._pc.setRemoteDescription(new RTCSessionDescription(message))
			} else if (message.type === 'candidate' && this._isStarted) {
				const candidate = new RTCIceCandidate({
					sdpMLineIndex: message.label,
					candidate: message.candidate
				})
				this._pc.addIceCandidate(candidate)
			} else if (message === 'bye' && this._isStarted) {
				console.info('Session terminated.')
				this.disconnect({alertUser: true})
			}
		})

		this._signaling.emit('join', this.kredence)
		console.debug('Joining', this.kredence.rig)
	}

	sendSignal(message) {
		if (this._signaling && this._signaling.connected) {
			console.debug('sendSignal:', message)
			this._signaling.emit('message', message)
		}
	}

	////////////////////////////////////////////////

	// _getLocalAudio() {
	// 	console.debug('Getting user media with constraints', this.userMediaConstraints)
	// 	navigator.mediaDevices.getUserMedia(this.userMediaConstraints)
	// 		.then(stream => this._gotStream(stream))
	// 		// .catch(function (e) {
	// 		//   alert('getUserMedia() error: ' + e.name);
	// 		// })
	// }

	// _gotStream(stream) {
	// 	console.debug('Adding local stream', stream)
	// 	this._localStream = stream
	// 	this._localStream.getAudioTracks().forEach(track => console.log(track.getSettings()))		
	// 	// this._localAudio.srcObject = stream;
	// 	this.sendSignal('ready')
	// }

	_maybeStart() {
		console.info(`>>>>>>> maybeStart(): isStarted=${this._isStarted}, isChannelReady=${this._isReady}`)
		if (!this._isStarted /*&& this._mic && this._mic.stream && this._mic.track*/ && this._isReady) {
			console.debug('>>>>>> creating peer connection')
			this._createPeerConnection()
			// this._pc.addTrack(this._mic.track, this._mic.stream)

			// this._localStream.getTracks().forEach(track => this._pc.addTrack(track, this._localStream))
			this._isStarted = true
		}
	}

	/////////////////////////////////////////////////////////

	_createPeerConnection() {
		try {
			const config = {'iceServers': this.options.iceServers}
			this._pc = new RTCPeerConnection(config)
			this._pc.onicecandidate = event => this._handleIceCandidate(event)
			this._pc.ontrack = event => this._audio = new AudioProcessor(event, this.tcvr)
			this._pc.onremovetrack = event => this._audio && this._audio.trackRemoved(event)
			this._pc.ondatachannel = event => {
				this._cmdChannel = event.channel
				this._cmdChannel.onopen = evt => this._onCmdChannelOpen(evt)
				this._cmdChannel.onclose = evt => this._onCmdChannelClose(evt)
				this._cmdChannel.onerror = evt => this._onCmdChannelError(evt)
				this._cmdChannel.onmessage = evt => this._onCmdChannelMessage(evt)
			}
			console.debug('Created RTCPeerConnnection')
		} catch (e) {
			console.error('Failed to create PeerConnection, exception: ' + e.message)
			alert('Cannot communicate with transceiver.')
			this.disconnect()
		}
	}

	_handleIceCandidate(event) {
		console.debug('icecandidate event: ', event)
		if (event.candidate) {
			this.sendSignal({
				type: 'candidate',
				label: event.candidate.sdpMLineIndex,
				id: event.candidate.sdpMid,
				candidate: event.candidate.candidate
			})
		} else {
			console.debug('End of candidates.')
		}
	}

	_doAnswer() {
		console.info('Sending answer to peer.')
		this._pc.createAnswer().then(
			desc => this._setLocalAndSendMessage(desc),
			error => console.error('doAnswer(): Failed to create session description: ' + error.toString())
		)
	}

	_setLocalAndSendMessage(sessionDescription) {
		this._pc.setLocalDescription(sessionDescription)
		console.debug('setLocalAndSendMessage sending message', sessionDescription)
		this.sendSignal(sessionDescription)
	}

///////////////////////////////////////////////////////////////////////
	sendCommand(cmd) {
		try {
			this._cmdChannel && this._cmdChannel.send(cmd)
		} catch (err) {
			console.error(`ERROR sendCommand(${cmd}):`, err)
			this.disconnect({alertUser: true})
		}
	}

	_onCmdChannelOpen(event) {
		console.log('ok, powering on')
		this.sendCommand('poweron')

		setTimeout(() => {
			this._startPowerOnTimer(this.options.session.heartbeat)
			this._bindCommands()
			this.onconnect && this.onconnect(this)
		}, this.options.session.connectDelay) // delay for tcvr-init after poweron 
	}

	_startPowerOnTimer(interval) {
		this._timer = setInterval(() => this.sendCommand('poweron'), interval)
	}

	_onCmdChannelClose() {
		clearInterval(this._timer)
	}

	_onCmdChannelMessage(event) {
		console.info('command received:', event.data)
	}

	_onCmdChannelError(event) {
		console.error('command error:', event)
	}

	_bindCommands() {
		if (!this.tcvr || !this._cmdChannel) return

		this.tcvr.bind(EventType.keyDit, RemotigRTCConnector.id, () => this.sendCommand("."))
		this.tcvr.bind(EventType.keyDah, RemotigRTCConnector.id, () => this.sendCommand("-"))
		this.tcvr.bind(EventType.keySpace, RemotigRTCConnector.id, () => this.sendCommand("_"))
		this.tcvr.bind(EventType.mode, RemotigRTCConnector.id, event => this.sendCommand("mode=" + event.value.toLowerCase()))
		this.tcvr.bind(EventType.freq, RemotigRTCConnector.id, event => this.sendCommand(`f=${event.value}`))
		this.tcvr.bind(EventType.rit, RemotigRTCConnector.id, event => this.sendCommand(`rit=${event.value}`))
		this.tcvr.bind(EventType.xit, RemotigRTCConnector.id, event => this.sendCommand(`xit=${event.value}`))
		this.tcvr.bind(EventType.split, RemotigRTCConnector.id, event => this.sendCommand(`split=${event.value}`))
		this.tcvr.bind(EventType.wpm, RemotigRTCConnector.id, event => this.sendCommand("wpm=" + event.value))
		this.tcvr.bind(EventType.filter, RemotigRTCConnector.id, event => this.filter(event.value, this.tcvr.sidetoneFreq))
		this.tcvr.bind(EventType.gain, RemotigRTCConnector.id, event => this.sendCommand(`gain=${event.value}`))
		// this.tcvr.bind(EventType.preamp, RemotigRTCConnector.id, event => this.sendCommand("preamp" + (event.value ? "on" : "off")))
		// this.tcvr.bind(EventType.attn, RemotigRTCConnector.id, event => this.sendCommand("attn" + (event.value ? "on" : "off")))
		this.tcvr.bind(EventType.ptt, RemotigRTCConnector.id, event => this.sendCommand('ptt' + (event.value ? 'on' : 'off')))
		this.tcvr.bind(EventType.agc, RemotigRTCConnector.id, event => this.sendCommand('agc' + (event.value ? 'on' : 'off')))
		this.tcvr.bind(EventType.resetAudio, RemotigRTCConnector.id, _ => this.reconnect(this.kredence.rig))
	}

}

tcvrConnectors.register(new RemotigRTCConnector())
