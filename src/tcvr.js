class Transceiver {
  constructor() {
    this._band = "40m";
    this._freq = {"80m": 3542000, "40m": 7030000, "30m": 10123000, "20m": 14060000, "17m": 18088000, "15m": 21060000};
    this._wpm = 28;
    this._txEnabled = true;
    this._txKeyed = false;
    this._autoSpace = true;
    this._narrow = false;
    this._d("tcvr-init", "done");
  }

  switchPower() {
    if (this._port) {
      this._port.disconnect();
      this._port = undefined;
    } else {
      console.log('connect');
      webusb.requestPort().then(selectedPort => {
        this._port = selectedPort;
        this._connect();
      }).catch(error => {
        console.error('Connection error (1): ' + error);
      });
    }
  }

  _connect() {
    console.log('Connecting to ' + this._port.device_.productName);
    this._port.connect().then(() => {
      console.log('Connected ' + this._port);
      this._port.onReceive = data => {
        console.log('Received: ' + data);
      };
      this._port.onReceiveError = error => {
        console.log('Receive error: ' + error);
      };
      this.freq = this._freq;
      this.wpm = this._wpm;
      this.txEnabled = this._txEnabled;
      this.autoSpace = this._autoSpace;
      this.txKeyed = this._txKeyed;
      this.narrow = this._narrow;
    }, error => {
       console.log('Connection error (2): ' + error);
    });
  }

  get band() {
    return this._band;
  }
  set band(band) {
    this._band = band;
    this.freq = this._freq[band];
    this._d("band", band);
  }

  get freq() {
    return this._freq[this._band];
  }
  set freq(freq) {
    if (this._port == undefined) {
      return;
    }
    this._freq[this._band] = freq;
    this._d("freq", freq);

    let data = "FA000";
    if (freq < 10000000) { // <10MHz
        data += "0";
    }
    data += freq + ";";
    this._port.send(data);
  }

  get wpm() {
    return this._wpm;
  }
  set wpm(wpm) {
    if (this._port == undefined) {
      return;
    }
    this._wpm = wpm;
    this._d("wpm", wpm);

    let data = "KS" + wpm + ";";
    this._port.send(data);
  }

  get narrow() {
    return this._narrow;
  }
  set narrow(narrow) {
    if (this._port == undefined) {
      return;
    }
    this._narrow = narrow;
    this._d("narrow", narrow);

    let data = "RW" + (narrow ? "1" : "0") + ";";
    this._port.send(data);
  }

  get txEnabled() {
    return this._txEnabled;
  }
  set txEnabled(txEnabled) {
    if (this._port == undefined) {
      return;
    }
    this._txEnabled = txEnabled;
    this._d("txEnabled", txEnabled);

    let data = "KE" + (txEnabled ? "1" : "0") + ";";
    this._port.send(data);
  }

  get autoSpace() {
    return this._autoSpace;
  }
  set autoSpace(autoSpace) {
    if (this._port == undefined) {
      return;
    }
    this._autoSpace = autoSpace;
    this._d("autoSpace", autoSpace);

    let data = "KA" + (autoSpace ? "1" : "0") + ";";
    this._port.send(data);
  }

  get txKeyed() {
    return this._txKeyed;
  }
  set txKeyed(txKeyed) {
    if (this._port == undefined) {
      return;
    }
    this._txKeyed = txKeyed;
    this._d("txKeyed", txKeyed);

    let data = "KT" + (txKeyed ? "1" : "0") + ";";
    this._port.send(data);
  }

  _d(what, value) {
    console.log(what + "=" + value);
  }
}

