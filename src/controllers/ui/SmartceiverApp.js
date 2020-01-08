/* eslint-disable prefer-destructuring */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
import { LitElement, html, css } from 'lit-element'
import { classMap } from 'lit-html/directives/class-map.js'
import { Transceiver, Bands, } from '../../tcvr.js'
import { SignalsBinder } from '../../utils/signals.js'
import { get as resolveConnector } from '../../connector.js'
import { nextValue } from '../../utils/lists.js'
import { TcvrController } from '../../controller.js'
import { WakeLock } from './wakelock.js'
import { Microphone } from '../../utils/mic.js'

// import { template } from './templateMain.js';

const _vfos = ['main', 'rit', 'split']
const subvfoDefault = 'RIT/SPLIT'

export class SmartceiverApp extends LitElement {
  static get properties() {
    return {
			bandMHz: { type: String},
			freqDisplay: {type: String},
			vfo: {type: String},
			subvfo: {type: String},
			filter: {type: Number},
			wpm: {type: Number},
			mode: {type: String},
			gain: {type: Number},
			agc: {type: String},
			powerState: {type: Boolean},
			band: {type: Number},
			pwrbtnDisable: {type: Boolean},
    }
  }

  static get styles() {
    return css`
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        font-size: calc(10px + 2vmin);
        color: white;
        /* max-width: 960px; */
        margin: 0 auto;
      }

      header {
        width: 100%;
        background: #fff;
        border-bottom: 1px solid #ccc;
      }

      header ul {
        display: flex;
        justify-content: space-around;
        min-width: 400px;
        margin: 0 auto;
        padding: 0;
      }

      header ul li {
        display: flex;
      }

      header ul li a {
        color: #5a5c5e;
        text-decoration: none;
        font-size: 18px;
        line-height: 36px;
      }

      header ul li a:hover,
      header ul li a.active {
        color: blue;
      }

      main {
        flex-grow: 1;
				width: 100%;
				background-color: #444;
      }

      .app-footer {
        font-size: calc(12px + 0.5vmin);
        align-items: center;
      }

      .app-footer a {
        margin-left: 5px;
      }

			.freq-display {
				/*text-align: right;*/
				display: flexbox;
				font-size: 4em;
				font-weight: bold;
				font-family: Courier New, Courier, monospace;
				/*padding-right: 20px;*/
				padding-left: 10px;
				padding-top: 10px;
				text-align: left;
				color: lightgreen;
				flex-grow: 100;
				height: fit-content;
				user-select: none;
			}

			.rit {
				color: lightskyblue;
			}

			.split {
				color: #dd6b88;
			}

			.tx {
				color: #dd6b88;
			}

			.band {
				color: lightsteelblue;
				flex-grow: 1;
			}

			.subvfo {
				font-size: 2.5em;
			}

			/* .vfoflag {
				color: white;
				font-size: 0.5em;
				padding: 3px;
				vertical-align: middle;
				background-color: blue;
        border-radius: 10px;
			}
 */
      ul {
        list-style: none;
				display: flex;
				/* justify-content: center; */
				padding: 10px;
				margin: 0;
				width: fit-content;
      }
      .card {
        /* border-radius: 30px;  */
        background-color: #333;
        min-height: 400px;
        display: flex;
				align-content: flex-start;
				justify-content: flex-start;
      }
      .knob-card {
				/* max-width: 700px; */
				width: 700px;
				/* height: 450px; */
        display: flex;
				flex-grow: 1;
				flex-wrap: wrap;
				justify-content: flex-end;
				align-content: flex-start;
      }

      .controls-card {
				margin: auto;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				align-content: space-between;
			}
      .ctl {
        padding-top: 10px;
        padding-bottom: 10px;
        width: fit-content;
        margin: auto;
      }

      button {
        font-size: 1.5em;
        font-weight: bold;
        color: white;
        text-align: center;
        /* margin: 0.2em; */
        border-radius: 30px;
        min-width: 3.0em;
      }
      button.toggles[active] {
        background-color: blue;
      }
      button.toggles[active]:hover {
        background-color: lightblue;
      }
      button.toggles {
        width: 110px;
        /* margin-right: 30px; */
        background-color: darkblue;
      }
      button.toggles:hover {
        background-color: blue;
      }
      button.ctl {
        background-color: magenta;
        /* width: 58px; */
      }
      button.ctl:hover {
        background-color: magenta;
      }

			button.conbtn {
				background-color: darkred;
				color: white;
        border-radius: 5px;
				/* height: 2.5em; */
			}
			button.conbtn:disabled {
				background-color: black;
				color: darkgray;
			}
			button.on {
				background-color: darkgreen;
			}

      .ctl-value {
        padding: 5px;
        font-size: 2.5em;
        font-weight: bold;
        color: #50dd50;
        min-width: 105px;
        text-align: center;
      }
      .ctl-value:hover {
        color: #a0fda0;
      }
      .ctl-name { font-size: 0.5em; }


			input-knob {
				width: 10rem;
				height: 10rem;
        margin: 1.5em;
				/* margin-top: 4em; */
				margin-left: 0;
				display: block;
				border-radius: 100%;
				box-shadow: 0 0.3rem 0.3rem rgba(0, 0, 0, 0.5);
				background: #777;
				align-self: flex-end;
			}
			
			input-knob::part(rotator) {
				box-sizing: border-box;
				width: 10rem;
				height: 10rem;
				background: #777;
				border: 1rem double #aaa;
				border-bottom: 1rem solid #aaa;
				border-radius: 100%;
			}

			input-knob.fallback>span.fallback {
				display: block;
				box-sizing: border-box;
				background: #777;
				border: 1rem double #aaa;
				border-bottom: 1rem solid #aaa;
				border-radius: 100%;
				width: 10rem;
				height: 10rem;
			}
			
			.mark {
				display: inline-block;
				width: 100%;
				text-align: center;
				font: bold 200% monospace;
				color: #aaa;
			}
			
			.knobflag {
				color: white;
				/* font-size: 0.5em; */
				padding: 3px;
				margin-left: 2rem;
				vertical-align: middle;
				background-color: #aaa;
        border-radius: 10px;
			}

			#fft {
				/* border-color: gray;
				border-width: 2px;
				border-style: solid;
				top: 44px; */
				position: absolute;
				left: 130px;
				top: 110px;
				/* right: 20px; */
				/* padding: 2px; */
				width: 500px;
				height: 300px;
				background-color: #505050;
				color: #cfcfcf;
				/* z-index: -10; */
				z-index: 1;
			}
			`
	}
	
