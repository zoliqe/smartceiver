
class RemotigConnector {
  static get id() { return 'remotig'; }
  static get name() { return 'Remotig remote via WebSockets'; }
  static get capabilities() { return [Remoddle.id]; }

  constructor() {
  }

  connect(tcvr, token, successCallback, discCallback) {
    this.tcvr = tcvr
    this.onconnect = successCallback
    this.ondisconnect = discCallback
    let url = "ws://" + window.location.hostname + ":8088/control/" + token
    console.log('connecting ' + url)
    let ws = new WebSocket(url)
    ws.onopen = (evt) => new RemotigPort(ws,
      port => this.onportopen(port, token),
      () => this.onportclose())
  }

  onportopen(port, token) {
    console.log('ok, powering on')
    port.send('poweron')
    port.send('keyeron')
    this._playStream('/stream/' + token)

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
    if (this._player) {
      this._player.stop()
    }
    window.alert('Transceiver control disconnected!')
    this.ondisconnect && this.ondisconnect()
  }

  _bindCommands(tcvr, port) {
    if (!tcvr || !port) return

    tcvr.bind(EventType.keyDit, this.constructor.id, () => port.send("."))
    tcvr.bind(EventType.keyDah, this.constructor.id, () => port.send("-"))
    tcvr.bind(EventType.mode, this.constructor.id, event => port.send("mode=" + event.value.toLowerCase()))
    tcvr.bind(EventType.freq, this.constructor.id, event => {
      //let freq = event.value
      //let data = "FA" // + _vfos[this._rxVfo]; // TODO split
      //data += "000"
      //if (freq < 10000000) { // <10MHz
        //  data += "0"
      //}
      //data += freq
      port.send(`f=${event.value}`)
    })
    tcvr.bind(EventType.wpm, this.constructor.id, event => port.send("wpm=" + event.value))
    tcvr.bind(EventType.filter, this.constructor.id, event => this.filter(event.value, tcvr.sidetoneFreq))
    tcvr.bind(EventType.preamp, this.constructor.id, event => port.send("preamp" + (event.value ? "on" : "off")))
    tcvr.bind(EventType.attn, this.constructor.id, event => port.send("attn" + (event.value ? "on" : "off")))
    tcvr.bind(EventType.ptt, this.constructor.id, event => port.send('ptt' + (event.value ? 'on' : 'off')))
    tcvr.bind(EventType.agc, this.constructor.id, event => port.send('agc' + (event.value ? 'on' : 'off')))
  }

  _playStream(url) {
    console.log(`playing RX stream ${url}`)
    this._player = new WavPlayer()
    this._player.play(url)
    // this._player.setFilter('lowpass', _wideFilters[this._mode], 1)
  }

  filter(bandWidth, centerFreq) {
    if (this._player) {
      this._player.setFilter(centerFreq, bandWidth)
    }
    // port.send((bandWidth < 1000 ? "FW0" : "FW") + bandWidth + ";")
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
