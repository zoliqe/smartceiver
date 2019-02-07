
class RemotigRTCConnector {
	static get id() { return 'remotig-rtc'; }
	static get name() { return 'Remotig remote via WebRTC'; }
	static get capabilities() { return [Remoddle.id]; }

	constructor() {
		this.pcConfig = {
			'iceServers': [{
				//    'urls': 'stun:stun.l.google.com:19302'
				"urls": ["turn:om4aa.ddns.net:5349"],
				"username": "om4aa",
				"credential": "report559"
			}]
		}
		this.signalingConfig = {
			transports: ['websocket'],
			reconnectionDelay: 10000,
			reconnectionDelayMax: 60000,
		}
		this.signalingUrl = 'wss://om4aa.ddns.net'
		this.userMediaConstraints = {audio: true, video: false}
		
				this._isReady = false;
		this._isStarted = false;
		// this._socket;
		// this._localStream;
		// this._pc;
		// this._remoteStream;

		// this._localAudio = document.querySelector('#localAudio');
		this._remoteAudio = document.querySelector('#remoteAudio');
	}
	/////////////////////////////////////////////

	connect(tcvr, token, rig, successCallback, discCallback) {
		if (this._isReady || this._isStarted) return;

		this.tcvr = tcvr
		this.onconnect = successCallback
		this.ondisconnect = discCallback
		//const url = `wss://${location.host}/remotig-${rig}/control/${token}`
		console.info('connecting ' + this.signalingUrl)

		this._connectSignaling(rig)
		
		window.onbeforeunload = _ => {
			console.info('Hanging up.')
			this.sendSignal('bye')
			this.disconnect(true)
		}
	}

	reconnect(rig) {
		this.sendSignal('restart')
		this.disconnect(true)
		// this._socket && this._socket.disconnect()
		setTimeout(_ => this._connectSignaling(rig), 1000)
	}

	disconnect(resetOrError = false) {
		this.sendSignal('bye')
		this._isStarted = false
		this._isReady = false
		this._rig = null
		this._cmdChannel && this._cmdChannel.close()
		this._cmdChannel = null
		this._pc && this._pc.close()
		this._pc = null
		this._signaling && this._signaling.disconnect()
		if (!resetOrError) {
			window.alert('Transceiver control disconnected!')
			this.ondisconnect && this.ondisconnect()
		}
	}
	
	get connected() {
		return this._isStarted && this._pc && this._cmdChannel && this._rig
	}

	filter(bandWidth, centerFreq) {
		// TODO
		// if (this.player_) {
		//   this.player_.setFilter(centerFreq, bandWidth)
		// }
		this.sendCommand('filter=' + bandWidth)
	}

	////////////////////////////////////////////////////

	_connectSignaling(rig) {
		this._rig = rig
		this._signaling = io.connect(this.signalingUrl, this.signalingConfig)
		this._signaling.on('full', rig => {
			console.error(`Rig ${rig} is busy`)
			window.alert('Transceiver is busy.')
			this.disconnect(true)
		})

		this._signaling.on('joined', rig => {
			console.info('Operating ' + rig)
			this._isReady = true
			this._getLocalAudio()
		});

		this._signaling.on('log', (array) => {
			console.debug.apply(console, array)
		});

		// This client receives a message
		this._signaling.on('message', (message) => {
			console.debug('message:', message)
			if (message === 'got user media') {
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
				this.disconnect()
			}
		})

		this._signaling.emit('join', rig)
		console.debug('Attempted to operate signaling', rig)
	}

	sendSignal(message) {
		if (this._signaling && this._signaling.connected) {
			console.debug('sendSignal:', message)
			this._signaling.emit('message', message)
		}
	}

	////////////////////////////////////////////////

	_getLocalAudio() {
		console.debug('Getting user media with constraints', this.userMediaConstraints)
		navigator.mediaDevices.getUserMedia(this.userMediaConstraints)
			.then(stream => this._gotStream(stream))
			// .catch(function (e) {
			//   alert('getUserMedia() error: ' + e.name);
			// })
	}

	_gotStream(stream) {
		console.debug('Adding local stream', stream)
		this._localStream = stream;
		// this._localAudio.srcObject = stream;
		this.sendSignal('got user media')
	}

	_maybeStart() {
		console.info(`>>>>>>> maybeStart(): isStarted=${this._isStarted}, isChannelReady=${this._isReady}`)
		if (!this._isStarted && typeof this._localStream !== 'undefined' && this._isReady) {
			console.debug('>>>>>> creating peer connection')
			this._createPeerConnection()
			this._pc.addStream(this._localStream) // TODO deprecated?
			this._isStarted = true
		}
	}

	/////////////////////////////////////////////////////////

	_createPeerConnection() {
		try {
			this._pc = new RTCPeerConnection(this.pcConfig)
			this._pc.onicecandidate = event => this._handleIceCandidate(event)
			this._pc.onaddstream = event => this._handleRemoteStreamAdded(event)
			this._pc.onremovestream = event => this._handleRemoteStreamRemoved(event)
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
			this.disconnect(true)
		}
	}

	_handleRemoteStreamAdded(event) {
		console.debug('Remote stream added.')
		// this._remoteStream = event.stream;
		this._remoteAudio.srcObject = event.stream
	}

	_handleRemoteStreamRemoved(event) {
		console.debug('Remote stream removed. Event: ', event)
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
		this._cmdChannel && this._cmdChannel.send(cmd)
	}

	_onCmdChannelOpen(event) {
		console.log('ok, powering on')
		this.sendCommand('poweron')

		setTimeout(() => {
			this._startPowerOnTimer(10000)
			this._bindCommands()
			this.onconnect && this.onconnect(this)
		}, 5000) // delay for tcvr-init after poweron 
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
		this.tcvr.bind(EventType.wpm, RemotigRTCConnector.id, event => this.sendCommand("wpm=" + event.value))
		this.tcvr.bind(EventType.filter, RemotigRTCConnector.id, event => this.filter(event.value, this.tcvr.sidetoneFreq))
		this.tcvr.bind(EventType.preamp, RemotigRTCConnector.id, event => this.sendCommand("preamp" + (event.value ? "on" : "off")))
		this.tcvr.bind(EventType.attn, RemotigRTCConnector.id, event => this.sendCommand("attn" + (event.value ? "on" : "off")))
		this.tcvr.bind(EventType.ptt, RemotigRTCConnector.id, event => this.sendCommand('ptt' + (event.value ? 'on' : 'off')))
		this.tcvr.bind(EventType.agc, RemotigRTCConnector.id, event => this.sendCommand('agc' + (event.value ? 'on' : 'off')))
		this.tcvr.bind(EventType.resetAudio, RemotigRTCConnector.id, _ => this.reconnect(this._rig))
	}

}

tcvrConnectors.register(new RemotigRTCConnector())