	static step2scale(step) {
		return step * 100
	}

  constructor() {
    super()
		// this.page = 'main';
		this.connectors = {}
		this.kredence = {}
		this.remoddle = null
		this._wakeLock = new WakeLock()
		this._params = new URLSearchParams(window.location.search)
		this._mic = new Microphone()
		this._initTcvr()

		this.powerState = false
		this.pwrbtnDisable = true
		this.ptt = false
    this.operator = ':::'
    this.band = 20
		this.bandMHz = 14
		this.wpm = 30
		this.filter = 2000
		this.agc = 'AGC'
		this.mode = 'MODE'
		this.gain = 0;
		this.vfo = _vfos[0]
		// this.subvfo = subvfoDefault
		this.unackStateQueries = 0
		setInterval(() => this._fetchStatus(), 5000)
  }

  render() {
    return html`
      <header>
      </header>

      <main>
      <ul class="app-grid">
					<li class="card controls-card">
							<button id="pwrbtn" class=${this._pwrbtnClass()} 
								@click=${this.connectPower} 
								?disabled=${this.pwrbtnDisable}>
								PWR
							</button>
							<button id="catbtn" class=${this._catbtnClass()} 
								@click=${this.connectCat}
								?disabled=${!this.connectorPwrConnected()}
								?hidden=${this.connectorPwrWithCat()}>
								CAT
							</button>
							<button id="pdlbtn" class=${this._pdlbtnClass()} 
								@click=${this.connectRemoddle}
								?disabled=${this.pwrbtnDisable}
								?hidden=${!this.powerState || !this.remoddle}>
								PDL
							</button>
              <button @click=${this.switchMode} class="toggles toggle-btn" ?hidden=${!this.powerState}>
                ${this.mode}
              </button>
              <button @click=${this.switchGain} class="toggles toggle-btn" ?hidden=${!this.powerState}>
                ${this.gain}
              </button>
              <button @click=${this.switchAgc} class="toggles toggle-btn" ?hidden=${!this.powerState}>
                ${this.agc}
              </button>
              <button @click=${this.switchFilter} class="toggles toggle-btn" ?hidden=${!this.powerState}>
                ${this.filter}
              </button>
              <button class="toggles toggle-btn" ?hidden=${!this.powerState}>
                ${this.wpm}
              </button>
					</li>
					<li class="card knob-card">
						<audio-processor id="audio-processor"></audio-processor>
						<span id="band" name="band" class=${this._dispBandClass()}
							@click=${this.switchBand}
							?hidden=${!this.powerState}>${this.bandMHz}</span>
						<span id="freq" name="freq" class=${this._dispFreqClass()} 
							@click=${this.switchStep}
							?hidden=${!this.powerState}>${this.freqDisplay}</span>
						<span id="subvfo" name="subvfo" class=${this._dispTxFreqClass()}
							@click=${this.switchVfo}
							?hidden=${!this.powerState}>
							<!-- <span id="splitflag" class="vfoflag" ?hidden=${this.vfo !== 'split'}>SPLIT</span> -->
							<!-- <span id="ritflag" class="vfoflag" ?hidden=${this.vfo !== 'rit'}>RIT</span> -->
							TX:${this.subvfo}</span>
						<input-knob id="freq-knob" name="freq-knob" 
							?hidden=${!this.powerState}><div class="mark">▲</div>
							<span id="splitflag" class="knobflag" ?hidden=${this.vfo !== 'split'}>SPLIT</span>
							<span id="ritflag" class="knobflag" ?hidden=${this.vfo !== 'rit'}>RIT</span>
						</input-knob>
						<!-- <div class="ctl">
							<button onclick="decreaseWpm" class="ctl" hidden="[[!powerState]]">--</button>
							<span class="ctl-value" hidden="[[!powerState]]">[[wpm]] 
								<span class="ctl-name" hidden="[[!powerState]]">WPM</span>
							</span>
							<button onclick="increaseWpm" class="ctl" hidden="[[!powerState]]">++</button>
            </div>
						<div class="ctl">
							<button onclick="decFilter" hidden="[[!powerState]]" class="ctl">--</button>
							<span class="ctl-value" hidden="[[!powerState]]">[[filter]]
								<span class="ctl-name" hidden="[[!powerState]]">Hz</span>
							</span>
							<button onclick="incFilter" hidden="[[!powerState]]" class="ctl">++</button>
            </div> -->
					</li>
					</ul>
      </main>

      <p class="app-footer"></p>`
	}
	
