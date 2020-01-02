/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-expressions */
import { LitElement, html, css } from 'lit-element'
import { classMap } from 'lit-html/directives/class-map.js'
import { Transceiver, Bands, } from '../../tcvr.js'
import { SignalsBinder } from '../../utils/signals.js'
import { get as resolveConnector } from '../../connector.js'
import { nextValue } from '../../utils/lists.js'
import { TcvrController } from '../../controller.js'

// import { template } from './templateMain.js';

export class SmartceiverApp extends LitElement {
  static get properties() {
    return {
      // title: { type: String },
      // page: { type: String },
			bandMHz: { type: String},
			filter: {type: Number},
			wpm: {type: Number},
			mode: {type: String},
			gain: {type: Number},
			agc: {type: String},
			powerState: {type: Boolean},
			band: {type: Number},
			freqDisplay: {type: String},
			pwrbtnDisable: {type: Boolean},
			// connectors: {type: Array},
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
        color: #1a2b42;
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
				color: darkviolet;
				flex-grow: 100;
				height: fit-content;
			}

			.tx {
				color: #dd6b88;
			}

			.band {
				color: slateblue;
				flex-grow: 1;
			}

      ul {
        list-style: none;
				display: flex;
				padding: 10px;
				margin: 0;
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
			}`
	}
	
	static step2scale(step) {
		return step * 200
	}

	#params

  constructor() {
    super()
		// this.page = 'main';
		this.connectors = {}
		this.kredence = {}
		this.remoddle = null
		this.#params = new URLSearchParams(window.location.search)
		this._initTcvr()

		this.powerState = false
		this.pwrbtnDisable = true
    this.operator = ':::'
    this.band = 20
		this.bandMHz = 14
		this.wpm = 30
		this.filter = 2000
		this.agc = 'AGC'
		this.mode = 'MODE'
		this.gain = 0
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
							<button id="pwrbtn" 
								class=${this._pwrbtnClass()} 
								@click=${this.connectPower} 
								?disabled=${this.pwrbtnDisable}>
								PWR
							</button>
							<button id="catbtn"
								class=${this._catbtnClass()} 
								@click=${this.connectCat}
								?disabled=${!this.connectorPwrConnected()}
								?hidden=${this.connectorPwrWithCat()}>
								CAT
							</button>
							<button id="pdlbtn"
								class=${this._pdlbtnClass()} 
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
						<span id="band" name="band" class="freq-display band"
							@click=${this.switchBand}
							?hidden=${!this.powerState}>${this.bandMHz}</span>
						<span id="freq" name="freq" class="freq-display" 
							@click=${this.switchStep}
							?hidden=${!this.powerState}>${this.freqDisplay}</span>
						<input-knob id="freq-knob" name="freq-knob" ?hidden=${!this.powerState}>
							<div class="mark">▲</div>
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
		this.knob = this.shadowRoot.getElementById('freq-knob')
		// this.knob = this.$['freq-knob']
		this.knob.addEventListener('knob-move-change', () => {
			const curValue = Number.parseFloat(this.knob.value) / 10
			if (this.tcvr) 
				this.tcvr.freq = Math.floor(curValue) * 10
		})

		window.onbeforeunload = _ => {
			this.powerState = true
			this.connectPower()
		}
	}

	async _initTcvr() {
		const transceiver = new Transceiver()
		this.transceiver = transceiver

		this.signals = new SignalsBinder('ui', {
			ptt: value => {this.freqDisplay.style = value ? "color: #883333;" : ''},
			keyTx: value => {this.freqDisplay.style = value ? "color: #883333;" : ''},
			wpm: value => {this.wpm = value},
			mode: value => {this.mode = value},
			filter: value => {this.filter = value.filter},
			gain: value => {this.gain = value},
			agc: value => {this.agc = value.agc},
			step: value => {
				this.knob.scale = SmartceiverApp.step2scale(value)
				this._displayFreq(this.knob.value)
			},
			band: value => { 
				this.band = value
				const b = Bands[value]
				this.bandMHz = Math.floor(b.name).toString().padStart(2, '_')
				this.knob.min = b.freqFrom
				this.knob.max = b.freqTo
			},
			freq: value => {
				this.knob.value = value
				this._displayFreq(value)
			},
			pwrsw: value => { 
				this.powerState = value
				this.pwrbtnDisable = false
				// this.pwrbtn.className = value ? 'conbtn on' : 'conbtn'
			},
		})
		this.signals.out.bind(transceiver)

		await this._initConnector()
		if (this.remote && this.remoteController) {
			this.remote.attachTo(transceiver)
		} else {
			this.tcvr = new TcvrController('ui')
			this.tcvr.attachTo(transceiver)
	
			this.tcvr.reversePaddle = this.#params.get('reverse') === '1'
			setInterval(() => this.tcvr.keepAlive(), 5000)
		}
	}
		
	async _initConnector() {
		const token = this.#params.get('token')
		if (token) {
			this.kredence.token = token.trim()
		}
		
		const connectorParams = {tcvr: {}, kredence: this.kredence}
		this._parseTcvrName({value: this.#params.get('tcvr'), connectorParams})

		this.remoddle = this.#params.get('remoddle')

		const remotig = this.#params.get('remotig')
		const usbpowron = this.#params.get('usbpowron')
		const serpowron = this.#params.get('serpowron')
		const sercat = this.#params.get('sercat')
		const remote = this.#params.get('remote')
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

	// eslint-disable-next-line class-methods-use-this
	_parseTcvrName({value, connectorParams}) {
		const p = connectorParams
		const v = value && value.trim().toLowerCase()
		if (v && v.includes('-'))
			[p.tcvr.manufacturer, p.tcvr.model] = v.split('-', 2)
	}

	async _resolveConnector(id, params, type) {
		try {
			const connector = await resolveConnector(id, params)
			console.debug(`Resolved connector params: id=${connector.id} params=${JSON.stringify(params)}`)
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

	#fmt = new Intl.NumberFormat('en-US', {minimumIntegerDigits: 6})
	
	_displayFreq(freq) {
		if (freq === null || !this.tcvr || !Number.isInteger(freq)) {
			this.freqDisplay = this.operator
		}

		const khzHz = (freq - Math.floor(freq / 1000000) * 1000000)
		const frq = this.#fmt.format(khzHz).replace(',', '.')
		const val = `.${frq}`
		const lastDigit = (this.knob && this.knob.scale >= SmartceiverApp.step2scale(100)) ? 2 : 1
		this.freqDisplay = val.substring(0, val.length - lastDigit)
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
			setTimeout(() => this.requestUpdate(), 10000) // FIXME need event (onconnect)
			return
		}

		const pwrWithCat = this.connectorPwrWithCat()
		const connectors = pwrWithCat ? this.connectors : { pwr: this.connectors.pwr }
		if (this.tcvr) {
			await this.tcvr.connect(connectors)
			if (pwrWithCat)
				this.tcvr.poweron()
			if (this.connectors.pwr && this.connectors.pwr.id === 'remotig')
				this.connectRemoddle()
		} else if (this.remote) {
			await this.remote.connect(connectors)
			if (pwrWithCat)
				this.remote.poweron()
		}
		setTimeout(() => this.requestUpdate(), 2000) // FIXME need event (onconnect)
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
			// this.remote.poweron()
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
		// if (this._remoddleCtlr) return
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

  // __navClass(page) {
  //   return classMap({ active: this.page === page });
  // }
}
