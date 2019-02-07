
class RemotigConnector {
  static get id() { return 'remotig-ws'; }
  static get name() { return 'Remotig remote via WebSockets'; }
  static get capabilities() { return [Remoddle.id]; }

  constructor() {
  }

  connect(tcvr, token, rig, successCallback, discCallback) {
    this.tcvr = tcvr
    this.onconnect = successCallback
    this.ondisconnect = discCallback
    const url = `wss://${location.host}/remotig-${rig}/control/${token}`
    console.log('connecting ' + url)
    let ws = new WebSocket(url)
    ws.onopen = (evt) => new RemotigPort(ws,
      port => this.onportopen(port, rig),
      () => this.onportclose())
  }

  onportopen(port, rig) {
    console.log('ok, powering on')
    port.send('poweron')
    // this.audioUrl_ = `wss://${location.hostname}:${audioStreamPort}/remotig-${rig}/audio`
    this.audioUrl_ = rig
    this._playStream()

    setTimeout(() => {
      this._startPowerOnTimer(port, 10000)
      this._bindCommands(this.tcvr, port)
      this.onconnect && this.onconnect(port)
    }, 5000) // delay for tcvr-init after poweron 
  }

  _startPowerOnTimer(port, interval) {
    this._timer = setInterval(() => port.send('poweron'), interval);
  }

  onportclose() {
    clearInterval(this._timer)
    if (this.player_) {
      this.player_.stop()
    }
    window.alert('Transceiver control disconnected!')
    this.ondisconnect && this.ondisconnect()
  }

  _bindCommands(tcvr, port) {
    if (!tcvr || !port) return

    tcvr.bind(EventType.keyDit, RemotigConnector.id, () => port.send("."))
    tcvr.bind(EventType.keyDah, RemotigConnector.id, () => port.send("-"))
    tcvr.bind(EventType.keySpace, RemotigConnector.id, () => port.send("_"))
    tcvr.bind(EventType.mode, RemotigConnector.id, event => port.send("mode=" + event.value.toLowerCase()))
    tcvr.bind(EventType.freq, RemotigConnector.id, event => port.send(`f=${event.value}`))
    tcvr.bind(EventType.wpm, RemotigConnector.id, event => port.send("wpm=" + event.value))
    tcvr.bind(EventType.filter, RemotigConnector.id, event => this.filter(event.value, tcvr.sidetoneFreq, port))
    tcvr.bind(EventType.preamp, RemotigConnector.id, event => port.send("preamp" + (event.value ? "on" : "off")))
    tcvr.bind(EventType.attn, RemotigConnector.id, event => port.send("attn" + (event.value ? "on" : "off")))
    tcvr.bind(EventType.ptt, RemotigConnector.id, event => port.send('ptt' + (event.value ? 'on' : 'off')))
    tcvr.bind(EventType.agc, RemotigConnector.id, event => port.send('agc' + (event.value ? 'on' : 'off')))
    tcvr.bind(EventType.resetAudio, RemotigConnector.id, _ => this.restartAudio())
  }

  _playStream() {
    console.log(`playing RX stream ${this.audioUrl_}`)
    // this.player_ = new LllasPlayer() //new WavPlayer()
    // this.player_.play(this.audioUrl_)
    // // this._player.setFilter('lowpass', _wideFilters[this._mode], 1)
    this.player_ = new PlayerWebRTC()
    this.player_.play(this.audioUrl_)
  }
 
  restartAudio() {
    if (this.player_ && this.audioUrl_) {
      console.log('restarting RX stream')
      // this.player_.stop()
      // this.player_.play(this.audioUrl_)
      this.player_.reset(this.audioUrl_)
    }
  }

  filter(bandWidth, centerFreq, port) {
    if (this.player_) {
      this.player_.setFilter(centerFreq, bandWidth)
    }
    port.send('filter=' + bandWidth)
  }

}

class RemotigPort {
  constructor(ws, onopenCallback, oncloseCallback) {
    this._connected = false
    this._ws = ws
    this.onopen = onopenCallback
    this.onclose = oncloseCallback
    ws.onmessage = (event) => this.received(event.data)
    ws.onclose = () => {
      this._ws = null
      this.disconnect()
    }
    ws.onerror = (err) => console.log(`control error: ${err}`)
  }

  get connected() {
    return this._connected
  }

  disconnect(args = {}) {
    // console.log('control disconnect')
    args.silent || this.send('poweroff')
    
    if (this._ws) {
      this._ws.onclose = undefined
      this._ws.close()
    }
    this._connected = false
    this.onclose && this.onclose()
  }

  send(data) {
    // console.log('ws send:', data)
    '-._'.includes(data) && console.log(`K${data}`)
    if (this._ws) {
      // console.log('ok')
      this._ws.send(data)
    }
  }

  received(msg) {
    console.log(`control msg: ${msg}`)
    if (msg === 'conack') {
      this._connected = true
      this.onopen && this.onopen(this)
    } else if (msg === 'disc' && this._connected) {
      this.disconnect({ silent: true })
    }
  }
}

tcvrConnectors.register(new RemotigConnector());
