import { LitElement, html, css } from 'https://cdn.pika.dev/lit-element/' // 'lit-element'
// import { classMap } from 'lit-html/directives/class-map.js'
import { Transceiver, Bands, } from '../../tcvr.js'
import { SignalsBinder } from '../../utils/signals.mjs'
import { TcvrController } from '../../controller.mjs'

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
			connector: {type: Object},
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
				padding-top: 30px;
				text-align: left;
				color: darkviolet;
				flex-grow: 100;
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
				justify-content: flex-end;
      }

      .controls-card {
				margin: auto;
				display: flex;
				flex-direction: column;
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
        margin: 0.4em;
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

			button#pwrbtn {
				height: 2.5em;
			}
			button#pwrbtn.off {
				background-color: darkred;
				color: white;
			}
			button#pwrbtn:disabled {
				background-color: black;
				color: darkgray;
			}
			button#pwrbtn.on {
				background-color: darkgreen;
				color: white;
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
				margin-top: 4em;
				margin-left: 0;
				display: block;
				border-radius: 100%;
				box-shadow: 0 0.3rem 0.3rem rgba(0, 0, 0, 0.5);
				background: #777;
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

	#params

  constructor() {
    super()
    // this.page = 'main';
		this.kredence = {}
		this.remoddle = null
		this.#params = new URLSearchParams(location.search)
		this._initTcvr()

		this.powerState = false
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
							<button id="pwrbtn" name="pwrbtn" class="off" 
								@click=${this.switchPower} 
								?disabled=${this.connector == null}>
								PWR
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
	
	firstUpdated(changedProperties) {
		this.pwrbtn = this.shadowRoot.getElementById('pwrbtn')
		this.knob = this.shadowRoot.getElementById('freq-knob')
		// this.knob = this.$['freq-knob']
		this.knob.addEventListener('knob-move-change', (evt) => {
			const curValue = Number.parseFloat(this.knob.value) / 10
			this.tcvr && (this.tcvr.freq = Math.floor(curValue) * 10)
		})
	}

	async _initTcvr() {
		const transceiver = new Transceiver()

		this.signals = new SignalsBinder('ui', {
			ptt: value => this.freqDisplay.style = value ? "color: #883333;" : '',
			keyTx: value => this.freqDisplay.style = value ? "color: #883333;" : '',
			wpm: value => this.wpm = value,
			mode: value => this.mode = value,
			filter: value => this.filter = value.filter,
			gain: value => this.gain = value,
			agc: value => this.agc = value,
			step: value => {
				this.knob.scale = value * 400
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
				this.pwrbtn.className = value ? 'on' : 'off'
			},
		})
		this.signals.out.bind(transceiver)

		this.tcvr = new TcvrController('ui')
		this.tcvr.registerTo(transceiver)
		await this._initConnector()
	}
		
	async _initConnector() {
		const token = this.#params.get('token')
		if (token) {
			this.kredence.token = token.trim()
		}
		
		let connectorId
		const connectorParams = {tcvr: {}, kredence: this.kredence}
		const remotig = this.#params.get('remote')
		const powron = this.#params.get('usb')
		const sercat = this.#params.get('serial')
		if (remotig && remotig.includes('@')) {
			connectorId = 'remotig'
			[this.kredence.rig, this.kredence.qth] = 
				remotig.trim().toLowerCase().split('@', 2)
		} else if (powron && powron.includes('-')) {
			connectorId = 'powron'
			this._parseTcvrName(powron, connectorParams)
		} else if (sercat && sercat.includes('-')) {
			connectorId = 'sercat'
			this._parseTcvrName(sercat, connectorParams)
		} else {
			throw new Error('No connector defined!')
		}

		console.debug(`Resolved connector params: id=${connectorId} params=${JSON.stringify(connectorParams)}`)
		this.connector = await (await import('./../../connector.mjs')).get(connectorId, connectorParams)
		await this._fetchStatus()

		this.remoddle = this.#params.get('remoddle')
		this.tcvr.reversePaddle = this.#params.get('reverse') === '1'
	}

	_parseTcvrName(value, connectorParams) {
		const tcvrname = value.trim().toLowerCase().split('-', 2)
		connectorParams.tcvr.manufacturer = tcvrname[0]
		connectorParams.tcvr.model = tcvrname[1]
	}

	async _fetchStatus() {
		if (!this.kredence.rig || !this.connector || this.powerState) return

		this.unackStateQueries++
		const status = await this.connector.checkState(this.kredence)
		if (status && status.id) {
			console.debug('rtt:', status.rtt)
			this.operator = status.op || 'ON'
			this.unackStateQueries = 0
		}
		if (this.unackStateQueries > 2) this.operator = 'OFF'

		this._displayFreq(null) // display op
		return status
	}

	#fmt = new Intl.NumberFormat('en-US', {minimumIntegerDigits: 6})
	_displayFreq(freq) {
		if (freq === null || !this.tcvr || isNaN(freq)) {
			this.freqDisplay = this.operator
		}

		// const mhz = Math.floor(freq / 1000000)
		// let res = '.' + mhz + '.'
		// const khz = (freq - mhz * 1000000) / 1000
		const khz_hz = (freq - Math.floor(freq / 1000000) * 1000000)
		let frq = '.' + this.#fmt.format(khz_hz).replace(',', '.')
		// if (khz < 10) {
		//  res += '0'
		// }
		// if (khz < 100) {
		//  res += '0'
		// }
		// res += khz//.toString().padStart(3, '0')
		// if (khz % 1 === 0) {
		//  res += '.00'
		// } else if (freq % 100 === 0) {
		//  res += '0'
		// }

		const lastDigit = (this.knob && this.knob.scale >= 40000) ? 2 : 1
		this.freqDisplay = frq.substring(0, frq.length - lastDigit)
	}

	async switchPower() {
		await this.tcvr.switchPower(this.connector, this.kredence, this.remoddle)
	}

	decreaseWpm() {
		this.tcvr.wpm = this.wpm - 2;
	}

	increaseWpm() {
		this.tcvr.wpm = this.wpm + 2;
	}

	// decFilter() {
	// 	this.tcvr.filter = this.filter - 200
	// }

	// incFilter() {
	// 	this.tcvr.filter = this.filter + 200
	// }

	switchMode() {
		const i = this.tcvr.modes.indexOf(this.mode)
		this.tcvr.mode = this.tcvr.modes[i < (this.tcvr.modes.length - 1) ? i + 1 : 0]
	}

	switchGain() {
		const i = this.tcvr.gains.indexOf(this.gain)
		this.tcvr.gain = this.tcvr.gains[i > 0 ? i - 1 : this.tcvr.gains.length - 1]
	}
			
	switchBand() {
		const i = this.tcvr.bands.indexOf(this.band)
		this.tcvr.band = this.tcvr.bands[i < (this.tcvr.bands.length - 1) ? i + 1 : 0]
	}

	switchStep() {
		const i = this.tcvr.steps.indexOf(this.knob.scale / 400)
		this.tcvr.step = this.tcvr.steps[i < (this.tcvr.steps.length - 1) ? i + 1 : 0]
	}

	switchFilter() {
		const i = this.tcvr.filters.indexOf(this.filter)
		this.tcvr.filter = this.tcvr.filters[i < (this.tcvr.filters.length - 1) ? i + 1 : 0]
	}

  __navClass(page) {
    return classMap({ active: this.page === page });
  }
}
