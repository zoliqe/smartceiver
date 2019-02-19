class AudioProcessor {
	constructor(rtcTrackEvent, tcvr) {
		console.debug('Remote RTCTrackEvent:', rtcTrackEvent)
		this._stream = rtcTrackEvent.streams[0]
		this._track = rtcTrackEvent.track
		this._remoteAudio = document.querySelector('#remoteAudio')
		this.tcvr = tcvr
		
		this.tcvr.bind(EventType.ptt, 'audio', 
			event => event.value ? this.mute() : this.unmute())
		this._connectStream()
	}

	_connectStream() {
		this._remoteAudio && (this._remoteAudio.srcObject = this._stream)
	}

	close() {
		this._track && this._track.stop()
		this._stream = null
		this._track = null
		if (this._remoteAudio) {
			this._remoteAudio.removeAttribute("src")
			this._remoteAudio.removeAttribute("srcObject")
		}
		this.tcvr.unbind('audio')
	}

	trackRemoved(event) {
		console.debug('Remote track removed: ', event)
	}

	mute() {
		this._track.enabled = false
	}

	unmute() {
		this._track.enabled = true
	}
}