	firstUpdated() {
		// this.pwrbtn = this.shadowRoot.getElementById('pwrbtn')
		this.audioProcessor = this.shadowRoot.getElementById('audio-processor')
		this.knob = this.shadowRoot.getElementById('freq-knob')
		// this.knob = this.$['freq-knob']
		this.knob.addEventListener('knob-move-change', () => {
			if (!this.tcvr) return 
			const curValue = Math.floor(
				Number.parseFloat(this.knob.value) / 10) * 10

			if (this.vfo === 'main')
				this.tcvr.freq = curValue
			else if (this.vfo === 'split')
				this.tcvr.split = curValue
			else if (this.vfo === 'rit')
				this.tcvr.rit = curValue - this.tcvr.freq
		})

		window.onbeforeunload = () => {
			this.powerState = true
			this.connectPower()
		}
	}

	async _initTcvr() {
		const transceiver = new Transceiver()
		this.transceiver = transceiver

		this.signals = new SignalsBinder('ui', {
			ptt: value => {
				this.ptt = value
				if (value) this.audioProcessor.mute()
				else this.audioProcessor.unmute()
			},
			keyTx: value => {
				this.ptt = value
				if (value) this.audioProcessor.mute()
				else this.audioProcessor.unmute()
				// TODO handle mic / rxin
			},
			wpm: value => {this.wpm = value},
			mode: value => {this.mode = value},
			filter: value => {
				this.filter = value.filter
				this.audioProcessor.updateFilter({bandwidth: value.filter * 1.0})
			},
			gain: value => {this.gain = value},
			agc: value => {this.agc = value.agc},
			step: value => {
				this.knob.scale = SmartceiverApp.step2scale(value)
				this._displayFreq(this.tcvr.freq + this.tcvr.rit)
				this._displayTxFreq(this.tcvr.split)
			},
			band: value => { 
				this.band = value
				this._knobParamsByBand()
			},
			freq: value => {
				if (this.vfo === 'main') 
					this.knob.value = value// + this.tcvr.rit
				this._displayFreq(value + this.tcvr.rit)
				// if (this.vfo === 'split')
				this._displayTxFreq(this.tcvr.split)
				// else
					// this._displayTxFreq(this.tcvr.freq)
			},
			rit: value => {
				if (this.vfo === 'rit')
					this.knob.value = this.tcvr.freq + value
				this._displayFreq(this.tcvr.freq + value)
				this._displayTxFreq(this.tcvr.split)
				// this.subvfo = `RIT ${value < 0 ? '' : '+'}${value}Hz`
			},
			split: value => {
				if (value && this.vfo === 'split')
					this.knob.value = value
				this._displayFreq(this.tcvr.freq + this.tcvr.rit)
				this._displayTxFreq(value)
			},
			pwrsw: value => { 
				this.powerState = value
				this.pwrbtnDisable = false
				this._wakeLock.changeState(value)
				if (!value)
					this.audioProcessor.close()
				// this.pwrbtn.className = value ? 'conbtn on' : 'conbtn'
			},
			audioMute: async () => this.audioProcessor.switchMute(),
		})
		this.signals.out.bind(transceiver)

		await this._initConnector()
		if (this.remote && this.remoteController) {
			this.remote.attachTo(transceiver)
		} else {
			this.tcvr = new TcvrController('ui')
			this.tcvr.attachTo(transceiver)
	
			this.tcvr.reversePaddle = this._params.get('reverse') === '1'
			setInterval(() => this.tcvr.keepAlive(), 5000)
		}
	}
		
