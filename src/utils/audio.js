/* eslint-disable no-unused-expressions */
// import {SignalType} from './signals.js'

class AudioProcessor {
	constructor(rtcTrackEvent) {
		console.debug('Remote RTCTrackEvent:', rtcTrackEvent)
		this._stream = rtcTrackEvent.streams[0]
		this._track = rtcTrackEvent.track
		this._remoteAudio = document.querySelector('#remoteAudio')
		// this.tcvr = tcvr

		this._audioCtx = new AudioContext()
		this._analyser = this._audioCtx.createAnalyser()
		this._gain = this._audioCtx.createGain()
		this._filterArray = []
		this._filterCount = 4 // 10
		this._hpfCutoff = 400
		this._Q = 2
		this._cutoffDiv = 2

		// this._canvas = document.querySelector('#fft')
		// this._canvasCtx = canvas.getContext('2d')
		// canvas.height = 256
		this._connectStream() // hook for https://bugs.chromium.org/p/chromium/issues/detail?id=121673

		// this._canvas.width = analyser.frequencyBinCount / cutoffDiv //document.body.clientWidth //1.4;
		this._analyser.fftSize = 512
		this._analyser.smoothingTimeConstant = 0.85
		this._audioCtx.createMediaStreamSource(this._stream).connect(this._gain)
		this._gain.connect(this._analyser)
		this._buildFilterChain()

		// this.tcvr.bind(SignalType.ptt, 'audio', 
		// 	event => event.value ? this.mute() : this.unmute())
		// this.tcvr.bind(SignalType.filter, 'audio',
		// 	event => this.updateFilter({bandwidth: event.value.filter * 1.0}))
		// this.tcvr.bind(SignalType.audioMute, 'audio',
		// 	event => this.switchMute())
		// drawSpectrum()
	}

	_connectStream() {
		this._remoteAudio && (this._remoteAudio.srcObject = this._stream)
		this._remoteAudio.muted = true
	}

	close() {
		this._track && this._track.stop()
		this._stream = null
		this._track = null
		if (this._remoteAudio) {
			this._remoteAudio.removeAttribute("src")
			this._remoteAudio.removeAttribute("srcObject")
		}
		// this.tcvr.unbind('audio')
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

	switchMute() {
		this._track.enabled = !this._track.enabled
		// if (this._track.enabled) return;
		// this._track.stop()
		// this._stream.removeTrack()
		// if (this._remoteAudio) {
		// 	this._remoteAudio.removeAttribute("src")
		// 	this._remoteAudio.removeAttribute("srcObject")
		// }
	}

	_buildFilterChain() {
		console.debug("building " + this._filterCount + " filters...")
		const hpf = this._audioCtx.createBiquadFilter()
		hpf.type = 'highpass'
		hpf.frequency.setValueAtTime(this._hpfCutoff, 0)
	
		for (let i = 0; i < this._filterCount; i +=1) {
			const filter = this._audioCtx.createBiquadFilter()
			this._filterArray[i] = filter
			filter.type = 'lowpass'
			if (i > 0) {
				this._filterArray[i - 1].connect(filter)
			}
		}
		this.updateFilter({bandwidth: 2000})
	
		this._analyser.connect(hpf)
		hpf.connect(this._filterArray[0])
		this._filterArray[this._filterCount - 1].connect(this._audioCtx.destination)
		console.debug("filters build done")
	}
	
	updateFilter(tcvrFilter) {
		// if (filterSelect.selectedIndex != tcvrFilter.filter) {
		// 	filterSelect.selectedIndex = tcvrFilter.filter
		// 	// TODO stop propagate default event
		// }
		this._bw = tcvrFilter.bandwidth > 300 ? tcvrFilter.bandwidth : 300
		const lpfCutoff = this._bw + this._hpfCutoff // add hpf cutoff to bandwidth
		console.debug("tcvr.bandwidth=" + tcvrFilter.bandwidth + ", lpfCutoff=" + lpfCutoff)
		for (let i = 0; i < this._filterCount; i++) {
			const filter = this._filterArray[i]
			filter.frequency.setValueAtTime(lpfCutoff, 0)
			filter.Q.setValueAtTime(this._Q/*centerFreq / bandwidth*/, 0)
		}
	}
	
	_drawSpectrum(time) {
		if (!this._track || !this._track.enabled) return;
	
		const freqByteData = new Uint8Array(this._analyser.frequencyBinCount)
		analyser.getByteFrequencyData(freqByteData) //analyser.getByteTimeDomainData(freqByteData);
		const binFreq = this._binFrequency(1)
		// var numBars = Math.round(CANVAS_WIDTH / SPACER_WIDTH);
	
		this._canvasCtx.clearRect(0, 0, this._canvas.width, this._canvas.height)
		this._canvasCtx.globalAlpha = 1.0
		for (let i = 0; i < this._analyser.frequencyBinCount / this._cutoffDiv; ++i) {
			if (i > 3 && (i * binFreq) % 1000 < 80) {
				this._canvasCtx.fillStyle = '#404040'
				this._canvasCtx.fillRect(i, this._canvas.height, 1, -this._canvas.height)
			}
			const magnitude = freqByteData[i]
			this._canvasCtx.fillStyle = 'rgb(50,' + magnitude + ',80)'
			this._canvasCtx.fillRect(i, this._canvas.height, 1, -magnitude)
		}
	
		this._canvasCtx.globalAlpha = 0.5
		this._canvasCtx.fillStyle = '#615913'
		this._canvasCtx.lineCap = 'round'
		this._canvasCtx.fillRect(this._hpfCutoff / binFreq, this._canvas.height, 
			this._bw / binFreq, -this._canvas.height)

			window.requestAnimationFrame(t => this._drawSpectrum(t), this._canvas)
	}
	
	_binFrequency(n) {
		return n * this._audioCtx.sampleRate / this._analyser.fftSize
	}
}

export {AudioProcessor}
