const _vfos = ['A', 'B'];
const _bands = ['1.8', '3.5', '7', '10.1', '14', '18', '21', '24', '28'];
const _bandLowEdges = [1800000, 3500000, 7000000, 10100000, 14000000, 18068000, 21000000, 24890000, 28000000];
const _modes = ['LSB', 'USB', 'CW', 'CWR']; // order copies mode code for MDn cmd
const _narrowFilters = ['1800', '1800', '0200', '0200']; // in _modes order
const _wideFilters =   ['2700', '2700', '0700', '0700']; // in _modes order

class Transceiver {
  constructor() {
    this._rxVfo = 0;
    this._txVfo = 0; // TODO split operation
    this._band = 2;
    this._mode = 2;
    this._freq = [];
    _bandLowEdges.forEach(freq => {
      let band = _bandLowEdges.indexOf(freq);
      if (!(band in this._freq)) {
        this._freq[band] = [];
      }
      for (const mode in _modes) {
        if (!(mode in this._freq[band])) {
          this._freq[band][mode] = [];
        }
        for (const vfo in _vfos) {
          this._freq[band][mode][vfo] = freq;
        }
      }
    });
    console.log(`freqs=${this._freq}`);
    this._wpm = 28;
    this._txEnabled = true;
    this._txKeyed = false;
    this._autoSpace = true;
    this._narrow = false;
    this._preamp = false;
    this._attn = false;
    this._d("tcvr-init", "done");
  }

  switchPower() {
    if (this._port) {
      this._port.disconnect();
      this._port = undefined;
      this._d("disconnect", true);
    } else {
      console.log('connect');
      connector.connect((port) => {
        this._port = port;
        // reset tcvr configuration
        this.freq = this._freq[this._band][this._mode][this._rxVfo];
        this.wpm = this._wpm;
        this.txEnabled = this._txEnabled;
        this.autoSpace = this._autoSpace;
        this.txKeyed = this._txKeyed;
        this.narrow = this._narrow;
        this.preamp = this._preamp;
        this.attn = this._attn;
      });
    }
  }

  _connect() {
  }

  get allBands() {
    // return this._freq.keys();
    return _bands;
  }

  get allModes() {
    return _modes;
  }

  get allVfos() {
    return _vfos;
  }

  get band() {
    return this._band;
  }
  set band(band) {
    this._d("band", band);
    if (this._port == undefined || !(band in _bands)) {
      return;
    }
    this._band = band;
    this.freq = this._freq[this._band][this._mode][this._rxVfo]; // call setter
  }

  get mode() {
    return this._mode;
  }
  set mode(value) {
    this._d("mode", value);
    if (this._port == undefined || !(value in _modes)) {
      return;
    }
    this._mode = value;
    this.freq = this._freq[this._band][this._mode][this._rxVfo]; // call setter
    this._port.send("MD" + (this._mode + 1) + ";");
  }

  get freq() {
    return this._freq[this._band][this._mode][this._rxVfo];
  }
  set freq(freq) {
    if (this._port == undefined) {
      return;
    }
    this._freq[this._band][this._mode][this._rxVfo] = freq;
    this._d("freq", freq);

    let data = "F" + _vfos[this._rxVfo]; // TODO split
    data += "000";
    if (freq < 10000000) { // <10MHz
        data += "0";
    }
    data += freq;
    this._port.send(data + ";");
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
    this._port.send("KS0" + wpm + ";");
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
    let data = "FW" + (narrow ? _narrowFilters[this._mode] : _wideFilters[this._mode]);
    this._port.send(data + ";");
  }

  get preamp() {
    return this._preamp;
  }
  set preamp(state) {
    if (this._port == undefined) {
      return;
    }
    this._preamp = state;
    this._d("preamp", this._preamp);
    this._port.send("PA" + (this._preamp ? "1" : "0") + ";");
  }

  get attn() {
    return this._attn;
  }
  set attn(state) {
    if (this._port == undefined) {
      return;
    }
    this._attn = state;
    this._d("attn", this._attn);
    this._port.send("RA0" + (this._attn ? "1" : "0") + ";");
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

    // let data = "KE" + (txEnabled ? "1" : "0");
    // this._port.send(data + ";");
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

    // let data = "KA" + (autoSpace ? "1" : "0");
    // this._port.send(data + ";");
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

    // let data = "KT" + (txKeyed ? "1" : "0");
    // this._port.send(data + ";");
  }

  _d(what, value) {
    console.log(what + "=" + value);
  }
}

    // this._freq = {
    //   "1.8": 
    //     {"CW": {"A": 1820000, "B": 1820000}, "CWR": {"A": 1820000, "B": 1820000}, 
    //      "LSB": {"A": 1880000, "B": 1880000}, "USB": {"A": 1880000, "B": 1880000}},
    //   "3.5":
    //     {"CW": {"A": 3520000, "B": 3520000}, "CWR": {"A": 3520000, "B": 3520000}, 
    //      "LSB": {"A": 3750000, "B": 3750000}, "USB": {"A": 3750000, "B": 3750000}},
    //   "7":
    //     {"CW": {"A": 7020000, "B": 7020000}, "CWR": {"A": 7020000, "B": 7020000}, 
    //      "LSB": {"A": 7080000, "B": 7080000}, "USB": {"A": 7080000, "B": 7080000}},
    //   "10.1":
    //     {"CW": {"A": 10120000, "B": 10120000}, "CWR": {"A": 10120000, "B": 10120000}, 
    //      "LSB": {"A": 10120000, "B": 10120000}, "USB": {"A": 10120000, "B": 10120000}},
    //   "14":
    //     {"CW": {"A": 14020000, "B": 14020000}, "CWR": {"A": 14020000, "B": 14020000}, 
    //      "LSB": {"A": 14100000, "B": 14100000}, "USB": {"A": 14100000, "B": 14100000}},
    //   "18":
    //     {"CW": {"A": 18080000, "B": 18080000}, "CWR": {"A": 18080000, "B": 18080000}, 
    //      "LSB": {"A": 18100000, "B": 18100000}, "USB": {"A": 18100000, "B": 18100000}},
    //   "21":
    //     {"CW": {"A": 21020000, "B": 21020000}, "CWR": {"A": 21020000, "B": 21020000}, 
    //      "LSB": {"A": 21100000, "B": 21100000}, "USB": {"A": 21100000, "B": 21100000}},
    //   "24":
    //     {"CW": {"A": 24920000, "B": 24920000}, "CWR": {"A": 24920000, "B": 24920000}, 
    //      "LSB": {"A": 24920000, "B": 24920000}, "USB": {"A": 24920000, "B": 24920000}},
    //   "28":
    //     {"CW": {"A": 28020000, "B": 28020000}, "CWR": {"A": 28020000, "B": 28020000}, 
    //      "LSB": {"A": 28100000, "B": 28100000}, "USB": {"A": 28100000, "B": 28100000}}
    // };