	_knobParamsByBand() {
		const b = Bands[this.band]
		this.bandMHz = Math.floor(b.name).toString().padStart(2, '_')
		this.knob.min = b.freqFrom
		this.knob.max = b.freqTo
	}

	async _initConnector() {
		const token = this._params.get('token')
		if (token) {
			this.kredence.token = token.trim()
		}
		
		const connectorParams = {tcvr: {}, kredence: this.kredence}
		this._parseTcvrName({value: this._params.get('tcvr'), connectorParams})

		this.remoddle = this._params.get('remoddle')

		const remotig = this._params.get('remotig')
		const usbpowron = this._params.get('usbpowron')
		const serpowron = this._params.get('serpowron')
		const sercat = this._params.get('sercat')
		const remote = this._params.get('remote')
		if (remotig && remotig.includes('@')) {
			[this.kredence.rig, this.kredence.qth] = 
				remotig.trim().toLowerCase().split('@', 2)
			await this._resolveConnector('remotig', connectorParams, 'pwr')
		}
		if (sercat === '1') {
			await this._resolveConnector('sercat', connectorParams, 'cat')
		}
		if (serpowron === '1') {
			await this._resolveConnector('serpowron', connectorParams, 'pwr')
		} else if (usbpowron === '1') {
			await this._resolveConnector('usbpowron', connectorParams, 'pwr')
		}
		if (!this.connectors.cat) {
			this.connectors.cat = this.connectors.pwr
		}


		if (remote && !remotig && remote.includes('@')) {
			[this.kredence.rig, this.kredence.qth] = remote.trim().toLowerCase().split('@', 2)
			this.remote = new TcvrController('remotig')
			const ctlModule = await import('../../controllers/remotig.js')
			this.remoteController = new ctlModule.RemotigController(this.remote, this.kredence, this.connectors)
			this.remoddle = null // disable remoddle controller
		}


		if (!this.connectors.cat && !this.remote) {
			throw new Error('No connector defined!')
		}

		await this._fetchStatus()
		this.pwrbtnDisable = false
		this.requestUpdate()
	}

