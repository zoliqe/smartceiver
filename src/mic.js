class Microphone {
	constructor(tcvr) {
		this.userMediaConstraints = {
			video: false,
			audio: {
				sampleRate: 8000,
				// sampleSize: 16,
				channelCount: 1,
				volume: 1.0,
				autoGainControl: false,
				echoCancellation: false,
				noiseSuppression: false
			}
		}
		this.tcvr = tcvr
	}

	request() {
		console.debug('Requesting user microphone with constraints', this.userMediaConstraints)
		return navigator.mediaDevices.getUserMedia(this.userMediaConstraints)
			.then(stream => {
				this._stream = stream
				this._track = stream.getAudioTracks()[0]
				console.debug('Adding microphone', stream, this._track)
				this._track && console.info('Microphone constraints:', this._track.getSettings())
				this.mute()
				this.tcvr.bind(EventType.ptt, 'mic', 
					event => event.value ? this.unmute() : this.mute())
				return this
			})
			.catch(error => alert('Request to access your microphone was unsucessfull.\nSSB transmit will not be available.\nError: ' + error.name))
	}

	close() {
		this._track && this._track.stop()
		this._stream = null
		this._track = null
		this.tcvr.unbind('mic')
	}

	mute() {
		this._track && (this._track.enabled = false)
	}

	unmute() {
		this._track && (this._track.enabled = true)
	}

	get track() {
		return this._track
	}
	get stream() {
		return this._stream
	}
}