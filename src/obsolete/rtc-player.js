
const pcConfig = {
  'iceServers': [{
    //    'urls': 'stun:stun.l.google.com:19302'
    "urls": ["turn:om4aa.ddns.net:5349"],
    "username": "om4aa",
    "credential": "report559"
  }]
}

const userMediaConstraints = {audio: true, video: false}

class PlayerWebRTC {
  constructor() {
    this._isChannelReady = false;
    this._isStarted = false;
    this._socket;
    this._localStream;
    this._pc;
    this._remoteStream;

    this._localAudio = document.querySelector('#localAudio');
    this._remoteAudio = document.querySelector('#remoteAudio');
  }
  /////////////////////////////////////////////

  play(streamName) {
    if (this._isChannelReady || this._isStarted) return;
    this._connectSocket()
    this._socket.emit('join', streamName)
    console.log('Attempted to join stream', streamName)
  }

  reset(streamName) {
    this.stop()
    setTimeout(_ => this.play(streamName), 1000)
  }

  stop() {
    this.sendMessage('bye')
    this._isStarted = false
    this._isChannelReady = false
    this._pc && this._pc.close()
    this._pc = null
    this._socket && this._socket.disconnect()
  }

  setFilter(centerFreq, bandWidth) {
    // TODO
  }

  ////////////////////////////////////////////////////

  _connectSocket() {
    this._socket = io.connect();
    this._socket.on('full', (stream) => {
      console.log('Stream ' + stream + ' is full');
    });

    this._socket.on('joined', (stream) => {
      console.log('joined stream ' + stream);
      this._isChannelReady = true;
      this._getLocalStream()
    });

    this._socket.on('log', (array) => {
      console.log.apply(console, array);
    });

    // This client receives a message
    this._socket.on('message', (message) => {
      console.log('message:', message);
      if (message === 'got user media') {
        this._maybeStart();
      } else if (message.type === 'offer') {
        if (!this._isStarted) {
          this._maybeStart();
        }
        this._pc.setRemoteDescription(new RTCSessionDescription(message));
        this._doAnswer();
      } else if (message.type === 'answer' && this._isStarted) {
        this._pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate' && this._isStarted) {
        const candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        this._pc.addIceCandidate(candidate);
      } else if (message === 'bye' && this._isStarted) {
        console.log('Session terminated.')
        this.stop()
      }
    });
  }

  sendMessage(message) {
    if (this._socket && this._socket.connected) {
      console.log('sendMessage:', message);
      this._socket.emit('message', message);
    }
  }

  ////////////////////////////////////////////////

  _getLocalStream() {
    console.log('Getting user media with constraints', userMediaConstraints)
    navigator.mediaDevices.getUserMedia(userMediaConstraints)
      .then(stream => this._gotStream(stream))
      // .catch(function (e) {
      //   alert('getUserMedia() error: ' + e.name);
      // })
  }

  _gotStream(stream) {
    console.log('Adding local stream', stream);
    this._localStream = stream;
    this._localAudio.srcObject = stream;
    this.sendMessage('got user media');
  }

  _maybeStart() {
    console.log(`>>>>>>> maybeStart(): isStarted=${this._isStarted}, isChannelReady=${this._isChannelReady}`);
    if (!this._isStarted && typeof this._localStream !== 'undefined' && this._isChannelReady) {
      console.log('>>>>>> creating peer connection');
      this._createPeerConnection();
      this._pc.addStream(this._localStream);
      this._isStarted = true;
    }
  }

  /////////////////////////////////////////////////////////

  _createPeerConnection() {
    try {
      this._pc = new RTCPeerConnection(pcConfig);
      this._pc.onicecandidate = event => this._handleIceCandidate(event);
      this._pc.onaddstream = event => this._handleRemoteStreamAdded(event);
      this._pc.onremovestream = event => this._handleRemoteStreamRemoved(event);
      console.log('Created RTCPeerConnnection');
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
    }
  }

  _handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    this._remoteStream = event.stream;
    this._remoteAudio.srcObject = this._remoteStream;
  }

  _handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }

  _handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      this.sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates.');
    }
  }

  _doAnswer() {
    console.log('Sending answer to peer.');
    this._pc.createAnswer().then(
      desc => this._setLocalAndSendMessage(desc),
      error => trace('doAnswer(): Failed to create session description: ' + error.toString())
    );
  }

  _setLocalAndSendMessage(sessionDescription) {
    this._pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    this.sendMessage(sessionDescription);
  }

}