	_parseTcvrName({value, connectorParams}) {
		const p = connectorParams
		const v = value && value.trim().toLowerCase()
		if (v && v.includes('-'))
			[p.tcvr.manufacturer, p.tcvr.model] = v.split('-', 2)
	}

	async _resolveConnector(id, params, type) {
		try {
			const connector = await resolveConnector(id, params)
			console.debug(`Resolved connector_params: id=${connector.id}_params=${JSON.stringify(params)}`)
			this.connectors[type] = connector
		} catch (e) {
			console.error(e)
			throw e
		}
	}

	async _fetchStatus() {
		if (!this.kredence.rig || !this.connectors[0] || this.powerState) return

		this.unackStateQueries += 1
		const status = await this.connectors[0].checkState(this.kredence)
		if (status && status.id) {
			console.debug('rtt:', status.rtt)
			this.operator = status.op || 'ON'
			this.unackStateQueries = 0
		}
		if (this.unackStateQueries > 2) this.operator = 'OFF'

		this._displayFreq(null) // display op
	}

	_fmt = new Intl.NumberFormat('en-US', {minimumIntegerDigits: 6})
	
	_displayFreq(freq) {
		if (freq === null || !this.tcvr || !Number.isInteger(freq)) {
			this.freqDisplay = this.operator
		}

		const khzHz = (freq - Math.floor(freq / 1000000) * 1000000)
		const frq = this._fmt.format(khzHz).replace(',', '.')
		const val = `.${frq}`
		this.freqDisplay = val.substring(0, val.length - this._nonTunableDigits())
	}

	_displayTxFreq(split) {
		if (!split || !this.tcvr || !Number.isInteger(split)) {
			split = this.tcvr.freq
		}

		const mhz = Math.floor(split / 1000000)
		const khzHz = (split - mhz * 1000000)
		const frq = this._fmt.format(khzHz).replace(',', '.')
		this.subvfo = `${mhz}.${frq.substring(0, frq.length - this._nonTunableDigits())}`
	}

	_nonTunableDigits() {
		if (!this.knob) return 0
		let cnt = 1
		if (this.knob.scale >= SmartceiverApp.step2scale(100)) cnt += 1
		if (this.knob.scale >= SmartceiverApp.step2scale(1000)) cnt += 2 // include dot
		if (this.knob.scale >= SmartceiverApp.step2scale(10000)) cnt += 1
		return cnt
	}

	async connectPower() {
		this.pwrbtnDisable = true
		if (this.powerState) {
			if (this.tcvr) {
				await this.disconnectRemoddle()
				this.tcvr.poweroff()
				await this.tcvr.disconnect()
			} else if (this.remote) {
				this.remote.poweroff()
				await this.remote.disconnect()
			}
			setTimeout(() => this.requestUpdate(), 2000) // FIXME need event (onconnect)
			return
		}

		const pwrWithCat = this.connectorPwrWithCat()
		const connectors = pwrWithCat ? this.connectors : { pwr: this.connectors.pwr }
		if (this.tcvr) {
			await this.tcvr.connect(connectors)
			if (pwrWithCat) {
				console.info('pwr connector contains cat - auto powering on')
				this.tcvr.poweron()
				await this._mic.request()
				this.audioProcessor.connectStream({streams: [this._mic.stream], track: this._mic.track})
			}
			if (this.connectors.pwr && this.connectors.pwr.id === 'remotig') {
				// on remotig, click-event (user action) can be used to 'auto' connect remoddle
				this.connectRemoddle()
			}
		} else if (this.remote) {
			await this.remote.connect(connectors)
		}
		setTimeout(() => this.requestUpdate(), 5000) // FIXME need event (onconnect)
	}

