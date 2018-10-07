
class RemotigConnector {
  static get id() { return 'remotig'; }
  static get name() { return 'Remotig remote via WebSockets'; }
  static get capabilities() { return [Remoddle.id]; }

  constructor() {
  }

  connect(tcvr, successCallback, token) {
    let url = "ws://" + window.location.hostname + ":8088/control/" + token
    console.log('connecting ' + url)
    let ws = new WebSocket(url)
    ws.onopen = (evt) => {
      // this.ws = ws;
      const port = new RemotigPort(ws)
      console.log('ok, powering on')
      port.send('poweron')
      port.send('keyeren')
      port._playStream('/stream/' + token)
      
      setTimeout(() => {
        port._startPowerOnTimer(10000)
        this._bindCommands(tcvr, port)
        successCallback(port);
      }, 5000) // delay for tcvr-init after poweron 
    }
  }

  _bindCommands(tcvr, port) {
    tcvr.bind(EventType.keyDit, this.constructor.id, event => port.send("."))
    tcvr.bind(EventType.keyDah, this.constructor.id, event => port.send("-"))
    tcvr.bind(EventType.mode, this.constructor.id, event => port.send("mode=" + (event.value + 1)))
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
    tcvr.bind(EventType.filter, this.constructor.id, event => port.filter(event.value, tcvr.sidetoneFreq))
    tcvr.bind(EventType.preamp, this.constructor.id, event => port.send("preamp" + (event.value ? "on" : "off")))
    tcvr.bind(EventType.attn, this.constructor.id, event => port.send("attn" + (event.value ? "on" : "off")))
  }
}

class RemotigPort {
  constructor(ws) {
    this._ws = ws
  }

  _playStream(url) {
    console.log(`playing RX stream ${url}`)
    this._player = new WavPlayer()
    this._player.play(url)
    // this._player.setFilter('lowpass', _wideFilters[this._mode], 1)
  }

  _startPowerOnTimer(interval) {
    this._timer = setInterval(() => this.send('poweron'), interval);
  }

  filter(bandWidth, centerFreq) {
    if (this._player) {
      this._player.setFilter(centerFreq, bandWidth)
    }
    // port.send((bandWidth < 1000 ? "FW0" : "FW") + bandWidth + ";")
  }

  disconnect() {
    clearInterval(this._timer)
    this.send('poweroff')
    if (this._ws) {
      this._ws.close()
    }
    if (this._player) {
      this._player.stop()
    }
  }

  send(data) {
    // console.log('ws send:', data)
    if (this._ws) {
      // console.log('ok')
      this._ws.send(data)
    }
  }
}

tcvrConnectors.register(new RemotigConnector());
