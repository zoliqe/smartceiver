/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
/* eslint-disable prefer-destructuring */
import { LitElement, html, css } from 'lit-element'

export class AudioProcessor extends LitElement {
  static get properties() {
    return {
			hidden: { type: Boolean, reflect: true },
		}
  }

  static get styles() {
    return css`
			#fft {
				/* border-color: gray;
				border-width: 2px;
				border-style: solid;
				top: 44px; */
				position: absolute;
				left: 120px;
				top: 35px;
				/* right: 20px; */
				/* padding: 2px; */
				width: 500px;
				height: 300px;
				background-color: #212121;
				color: #cfcfcf;
				z-index: 0;
			}`
	}
	
	constructor() {
		super()
		// this.tcvr = tcvr

		this._filterArray = []
		this._filterCount = 4 // 10
		this._hpfCutoff = 400
		this._Q = 2
		this._cutoffDiv = 2 // 4

		// this.tcvr.bind(SignalType.ptt, 'audio', 
		// 	event => event.value ? this.mute() : this.unmute())
		// this.tcvr.bind(SignalType.filter, 'audio',
		// 	event => this.updateFilter({bandwidth: event.value.filter * 1.0}))
		// this.tcvr.bind(SignalType.audioMute, 'audio',
		// 	event => this.switchMute())
		// drawSpectrum()
	}

  render() {
		return html`<canvas id="fft" class="fft" ?hidden=${this.hidden}></canvas>`
	}

	firstUpdated() {
		this._canvas = this.shadowRoot.getElementById('fft')
		this._canvasCtx = this._canvas.getContext('2d')
		this._canvas.height = 256
	}

	async connectStream(trackWithStream, 
// 		deviceLabels = ['USB Audio Device: USB Audio:2,0: Speaker', 'Speakers (USB Audio Device) (040d:3417)', 'USB Audio Device Analog Stereo', 'Audio Adapter (Planet UP-100, Genius G-Talk) Analog Stereo', 'Generic USB Audio Device: USB Audio:2,0: Speaker'],
		deviceLabels = ['USB Audio Device', 'Audio Adapter'],
	) {
		console.debug('connectStream:', trackWithStream)
		this._track = trackWithStream.track

		// hook for https://bugs.chromium.org/p/chromium/issues/detail?id=121673
		const stream = trackWithStream.streams[0]
		this._remoteAudio = document.createElement('audio')
		this._remoteAudio.muted = true
		this._remoteAudio.autoplay = true
		this._remoteAudio.srcObject = stream

		const outStream = this._buildAudioChain(stream)
		this._audioOutput = document.createElement('audio')
		this._audioOutput.autoplay = true
		this._audioOutput.srcObject = outStream
		const deviceId = await this._findDeviceIdByLabel(deviceLabels)
		if (deviceId != null) {
			this._audioOutput.setSinkId(deviceId)
		}

		this._drawSpectrum()
	}

	async _findDeviceIdByLabel(labelsFilter) {
		try {
			const allDevices = await navigator.mediaDevices.enumerateDevices()
			console.debug('AudioProcessor: Found these audiooutput devices:', allDevices)
			const devices = allDevices
				.filter(device => device.kind === 'audiooutput')
				.filter(device => labelsFilter.some(labelFilter => device.label.includes(labelFilter)))
			console.info('AudioProcessor: Selected these audiooutput devices (using first, if one found):', devices)
			return devices.length === 1 ? devices[0].deviceId : null // only when exactly one device found, otherwise user must select default device in OS
		} catch (e) {
			console.error('Error enumerating mediaDevices:', e)
			return null
		}
	}

	close() {
		this._track && this._track.stop()
		// this._stream = null
		this._track = null
		this._remoteAudio && this._remoteAudio.remove()
		this._audioOutput && this._audioOutput.remove()
		// this.tcvr.unbind('audio')
	}

	// trackRemoved(event) {
	// 	console.debug('Remote track removed: ', event)
	// }

	mute() {
		// if (this._track) 
		// 	this._track.enabled = false
	}

	unmute() {
		if (this._track)
			this._track.enabled = true
	}