	connectorPwrWithCat() {
		return !this.connectors.pwr || !this.connectors.cat 
			|| this.connectors.pwr.id === this.connectors.cat.id
	}

	connectorPwrConnected() {
		return !this.connectors.pwr || this.connectors.pwr.connected
	}

	_pwrbtnClass() {
		return classMap({
			conbtn: true,
			on: this.powerState
		})
	}

	async connectCat() {
		if (this.tcvr) {
			await this.tcvr.connect({ cat: this.connectors.cat })
			this.tcvr.poweron()
		} else if (this.remote) {
			this.remote.connect({ cat: this.connectors.cat })
		}
	}

	_catbtnClass() {
		return classMap({
			conbtn: true,
			on: this.connectors.cat && this.connectors.cat.connected
		})
	}

	async connectRemoddle() {
		if (!this.remoddle) return
		await this.disconnectRemoddle() // remove previous instance

		try {
			const module = await import('../remoddle.js')
			this._remoddleCtlr = await new module.RemoddleBluetooth(this.transceiver).connect()
			this._remoddleCtlr.reverse = this.tcvr.reversePaddle
		} catch (error) {
			console.error(`Remoddle: ${error}`)
			throw error
		}
	}

	async disconnectRemoddle() {
		if (this._remoddleCtlr) {
			// this.unbind(this._remoddleCtlr.constructor.id)
			await this._remoddleCtlr.disconnect()
			this._remoddleCtlr = null
		}
	}

	_pdlbtnClass() {
		return classMap({
			conbtn: true,
			on: this._remoddleCtlr != null
		})
	}

	_dispBandClass() {
		return classMap({
			'freq-display': true,
			'band': true,
		})
	}

	_dispFreqClass() {
		return classMap({
			'freq-display': true,
			'tx': this.ptt && this.vfo === 'main',
			'rit': this.vfo === 'rit'
		})
	}

	_dispTxFreqClass() {
		return classMap({
			'freq-display': true,
			'subvfo': true,
			'tx': this.vfo !== 'main'
		})
	}

	decreaseWpm() {
		this.tcvr.wpm = this.wpm - 2;
	}

	increaseWpm() {
		this.tcvr.wpm = this.wpm + 2;
	}

	switchMode() {
		this.tcvr.mode = nextValue(this.tcvr.modes, this.mode)
	}

	switchGain() {
		this.tcvr.gain = nextValue(this.tcvr.gains, this.gain)
	}
			
	switchBand() {
		this.tcvr.band = nextValue(this.tcvr.bands, this.band)
	}

	switchStep() {
		this.tcvr.step = nextValue(this.tcvr.steps, this.knob.scale / SmartceiverApp.step2scale(1))
	}

	switchFilter() {
		this.tcvr.filter = nextValue(this.tcvr.filters, this.filter)
	}

	switchAgc() {
		this.tcvr.agc = nextValue(this.tcvr.agcTypes, this.agc)
	}

	switchVfo() {
		if (this.vfo === 'split')
			this.tcvr.split = 0
		else if (this.vfo === 'rit')
			this.tcvr.rit = 0

		this.vfo = nextValue(_vfos, this.vfo)

		this.knob.value = this.tcvr.freq
		if (this.vfo === 'split') {
			// this._knobParamsByBand()
			// this.knob.value = this.tcvr.freq
			this.tcvr.split = this.tcvr.freq
		}/* else if (this.vfo === 'rit') {
			// TODO rit knob settings from tcvr
			// this.knob.min = -9999
			// this.knob.max = 9999
			// this.knob.value = 0
			// this.tcvr.rit = 0
		} else {
			// this._knobParamsByBand()
			this.knob.value = this.tcvr.freq
			// this.subvfo = subvfoDefault
		}*/
	}

}