	switchMute() {
		if (this._track)
			this._track.enabled = !this._track.enabled
		// if (this._track.enabled) return;
		// this._track.stop()
		// this._stream.removeTrack()
		// if (this._remoteAudio) {
		// 	this._remoteAudio.removeAttribute("src")
		// 	this._remoteAudio.removeAttribute("srcObject")
		// }
	}

	_buildAudioChain(stream) {
		this._audioCtx = new AudioContext()
		this._analyser = this._audioCtx.createAnalyser()
		this._analyser.fftSize = 512
//fixed 		this._analyser.smoothingTimeConstant = 0.82
// 		this._gain = this._audioCtx.createGain()
// 		this._gain.connect(this._analyser)

		const destination = this._audioCtx.createMediaStreamDestination()
		// this._buildFilterChain(destination)
		this._analyser.connect(destination)
// 		this._gain.connect(destination)

		this._canvas.width = this._analyser.frequencyBinCount / this._cutoffDiv / 2

// 		this._audioCtx.createMediaStreamSource(stream).connect(this._gain)
		this._audioCtx.createMediaStreamSource(stream).connect(this._analyser)
		return destination.stream
	}

	_buildFilterChain(destination) {
		if (!this._audioCtx) return
		console.debug(`building ${this._filterCount} filters...`)
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
		this._filterArray[this._filterCount - 1].connect(/* this._audioCtx. */destination)
		console.debug("filters build done")
	}
	
	updateFilter(tcvrFilter) {
		/*if (!this._audioCtx) return
		// if (filterSelect.selectedIndex != tcvrFilter.filter) {
		// 	filterSelect.selectedIndex = tcvrFilter.filter
		// 	// TODO stop propagate default event
		// }
		this._bw = tcvrFilter.bandwidth > 300 ? tcvrFilter.bandwidth : 300
		const lpfCutoff = this._bw + this._hpfCutoff // add hpf cutoff to bandwidth
		console.debug(`tcvr.bandwidth=${tcvrFilter.bandwidth}, lpfCutoff=${lpfCutoff}`)
		for (let i = 0; i < this._filterCount; i += 1) {
			const filter = this._filterArray[i]
			filter.frequency.setValueAtTime(lpfCutoff, 0)
			filter.Q.setValueAtTime(this._Q, 0)
		}*/
	}
	
	_drawSpectrum() {
		// if (!this._track || !this._track.enabled || !this._audioCtx) return;
		if (!this._audioCtx) return;
	
		const freqByteData = new Uint8Array(this._analyser.frequencyBinCount)
		this._analyser.getByteFrequencyData(freqByteData) // analyser.getByteTimeDomainData(freqByteData);
		const binFreq = this._binFrequency(1)
		// var numBars = Math.round(CANVAS_WIDTH / SPACER_WIDTH);
	
		this._canvasCtx.clearRect(0, 0, this._canvas.width, this._canvas.height)
		this._canvasCtx.globalAlpha = 1.0
		for (let i = 3; i < this._analyser.frequencyBinCount / this._cutoffDiv; i += 1) {
// 			if (i > 3 && (i * binFreq) % 1000 < 80) {
// 				this._canvasCtx.fillStyle = '#000'
// 				this._canvasCtx.fillRect(i, this._canvas.height, 1, -this._canvas.height)
// 			}
			const magnitude = freqByteData[i]
			this._canvasCtx.fillStyle = `rgb(40,40,${magnitude*0.4 + 150})` // `rgb(50,${magnitude},80)`
			this._canvasCtx.fillRect(i, this._canvas.height, 1, -magnitude)
		}
	
		this._canvasCtx.globalAlpha = 0.1
		this._canvasCtx.fillStyle = '#555'
		this._canvasCtx.lineCap = 'round'
		let bw = Math.max(this._bw, 600)
		bw /= binFreq
		if (this._bw > 1000)
			bw -= 4
		const lf = this._hpfCutoff / binFreq - 1
		this._canvasCtx.fillRect(lf, this._canvas.height, bw, -this._canvas.height)

		window.requestAnimationFrame(t => this._drawSpectrum(t), this._canvas)
	}
	
	_binFrequency(n) {
		return n * this._audioCtx.sampleRate / this._analyser.fftSize
	}
}
