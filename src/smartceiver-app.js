/**
@license
Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
/* <link rel="import" href="setuprx-view.html"> */
/* <link rel="import" href="setuptx-view.html"> */
/* <link rel="import" href="cwmem-view.html"> */
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import { Element } from '@polymer/polymer/polymer-element.js';

import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/iron-selector/iron-selector.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import './main-view.js';
import './error404-view.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="smartceiver-app">
  <template>
    <style>
      :host {
        --app-primary-color: #8f8f8f;
        --app-secondary-color: #95c029;

        display: block;
      }

      app-drawer-layout:not([narrow]) [drawer-toggle] {
        display: none;
      }

      app-header {
        color: #95c029;
        background-color: #888888;
        border-radius: 10px;
        /*var(--app-primary-color);*/
        /*max-height: 20px;*/
      }

      app-header paper-icon-button {
        --paper-icon-button-ink-color: #95c029;
      }

      app-header div.freq-display {
        /*text-align: right;*/
        display: block;
        font-size: 36pt;
        font-weight: bold;
        font-family: Courier New, Courier, monospace;
        /*color: lightgreen;*/
        /*padding-right: 20px;*/
        padding-left: 20px;
        text-align: left;
      }

      app-header div.freq-display div.tx {
        color: #dd6b88;
      }

      .drawer-list {
        margin: 0 20px;
      }

      .drawer-list a {
        display: block;
        padding: 0 16px;
        text-decoration: none;
        color: var(--app-secondary-color);
        line-height: 40px;
      }

      .drawer-list a.iron-selected {
        color: black;
        font-weight: bold;
      }

      .remotig {
        position: absolute;
        top: 350px;
      }
      #remoteVideos video {
        height: 0px;
      }
      #localVideo {
        height: 0px;
      }
    </style>

    <app-location route="{{route}}"></app-location>
    <!-- pattern="/smartceiver/:page" -->
    <app-route route="{{route}}" pattern="/smartceiver/:page" data="{{routeData}}" tail="{{subroute}}"></app-route>

    <app-drawer-layout fullbleed="" responsive-width="1024px">
      <!-- Drawer content -->
      <!-- <app-drawer id="drawer" slot="drawer" swipe-open>
        <app-toolbar>Menu</app-toolbar>
        <iron-selector selected="[[page]]" attr-for-selected="name" class="drawer-list" role="navigation">
          <a name="tune" href="/smartceiver/tune">Control</a>
          <a name="setup-rx" href="/setup-rx">Setup RX</a>
          <a name="settings" href="/smartceiver/settings">Settings</a>
          <a name="cwmem" href="/smartceiver/cwmem">CW Memories</a>
        </iron-selector>
      </app-drawer> -->

      <!-- Main content -->
      <app-header-layout has-scrolling-region="">

        <app-header slot="header" fixed="" effects="waterfall">
          <app-toolbar>
            <!-- <paper-icon-button icon="menu" drawer-toggle></paper-icon-button> -->
            <div main-title="" id="freq" name="freq" class="freq-display">
              [[freqDisplay]]
            </div>
            <div>v15</div>
            <!-- <paper-icon-button icon="gavel" on-tap="connectRemoddle"></paper-icon-button> -->
            <paper-icon-button icon="power-settings-new" on-tap="switchPower"></paper-icon-button>
          </app-toolbar>
        </app-header>

        <iron-pages selected="[[page]]" attr-for-selected="name" fallback-selection="error404" role="main">
          <main-view id="tune" name="tune" bands="[[tcvr.allBands]]" modes="[[tcvr.allModes]]" band="{{tcvr.band}}" mode="{{tcvr.mode}}" freq="{{tcvr.freq}}" narrow="{{tcvr.narrow}}" wpm="{{tcvr.wpm}}" preamp="{{tcvr.preamp}}" attn="{{tcvr.attn}}" ptt="{{tcvr.ptt}}" agc="{{tcvr.agc}}" power="[[tcvr.powerSwState]]">
          </main-view>
          <!--<setuprx-view name="setup-rx"></setuprx-view>-->
          <!-- <setuptx-view name="settings" tx-enabled="{{tcvr.txEnabled}}" tx-keyed="{{tcvr.txKeyed}}" auto-space="{{tcvr.autoSpace}}" sidetone="{{tcvr.sidetone}}"></setuptx-view> -->
          <!-- <cwmem-view name="cwmem"></cwmem-view> -->
          <error404-view name="error404"></error404-view>
        </iron-pages>
      </app-header-layout>
    </app-drawer-layout>
    <div class="remotig">
      <video id="localStream"></video>
      <div id="remoteStream"></div>
    </div>
  </template>

  
  
  
  <!-- <script defer src="https://simplewebrtc.com/latest-v2.js">&lt;/script> -->
  <!-- <script defer src="k2-webrtc.js">&lt;/script> -->
  
  
  

  
</dom-module>`;

document.head.appendChild($_documentContainer.content);
const selectedConnector = 'remotig'
const _vfos = ['A', 'B']
const _bands = ['1.8', '3.5', '7', '10.1', '14', '18', '21', '24', '28']
const _bandLowEdges = [1800000, 3500000, 7000000, 10100000, 14000000, 18068000, 21000000, 24890000, 28000000]
const _modes = ['LSB', 'USB', 'CW', /*'CWR'*/] // order copies mode code for MDn cmd
const _narrowFilters = [1800, 1800, 100, 100] // in _modes order
const _wideFilters =   [2700, 2700, 1000, 1000] // in _modes order
// const _narrowFilters = ['1800', '1800', '0200', '0200']; // in _modes order
// const _wideFilters =   ['2700', '2700', '0600', '0600']; // in _modes order
const _sidetoneFreq = 650
const _sidetoneLevel = 0.2

class Transceiver {
  constructor() {
    this._rxVfo = 0
    this._txVfo = 0 // TODO split operation
    this._band = 2
    this._mode = 2
    this._freq = []
    _bandLowEdges.forEach(freq => {
      let band = _bandLowEdges.indexOf(freq)
      if (!(band in this._freq)) {
        this._freq[band] = []
      }
      for (const mode in _modes) {
        if (!(mode in this._freq[band])) {
          this._freq[band][mode] = []
        }
        for (const vfo in _vfos) {
          this._freq[band][mode][vfo] = freq
        }
      }
    })
    console.log(`freqs=${this._freq}`)
    this._wpm = 28
    this._narrow = false
    this._preamp = false
    this._attn = false
    this._ptt = false
    this._agc = true
    // this._txEnabled = true
    // this._txKeyed = false
    // this._autoSpace = true
    // this._buildBFO();

    this._connectorId = typeof selectedConnector === 'undefined' ? SmartceiverWebUSBConnector.id : selectedConnector
    console.log('used connector: ' + this._connectorId)
    
    this._listeners = {}
    // this.bind(EventType.keyDit, 'tcvr', event => this._tone(1))
    // this.bind(EventType.keyDah, 'tcvr', event => this._tone(3))
    this._d("tcvr-init", "done")
  }

  switchPower(token, state) {
    if ( /*! state &&*/ this._port) {
      this._d(`disconnect ${this._port}`, true)
      this._port.disconnect()
      this.unbind(this._connectorId)
      this._port = null
      this.disconnectRemoddle()
      this.fire(new TcvrEvent(EventType.pwrsw, this.powerSwState))
    } else /*if (state)*/ {
      this._d('connect')
      let connector = tcvrConnectors.get(this._connectorId)
      if (token && token.startsWith('om4aa')) {
        this.connectRemoddle(connector) //TODO fix on unsupported platforms
      }
      connector.connect(this, token, (port) => {
        this._port = port
        // reset tcvr configuration
        this.freq = this._freq[this._band][this._mode][this._rxVfo]
        this.mode = this._mode
        this.ptt = this._ptt
        this.wpm = this._wpm
        this.narrow = this._narrow
        // this.txEnabled = this._txEnabled
        // this.autoSpace = this._autoSpace
        // this.txKeyed = this._txKeyed
        this.preamp = this._preamp
        this.attn = this._attn
        this.agc = this._agc
        this.fire(new TcvrEvent(EventType.pwrsw, this.powerSwState))
      })
    }
  }

  get powerSwState() {
    return this._port != null
  }

  connectRemoddle(connector) {
    // if ( ! connector.constructor.capabilities.includes(Remoddle.id)) {
    //   return
    // }
    this.disconnectRemoddle() // remove previous instance

    new Remoddle(this).connect(remoddle => {
      this._remoddle = remoddle;
      remoddle.wpm = this.wpm; // sync with current wpm state
    });
  }

  disconnectRemoddle() {
    if (this._remoddle) {
      this.unbind(this._remoddle.constructor.id)
      this._remoddle.disconnect();
      this._remoddle = undefined;
    }
  }

  // functionality disabled due long delays between paddle hit and hearing tone 
  //
  // _tone(len) {
  //   if (this._bfoAmp) {
  //     this._bfoAmp.gain.setValueAtTime(_sidetoneLevel, 0); // TODO configurable
  //     setTimeout(() => {
  //       this._bfoAmp.gain.setValueAtTime(0, 0);
  //     }, len * (1200 / this._wpm + 5));
  //   }
  // }

  // _buildBFO() {
  //   let audioCtx = new AudioContext();
  //   this._bfo = audioCtx.createOscillator();
  //   this._bfoAmp = audioCtx.createGain();

  //   this._bfo.frequency.setValueAtTime(_sidetoneFreq, 0); // TODO configurable
  //   this._bfoAmp.gain.setValueAtTime(0, 0);

  //   this._bfo.connect(this._bfoAmp);
  //   this._bfoAmp.connect(audioCtx.destination);

  //   this._bfo.start();
  // }

  whenConnected(proceed) {
    if (this._port && this._port.connected !== false) { // connected may be also undefined
      proceed()
    }
  }

  get allBands() {
    // return this._freq.keys();
    return _bands
  }

  get allModes() {
    return _modes
  }

  get allVfos() {
    return _vfos
  }

  get band() {
    return this._band
  }
  set band(band) {
    this.whenConnected(() => {
      this._d("band", band)
      if (band in _bands) {
        this._band = band
        this.freq = this._freq[this._band][this._mode][this._rxVfo] // call setter
        // reset state - some tcvrs may store state on per band basis
        this.preamp = this._preamp
        this.attn = this._attn
        this.agc = this._agc
      }
    })
  }

  get mode() {
    return this._mode
  }
  set mode(value) {
    this.whenConnected(() => {
      this._d("mode", value)
      if (value in _modes) {
        this._mode = value
        this.freq = this._freq[this._band][this._mode][this._rxVfo] // call setter
        // this._port.send("MD" + (this._mode + 1) + ";");
        this.fire(new TcvrEvent(EventType.mode, _modes[this._mode]))
      }
    });
  }

  get freq() {
    return this._freq[this._band][this._mode][this._rxVfo]
  }
  set freq(freq) {
    this.whenConnected(() => {
      this._freq[this._band][this._mode][this._rxVfo] = freq
      this._d("freq", freq)
      this.fire(new TcvrEvent(EventType.freq, freq))
    });
  }

  get wpm() {
    return this._wpm
  }
  set wpm(wpm) {
    this.whenConnected(() => {
      this._wpm = wpm
      this._d("wpm", wpm)
      this.fire(new TcvrEvent(EventType.wpm, wpm))
    })
  }

  get narrow() {
    return this._narrow
  }
  set narrow(narrow) {
    this.whenConnected(() => {
      this._narrow = narrow
      this._d("narrow", narrow)
      let bandwidth = narrow ? _narrowFilters[this._mode] : _wideFilters[this._mode]
      this.fire(new TcvrEvent(EventType.filter, bandwidth))
    })
  }

  get preamp() {
    return this._preamp
  }
  set preamp(state) {
    this.whenConnected(() => {
      this._preamp = state
      this._d("preamp", this._preamp)
      this.fire(new TcvrEvent(EventType.preamp, this._preamp))
    })
  }

  get attn() {
    return this._attn
  }
  set attn(state) {
    this.whenConnected(() => {
      this._attn = state
      this._d("attn", this._attn)
      this.fire(new TcvrEvent(EventType.attn, this._attn))
    });
  }

  get ptt() {
    return this._ptt
  }
  set ptt(state) {
    this.whenConnected(() => {
      this._ptt = state
      this._d("ptt", this._ptt)
      this.fire(new TcvrEvent(EventType.ptt, this._ptt))
    });
  }

  get agc() {
    return this._agc
  }
  set agc(state) {
    this.whenConnected(() => {
      this._agc = state
      this._d('agc', this._agc)
      this.fire(new TcvrEvent(EventType.agc, this._agc))
    })
  }

  // get txEnabled() {
  //   return this._txEnabled;
  // }
  // set txEnabled(txEnabled) {
  //   this.whenConnected(() => {
  //     this._txEnabled = txEnabled;
  //     this._d("txEnabled", txEnabled);
  //     // let data = "KE" + (txEnabled ? "1" : "0");
  //     // this._port.send(data + ";");
  //   });
  // }

  // get autoSpace() {
  //   return this._autoSpace;
  // }
  // set autoSpace(autoSpace) {
  //   this.whenConnected(() => {
  //     this._autoSpace = autoSpace;
  //     this._d("autoSpace", autoSpace);
  //     // let data = "KA" + (autoSpace ? "1" : "0");
  //     // this._port.send(data + ";");
  //   });
  // }

  // get txKeyed() {
  //   return this._txKeyed;
  // }
  // set txKeyed(txKeyed) {
  //   this.whenConnected(() => {
  //     this._txKeyed = txKeyed;
  //     this._d("txKeyed", txKeyed);
  //     // let data = "KT" + (txKeyed ? "1" : "0");
  //     // this._port.send(data + ";");
  //   });
  // }

  // get sidetone() {
  //   return this._bfoAmp !== undefined;
  // }
  // set sidetone(state) {
  //   if (state) {
  //     if ( ! this.sidetone) {
  //       this._buildBFO();
  //     }
  //   } else {
  //     this._bfoAmp = undefined;
  //     this._bfo.stop();
  //   }
  // }

  get sidetoneFreq() {
    return _sidetoneFreq
  }

  bind(type, owner, callback) {
    if (!(type in this._listeners)) {
      this._listeners[type] = []
    }
    this._listeners[type].push(new EventListener(owner, callback))
    this._d(`bind: ${type} for ${owner}, callbacks`, this._listeners[type].length)
  }

  unbind(owner) {
    for (let type in this._listeners) {
      let stack = this._listeners[type]
      for (let i = 0, l = stack.length; i < l; i++) {
        if (stack[i].owner == owner) {
          this._d(`unbind ${type} for ${owner}`)
          stack.splice(i, 1)
        }
      }
    }
  }

  fire(event) {
    let stack = this._listeners[event.type]
    stack && stack.forEach(listenner => listenner.callback.call(this, event))
    return true //!event.defaultPrevented;
  }

  _d(what, value) {
    console.log(what + "=" + value);
  }
}

class TcvrEvent {
  constructor(type, value) {
    this._type = type
    this._value = value
  }
  get type() { return this._type }
  get value() { return this._value }
}

class EventListener {
  constructor(owner, callback) {
    this._owner = owner
    this._callback = callback
  }
  get owner() { return this._owner }
  get callback() { return this._callback }
}

const EventType = Object.freeze({
  freq: 1, wpm: 2, mode: 3, vfo: 4, filter: 5, preamp: 6, attn: 7, keyDit: 8, keyDah: 9, ptt: 10,
  agc: 11, pwrsw: 12,
})

class ConnectorRegister {
  constructor() { this._reg = {} }

  register(connector) { this._reg[connector.constructor.id] = connector }
  get(id) { return this._reg[id] }

  get all() { return Object.values(this._reg) }
}

var tcvrConnectors = new ConnectorRegister();
class Remoddle {
  constructor(tcvr) {
    this._port = undefined;
    this._tcvr = tcvr;
  }

  static get id() { return 'remoddle'; }

  connect(successCallback) {
    this.requestPort().then(selectedPort => {
      console.log('Connecting to ' + selectedPort._device.productName);
      selectedPort.connect().then(() => {
        console.log('Connected ' + JSON.stringify(selectedPort))
        selectedPort.onReceive = data => this._evaluate(data)
        selectedPort.onReceiveError = error => console.log('Receive error: ' + error)
        this._port = selectedPort;
        if (this._port && this._tcvr) {
          this._tcvr.bind(EventType.wpm, this.constructor.id, event => this._port.send("S" + event.value + "\r\n"))
          successCallback(this);
        }
      }, error => {
         console.log('Connection error (2): ' + error);
      });
    }).catch(error => {
      console.error('Connection error (1): ' + error);
    });
  }

  disconnect() {
    if (this._port) {
      this._port.disconnect();
    }
    this._port = undefined;
  }

  requestPort() {
    const filters = [
      { 'vendorId': 0x2341, 'productId': 0x8036 },
      { 'vendorId': 0x2341, 'productId': 0x8037 },
    ];
    if (navigator.usb == null) return Promise.reject(new Error('WebUSB not supported!'))

    return navigator.usb
      .requestDevice({ 'filters': filters })
      .then(device => new RemoddlePort(device));
  }

  // get ports() {
  //   return navigator.usb
  //     .getDevices()
  //     .then(devices => { return devices.map(device => new RemoddlePort(device)) })
  // }

  // set wpm(value) {
  //   if (this._port) {
  //     this._port.send('KS0' + value + ';');
  //   }
  // }

  _evaluate(data) {
    if ( ! this._tcvr) {
      return
    }
    for (let i = 0; i < data.length; i++) {
      let element = data[i];
      if (element == '-') {
        // console.log('remoddle: -');
        this._tcvr.fire(new TcvrEvent(EventType.keyDah, 1));    
      } else if (element == '.') {
        // console.log('remoddle: .');
        this._tcvr.fire(new TcvrEvent(EventType.keyDit, 1));    
      }
    }
  }

}

class RemoddlePort {
  constructor(device) {
    this._device = device;
    this._encoder = new TextEncoder();
    this._decoder = new TextDecoder();
  }

  connect() {
    let readLoop = () => {
      this._device.transferIn(5, 64).then(result => {
        this.onReceive(this._decoder.decode(result.data));
        readLoop();
      }, error => {
        this.onReceiveError(error);
      });
    };

    return this._device.open()
      .then(() => {
        if (this._device.configuration === null) {
          return this._device.selectConfiguration(1);
        }
      })
      .then(() => this._device.claimInterface(2))
      .then(() => this._device.controlTransferOut({
        'requestType': 'class',
        'recipient': 'interface',
        'request': 0x22,
        'value': 0x01,
        'index': 0x02
      }))
      .then(() => {
        readLoop();
      });
  }

  disconnect() {
    return this._device.controlTransferOut({
      'requestType': 'class',
      'recipient': 'interface',
      'request': 0x22,
      'value': 0x00,
      'index': 0x02
    })
      .then(() => this._device.close());
  }

  send(data) {
    return this._device.transferOut(4, this._encoder.encode(data));
  }
}

// var connector = {};

// (function() {
//   'use strict';

//   connector.encoder_ = new TextEncoder();
//   connector.decoder_ = new TextDecoder();

//   connector.connect = function(successCallback) {
//     connector.requestPort().then(selectedPort => {
//       console.log('Connecting to ' + selectedPort.device_.productName);
//       selectedPort.connect().then(() => {
//         console.log('Connected ' + selectedPort);
//         selectedPort.onReceive = data => {
//           console.log('Received: ' + data);
//         };
//         selectedPort.onReceiveError = error => {
//           console.log('Receive error: ' + error);
//         };
//         successCallback(selectedPort);
//       }, error => {
//          console.log('Connection error (2): ' + error);
//       });
//     }).catch(error => {
//       console.error('Connection error (1): ' + error);
//     });
//   }

//   connector.getPorts = function() {
//     return navigator.usb.getDevices().then(devices => {
//       return devices.map(device => new connector.Port(device));
//     });
//   };

//   connector.requestPort = function() {
//     const filters = [
//       { 'vendorId': 0x2341, 'productId': 0x8036 },
//       { 'vendorId': 0x2341, 'productId': 0x8037 },
//     ];
//     return navigator.usb.requestDevice({ 'filters': filters }).then(
//       device => new connector.Port(device)
//     );
//   }

//   connector.Port = function(device) {
//     this.device_ = device;
//   };

//   connector.Port.prototype.connect = function() {
//     let readLoop = () => {
//       this.device_.transferIn(5, 64).then(result => {
//         this.onReceive(connector.decoder_.decode(result.data));
//         readLoop();
//       }, error => {
//         this.onReceiveError(error);
//       });
//     };

//     return this.device_.open()
//         .then(() => {
//           if (this.device_.configuration === null) {
//             return this.device_.selectConfiguration(1);
//           }
//         })
//         .then(() => this.device_.claimInterface(2))
//         .then(() => this.device_.controlTransferOut({
//             'requestType': 'class',
//             'recipient': 'interface',
//             'request': 0x22,
//             'value': 0x01,
//             'index': 0x02}))
//         .then(() => {
//           readLoop();
//         });
//   };

//   connector.Port.prototype.disconnect = function() {
//     return this.device_.controlTransferOut({
//             'requestType': 'class',
//             'recipient': 'interface',
//             'request': 0x22,
//             'value': 0x00,
//             'index': 0x02})
//         .then(() => this.device_.close());
//   };

//   connector.Port.prototype.send = function(data) {
//     return this.device_.transferOut(4, connector.encoder_.encode(data));
//   };
// })();

/* <script defer src="https://simplewebrtc.com/latest-v2.js"></script> */
/* <script defer src="k2-webrtc.js"></script> */
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
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
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WavPlayer = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw (f.code="MODULE_NOT_FOUND", f)}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _wavify = require('./wavify');

var _wavify2 = _interopRequireDefault(_wavify);

var _concat = require('./concat');

var _concat2 = _interopRequireDefault(_concat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pad = function pad(buffer) {
    var currentSample = new Float32Array(1);

    buffer.copyFromChannel(currentSample, 0, 0);

    var wasPositive = currentSample[0] > 0;

    for (var i = 0; i < buffer.length; i += 1) {
        buffer.copyFromChannel(currentSample, 0, i);

        if (wasPositive && currentSample[0] < 0 || !wasPositive && currentSample[0] > 0) {
            break;
        }

        currentSample[0] = 0;
        buffer.copyToChannel(currentSample, 0, i);
    }

    buffer.copyFromChannel(currentSample, 0, buffer.length - 1);

    wasPositive = currentSample[0] > 0;

    for (var _i = buffer.length - 1; _i > 0; _i -= 1) {
        buffer.copyFromChannel(currentSample, 0, _i);

        if (wasPositive && currentSample[0] < 0 || !wasPositive && currentSample[0] > 0) {
            break;
        }

        currentSample[0] = 0;
        buffer.copyToChannel(currentSample, 0, _i);
    }

    return buffer;
};

var WavPlayer = function WavPlayer() {
    var context = void 0;
    let lpf = undefined;
    let hpf = undefined;
    let bpf = undefined;

    var hasCanceled_ = false;

    var _play = function _play(url) {

        var nextTime = 0;

        var audioStack = [];

        hasCanceled_ = false;

        context = new AudioContext();
        lpf = context.createBiquadFilter()
        lpf.type = 'lowpass'
        lpf.frequency.value = 800
        hpf = context.createBiquadFilter()
        hpf.type = 'highpass'
        hpf.frequency.value = 400
        bpf = context.createBiquadFilter()
        bpf.type = 'bandpass'
        bpf.frequency.value = 600

        var scheduleBuffersTimeoutId = null;

        var scheduleBuffers = function scheduleBuffers() {
            if (hasCanceled_) {
                scheduleBuffersTimeoutId = null;

                return;
            }

            while (audioStack.length > 0 && audioStack[0].buffer !== undefined && nextTime < context.currentTime + 2) {
                var currentTime = context.currentTime;

                var source = context.createBufferSource();

                var segment = audioStack.shift();

                source.buffer = pad(segment.buffer);
                source.connect(lpf)
                lpf.connect(hpf)
                hpf.connect(bpf)
                bpf.connect(context.destination);

                if (nextTime == 0) {
                    nextTime = currentTime + 0.5; /// add 700ms latency to work well across systems - tune this if you like
                }

                var duration = source.buffer.duration;
                var offset = 0;

                if (currentTime > nextTime) {
                    offset = currentTime - nextTime;
                    nextTime = currentTime;
                    duration = duration - offset;
                }

                source.start(nextTime, offset);
                source.stop(nextTime + duration);

                nextTime += duration; // Make the next buffer wait the length of the last buffer before being played
            }

            scheduleBuffersTimeoutId = setTimeout(function () {
                return scheduleBuffers();
            }, 500);
        };

        return fetch(url).then(function (response) {

            var reader = response.body.getReader();

            // This variable holds a possibly dangling byte.
            var rest = null;

            var isFirstBuffer = true;
            var numberOfChannels = 1,
                sampleRate = 8000;

            var read = function read() {
                return reader.read().then(function (_ref) {
                    var value = _ref.value;
                    var done = _ref.done;

                    if (hasCanceled_) {
                        reader.cancel();

                        return;
                    }
                    if (value && value.buffer) {
                        var _ret = function () {
                            var buffer = void 0,
                                segment = void 0;

                            if (rest !== null) {
                                buffer = (0, _concat2.default)(rest, value.buffer);
                            } else {
                                buffer = value.buffer;
                            }

                            // Make sure that the first buffer is lager then 44 bytes.
                            if (isFirstBuffer && buffer.byteLength <= 44) {
                                rest = buffer;

                                read();

                                return {
                                    v: void 0
                                };
                            }

                            // If the header has arrived try to derive the numberOfChannels and the
                            // sampleRate of the incoming file.
                            if (isFirstBuffer) {
                                isFirstBuffer = false;

                                var dataView = new DataView(buffer);

                                numberOfChannels = dataView.getUint16(22, true);
                                sampleRate = dataView.getUint32(24, true);

                                buffer = buffer.slice(44);
                            }

                            if (buffer.byteLength % 2 !== 0) {
                                rest = buffer.slice(-2, -1);
                                buffer = buffer.slice(0, -1);
                            } else {
                                rest = null;
                            }

                            segment = {};

                            audioStack.push(segment);

                            context.decodeAudioData((0, _wavify2.default)(buffer, numberOfChannels, sampleRate)).then(function (audioBuffer) {
                                segment.buffer = audioBuffer;

                                if (scheduleBuffersTimeoutId === null) {
                                    scheduleBuffers();
                                }
                            });
                        }();

                        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                    }

                    if (done) {
                        return;
                    }

                    // continue reading
                    read();
                });
            };

            // start reading
            read();
        });
    };

    return {
        play: function play(url) {
            return _play(url);
        },
        stop: function stop() {
            hasCanceled_ = true;
            if (context) {
                context.close();
            }
        },
        setFilter: function setFilter(centerFreq, bandWidth) {
            // bpf.type = filterType
            lpf.frequency.value = centerFreq + (bandWidth / 2)
            bpf.frequency.value = centerFreq
            bpf.Q.value = (centerFreq / bandWidth) * 2
        }
    };
};

exports.default = WavPlayer;

},{"./concat":2,"./wavify":4}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});


// Concat two ArrayBuffers
var concat = function concat(buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

    return tmp.buffer;
};

exports.default = concat;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _WavPlayer = require('./WavPlayer');

var _WavPlayer2 = _interopRequireDefault(_WavPlayer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _WavPlayer2.default;

module.exports = _WavPlayer2.default;

},{"./WavPlayer":1}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _concat = require('./concat');

var _concat2 = _interopRequireDefault(_concat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Write a proper WAVE header for the given buffer.
var wavify = function wavify(data, numberOfChannels, sampleRate) {
    var header = new ArrayBuffer(44);

    var d = new DataView(header);

    d.setUint8(0, 'R'.charCodeAt(0));
    d.setUint8(1, 'I'.charCodeAt(0));
    d.setUint8(2, 'F'.charCodeAt(0));
    d.setUint8(3, 'F'.charCodeAt(0));

    d.setUint32(4, data.byteLength / 2 + 44, true);

    d.setUint8(8, 'W'.charCodeAt(0));
    d.setUint8(9, 'A'.charCodeAt(0));
    d.setUint8(10, 'V'.charCodeAt(0));
    d.setUint8(11, 'E'.charCodeAt(0));
    d.setUint8(12, 'f'.charCodeAt(0));
    d.setUint8(13, 'm'.charCodeAt(0));
    d.setUint8(14, 't'.charCodeAt(0));
    d.setUint8(15, ' '.charCodeAt(0));

    d.setUint32(16, 16, true);
    d.setUint16(20, 1, true);
    d.setUint16(22, numberOfChannels, true);
    d.setUint32(24, sampleRate, true);
    d.setUint32(28, sampleRate * 1 * 2);
    d.setUint16(32, numberOfChannels * 2);
    d.setUint16(34, 16, true);

    d.setUint8(36, 'd'.charCodeAt(0));
    d.setUint8(37, 'a'.charCodeAt(0));
    d.setUint8(38, 't'.charCodeAt(0));
    d.setUint8(39, 'a'.charCodeAt(0));
    d.setUint32(40, data.byteLength, true);

    return (0, _concat2.default)(header, data);
};

exports.default = wavify;

},{"./concat":2}]},{},[3])(3);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvV2F2UGxheWVyLmpzIiwic3JjL2NvbmNhdC5qcyIsInNyYy9pbmRleC5qcyIsInNyYy93YXZpZnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OztBQ0FBOzs7O0FBQ0E7Ozs7OztBQUVBLElBQU0sTUFBTSxTQUFOLEdBQU0sQ0FBQyxNQUFELEVBQVk7QUFDcEIsUUFBTSxnQkFBZ0IsSUFBSSxZQUFKLENBQWlCLENBQWpCLENBQXRCOztBQUVBLFdBQU8sZUFBUCxDQUF1QixhQUF2QixFQUFzQyxDQUF0QyxFQUF5QyxDQUF6Qzs7QUFFQSxRQUFJLGNBQWUsY0FBYyxDQUFkLElBQW1CLENBQXRDOztBQUVBLFNBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxPQUFPLE1BQTNCLEVBQW1DLEtBQUssQ0FBeEMsRUFBMkM7QUFDdkMsZUFBTyxlQUFQLENBQXVCLGFBQXZCLEVBQXNDLENBQXRDLEVBQXlDLENBQXpDOztBQUVBLFlBQUssZUFBZSxjQUFjLENBQWQsSUFBbUIsQ0FBbkMsSUFDSyxDQUFDLFdBQUQsSUFBZ0IsY0FBYyxDQUFkLElBQW1CLENBRDVDLEVBQ2dEO0FBQzVDO0FBQ0g7O0FBRUQsc0JBQWMsQ0FBZCxJQUFtQixDQUFuQjtBQUNBLGVBQU8sYUFBUCxDQUFxQixhQUFyQixFQUFvQyxDQUFwQyxFQUF1QyxDQUF2QztBQUNIOztBQUVELFdBQU8sZUFBUCxDQUF1QixhQUF2QixFQUFzQyxDQUF0QyxFQUF5QyxPQUFPLE1BQVAsR0FBZ0IsQ0FBekQ7O0FBRUEsa0JBQWUsY0FBYyxDQUFkLElBQW1CLENBQWxDOztBQUVBLFNBQUssSUFBSSxLQUFJLE9BQU8sTUFBUCxHQUFnQixDQUE3QixFQUFnQyxLQUFJLENBQXBDLEVBQXVDLE1BQUssQ0FBNUMsRUFBK0M7QUFDM0MsZUFBTyxlQUFQLENBQXVCLGFBQXZCLEVBQXNDLENBQXRDLEVBQXlDLEVB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LE1BQUUsUUFBRixDQUFXLEVBQVgsRUFBZSxJQUFJLFVBQUosQ0FBZSxDQUFmLENBQWY7QUFDQSxNQUFFLFFBQUYsQ0FBVyxFQUFYLEVBQWUsSUFBSSxVQUFKLENBQWUsQ0FBZixDQUFmO0FBQ0EsTUFBRSxTQUFGLENBQVksRUFBWixFQUFnQixLQUFLLFVBQXJCLEVBQWlDLElBQWpDOztBQUVBLFdBQU8sc0JBQU8sTUFBUCxFQUFlLElBQWYsQ0FBUDtBQUNILENBcENEOztrQkFzQ2UsTSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgd2F2aWZ5IGZyb20gJy4vd2F2aWZ5JztcbmltcG9ydCBjb25jYXQgZnJvbSAnLi9jb25jYXQnO1xuXG5jb25zdCBwYWQgPSAoYnVmZmVyKSA9PiB7XG4gICAgY29uc3QgY3VycmVudFNhbXBsZSA9IG5ldyBGbG9hdDMyQXJyYXkoMSk7XG5cbiAgICBidWZmZXIuY29weUZyb21DaGFubmVsKGN1cnJlbnRTYW1wbGUsIDAsIDApO1xuXG4gICAgbGV0IHdhc1Bvc2l0aXZlID0gKGN1cnJlbnRTYW1wbGVbMF0gPiAwKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmZmVyLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGJ1ZmZlci5jb3B5RnJvbUNoYW5uZWwoY3VycmVudFNhbXBsZSwgMCwgaSk7XG5cbiAgICAgICAgaWYgKCh3YXNQb3NpdGl2ZSAmJiBjdXJyZW50U2FtcGxlWzBdIDwgMCkgfHxcbiAgICAgICAgICAgICAgICAoIXdhc1Bvc2l0aXZlICYmIGN1cnJlbnRTYW1wbGVbMF0gPiAwKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50U2FtcGxlWzBdID0gMDtcbiAgICAgICAgYnVmZmVyLmNvcHlUb0NoYW5uZWwoY3VycmVudFNhbXBsZSwgMCwgaSk7XG4gICAgfVxuXG4gICAgYnVmZmVyLmNvcHlGcm9tQ2hhbm5lbChjdXJyZW50U2FtcGxlLCAwLCBidWZmZXIubGVuZ3RoIC0gMSk7XG5cbiAgICB3YXNQb3NpdGl2ZSA9IChjdXJyZW50U2FtcGxlWzBdID4gMCk7XG5cbiAgICBmb3IgKGxldCBpID0gYnVmZmVyLmxlbmd0aCAtIDE7IGkgPiAwOyBpIC09IDEpIHtcbiAgICAgICAgYnVmZmVyLmNvcHlGcm9tQ2hhbm5lbChjdXJyZW50U2FtcGxlLCAwLCBpKTtcblxuICAgICAgICBpZiAoKHdhc1Bvc2l0aXZlICYmIGN1cnJlbnRTYW1wbGVbMF0gPCAwKSB8fFxuICAgICAgICAgICAgICAgICghd2FzUG9zaXRpdmUgJiYgY3VycmVudFNhbXBsZVswXSA+IDApKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGN1cnJlbnRTYW1wbGVbMF0gPSAwO1xuICAgICAgICBidWZmZXIuY29weVRvQ2hhbm5lbChjdXJyZW50U2FtcGxlLCAwLCBpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVmZmVyO1xufTtcblxuY29uc3QgV2F2UGxheWVyID0gKCkgPT4ge1xuICAgIGxldCBjb250ZXh0O1xuXG4gICAgbGV0IGhhc0NhbmNlbGVkXyA9IGZhbHNlO1xuXG4gICAgY29uc3QgcGxheSA9IHVybCA9PiB7XG5cbiAgICAgICAgbGV0IG5leHRUaW1lID0gMDtcblxuICAgICAgICBjb25zdCBhdWRpb1N0YWNrID0gW107XG5cbiAgICAgICAgaGFzQ2FuY2VsZWRfID0gZmFsc2U7XG5cbiAgICAgICAgY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcblxuICAgICAgICBsZXQgc2NoZWR1bGVCdWZmZXJzVGltZW91dElkID0gbnVsbDtcblxuICAgICAgICBjb25zdCBzY2hlZHVsZUJ1ZmZlcnMgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoaGFzQ2FuY2VsZWRfKSB7XG4gICAgICAgICAgICAgICAgc2NoZWR1bGVCdWZmZXJzVGltZW91dElkID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2hpbGUgKGF1ZGlvU3RhY2subGVuZ3RoID4gMCAmJiBhdWRpb1N0YWNrWzBdLmJ1ZmZlciAhPT0gdW5kZWZpbmVkICYmIG5leHRUaW1lIDwgY29udGV4dC5jdXJyZW50VGltZSArIDIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50VGltZSA9IGNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzb3VyY2UgPSBjb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VnbWVudCA9IGF1ZGlvU3RhY2suc2hpZnQoKTtcblxuICAgICAgICAgICAgICAgIHNvdXJjZS5idWZmZXIgPSBwYWQoc2VnbWVudC5idWZmZXIpO1xuICAgICAgICAgICAgICAgIHNvdXJjZS5jb25uZWN0KGNvbnRleHQuZGVzdGluYXRpb24pO1xuXG4gICAgICAgICAgICAgICAgaWYgKG5leHRUaW1lID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFRpbWUgPSBjdXJyZW50VGltZSArIDAuMjsgIC8vLyBhZGQgNzAwbXMgbGF0ZW5jeSB0byB3b3JrIHdlbGwgYWNyb3NzIHN5c3RlbXMgLSB0dW5lIHRoaXMgaWYgeW91IGxpa2VcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsZXQgZHVyYXRpb24gPSBzb3VyY2UuYnVmZmVyLmR1cmF0aW9uO1xuICAgICAgICAgICAgICAgIGxldCBvZmZzZXQgPSAwO1xuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRUaW1lID4gbmV4dFRpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gY3VycmVudFRpbWUgLSBuZXh0VGltZTtcbiAgICAgICAgICAgICAgICAgICAgbmV4dFRpbWUgPSBjdXJyZW50VGltZTtcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbiAtIG9mZnNldDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzb3VyY2Uuc3RhcnQobmV4dFRpbWUsIG9mZnNldCk7XG4gICAgICAgICAgICAgICAgc291cmNlLnN0b3AobmV4dFRpbWUgKyBkdXJhdGlvbik7XG5cbiAgICAgICAgICAgICAgICBuZXh0VGltZSArPSBkdXJhdGlvbjsgLy8gTWFrZSB0aGUgbmV4dCBidWZmZXIgd2FpdCB0aGUgbGVuZ3RoIG9mIHRoZSBsYXN0IGJ1ZmZlciBiZWZvcmUgYmVpbmcgcGxheWVkXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjaGVkdWxlQnVmZmVyc1RpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gc2NoZWR1bGVCdWZmZXJzKCksIDUwMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmV0Y2godXJsKS50aGVuKChyZXNwb25zZSkgPT4ge1xuXG4gICAgICAgICAgICBjb25zdCByZWFkZXIgPSByZXNwb25zZS5ib2R5LmdldFJlYWRlcigpO1xuXG4gICAgICAgICAgICAvLyBUaGlzIHZhcmlhYmxlIGhvbGRzIGEgcG9zc2libHkgZGFuZ2xpbmcgYnl0ZS5cbiAgICAgICAgICAgIHZhciByZXN0ID0gbnVsbDtcblxuICAgICAgICAgICAgbGV0IGlzRmlyc3RCdWZmZXIgPSB0cnVlO1xuICAgICAgICAgICAgbGV0IG51bWJlck9mQ2hhbm5lbHMsIHNhbXBsZVJhdGU7XG5cbiAgICAgICAgICAgIGNvbnN0IHJlYWQgPSAoKSA9PiByZWFkZXIucmVhZCgpLnRoZW4oKHsgdmFsdWUsIGRvbmUgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChoYXNDYW5jZWxlZF8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhZGVyLmNhbmNlbCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLmJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICBsZXQgYnVmZmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VnbWVudDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmZmVyID0gY29uY2F0KHJlc3QsIHZhbHVlLmJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSB2YWx1ZS5idWZmZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgZmlyc3QgYnVmZmVyIGlzIGxhZ2VyIHRoZW4gNDQgYnl0ZXMuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0ZpcnN0QnVmZmVyICYmIGJ1ZmZlci5ieXRlTGVuZ3RoIDw9IDQ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0ID0gYnVmZmVyO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWFkKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBoZWFkZXIgaGFzIGFycml2ZWQgdHJ5IHRvIGRlcml2ZSB0aGUgbnVtYmVyT2ZDaGFubmVscyBhbmQgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIHNhbXBsZVJhdGUgb2YgdGhlIGluY29taW5nIGZpbGUuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0ZpcnN0QnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0ZpcnN0QnVmZmVyID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFWaWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG51bWJlck9mQ2hhbm5lbHMgPSBkYXRhVmlldy5nZXRVaW50MTYoMjIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FtcGxlUmF0ZSA9IGRhdGFWaWV3LmdldFVpbnQzMigyNCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IGJ1ZmZlci5zbGljZSg0NCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoYnVmZmVyLmJ5dGVMZW5ndGggJSAyICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0ID0gYnVmZmVyLnNsaWNlKC0yLCAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXIgPSBidWZmZXIuc2xpY2UoMCwgLTEpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzZWdtZW50ID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgYXVkaW9TdGFjay5wdXNoKHNlZ21lbnQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZGVjb2RlQXVkaW9EYXRhKHdhdmlmeShidWZmZXIsIG51bWJlck9mQ2hhbm5lbHMsIHNhbXBsZVJhdGUpKS50aGVuKChhdWRpb0J1ZmZlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VnbWVudC5idWZmZXIgPSBhdWRpb0J1ZmZlcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjaGVkdWxlQnVmZmVyc1RpbWVvdXRJZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlQnVmZmVycygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gY29udGludWUgcmVhZGluZ1xuICAgICAgICAgICAgICAgIHJlYWQoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBzdGFydCByZWFkaW5nXG4gICAgICAgICAgICByZWFkKCk7XG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGxheTogdXJsID0+IHBsYXkodXJsKSxcbiAgICAgICAgc3RvcDogKCkgPT4ge1xuICAgICAgICAgICAgaGFzQ2FuY2VsZWRfID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBXYXZQbGF5ZXI7IiwiXG5cbi8vIENvbmNhdCB0d28gQXJyYXlCdWZmZXJzXG5jb25zdCBjb25jYXQgPSAoYnVmZmVyMSwgYnVmZmVyMikgPT4ge1xuICAgIGNvbnN0IHRtcCA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcjEuYnl0ZUxlbmd0aCArIGJ1ZmZlcjIuYnl0ZUxlbmd0aCk7XG5cbiAgICB0bXAuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZmZlcjEpLCAwKTtcbiAgICB0bXAuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZmZlcjIpLCBidWZmZXIxLmJ5dGVMZW5ndGgpO1xuXG4gICAgcmV0dXJuIHRtcC5idWZmZXI7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb25jYXQ7XG4iLCJpbXBvcnQgV2F2UGxheWVyIGZyb20gJy4vV2F2UGxheWVyJztcblxuZXhwb3J0IGRlZmF1bHQgV2F2UGxheWVyO1xubW9kdWxlLmV4cG9ydHMgPSBXYXZQbGF5ZXI7IiwiaW1wb3J0IGNvbmNhdCBmcm9tICcuL2NvbmNhdCc7XG5cbi8vIFdyaXRlIGEgcHJvcGVyIFdBVkUgaGVhZGVyIGZvciB0aGUgZ2l2ZW4gYnVmZmVyLlxuY29uc3Qgd2F2aWZ5ID0gKGRhdGEsIG51bWJlck9mQ2hhbm5lbHMsIHNhbXBsZVJhdGUpID0+IHtcbiAgICBjb25zdCBoZWFkZXIgPSBuZXcgQXJyYXlCdWZmZXIoNDQpO1xuXG4gICAgdmFyIGQgPSBuZXcgIERhdGFWaWV3KGhlYWRlcik7XG5cbiAgICBkLnNldFVpbnQ4KDAsICdSJy5jaGFyQ29kZUF0KDApKTtcbiAgICBkLnNldFVpbnQ4KDEsICdJJy5jaGFyQ29kZUF0KDApKTtcbiAgICBkLnNldFVpbnQ4KDIsICdGJy5jaGFyQ29kZUF0KDApKTtcbiAgICBkLnNldFVpbnQ4KDMsICdGJy5jaGFyQ29kZUF0KDApKTtcblxuICAgIGQuc2V0VWludDMyKDQsIGRhdGEuYnl0ZUxlbmd0aCAvIDIgKyA0NCwgdHJ1ZSk7XG5cbiAgICBkLnNldFVpbnQ4KDgsICdXJy5jaGFyQ29kZUF0KDApKTtcbiAgICBkLnNldFVpbnQ4KDksICdBJy5jaGFyQ29kZUF0KDApKTtcbiAgICBkLnNldFVpbnQ4KDEwLCAnVicuY2hhckNvZGVBdCgwKSk7XG4gICAgZC5zZXRVaW50OCgxMSwgJ0UnLmNoYXJDb2RlQXQoMCkpO1xuICAgIGQuc2V0VWludDgoMTIsICdmJy5jaGFyQ29kZUF0KDApKTtcbiAgICBkLnNldFVpbnQ4KDEzLCAnbScuY2hhckNvZGVBdCgwKSk7XG4gICAgZC5zZXRVaW50OCgxNCwgJ3QnLmNoYXJDb2RlQXQoMCkpO1xuICAgIGQuc2V0VWludDgoMTUsICcgJy5jaGFyQ29kZUF0KDApKTtcblxuICAgIGQuc2V0VWludDMyKDE2LCAxNiwgdHJ1ZSk7XG4gICAgZC5zZXRVaW50MTYoMjAsIDEsIHRydWUpO1xuICAgIGQuc2V0VWludDE2KDIyLCBudW1iZXJPZkNoYW5uZWxzLCB0cnVlKTtcbiAgICBkLnNldFVpbnQzMigyNCwgc2FtcGxlUmF0ZSwgdHJ1ZSk7XG4gICAgZC5zZXRVaW50MzIoMjgsIHNhbXBsZVJhdGUgKiAxICogMik7XG4gICAgZC5zZXRVaW50MTYoMzIsIG51bWJlck9mQ2hhbm5lbHMgKiAyKTtcbiAgICBkLnNldFVpbnQxNigzNCwgMTYsIHRydWUpO1xuXG4gICAgZC5zZXRVaW50OCgzNiwgJ2QnLmNoYXJDb2RlQXQoMCkpO1xuICAgIGQuc2V0VWludDgoMzcsICdhJy5jaGFyQ29kZUF0KDApKTtcbiAgICBkLnNldFVpbnQ4KDM4LCAndCcuY2hhckNvZGVBdCgwKSk7XG4gICAgZC5zZXRVaW50OCgzOSwgJ2EnLmNoYXJDb2RlQXQoMCkpO1xuICAgIGQuc2V0VWludDMyKDQwLCBkYXRhLmJ5dGVMZW5ndGgsIHRydWUpO1xuXG4gICAgcmV0dXJuIGNvbmNhdChoZWFkZXIsIGRhdGEpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgd2F2aWZ5Il19
class SmartceiverWebUSBConnector {
  constructor() {
    this.devFilters = [
      { 'vendorId': 0x2341, 'productId': 0x8036 },
      { 'vendorId': 0x2341, 'productId': 0x8037 },
    ]
  }

  static get id() { return 'smartceiver-webusb'; }
  static get name() { return 'SmartCeiver standalone WebUSB'; }
  static get capabilities() { return []; }

  connect(tcvr, successCallback) {
    // this.requestPort()
    navigator.usb.requestDevice({ 'filters': this.devFilters }).then(device => {
      console.log('Connecting to ' + device.productName)
      this._connectDevice(device).then(port => {
        console.log('Connected ' + device.productName)
        this._bindCommands(tcvr, port)
        successCallback(port);
      }, error => {
         console.log('Connection error (2): ' + error);
      });
    }).catch(error => {
      console.error('Connection error (1): ' + error);
    });
  }

  _connectDevice(device) {
    let port = new SmartceiverWebUSBPort(device)
    return port._open().then(() => port)
  };

  _bindCommands(tcvr, port) {
    tcvr.bind(EventType.keyDit, this.constructor.id, event => port.send(".;"))
    tcvr.bind(EventType.keyDah, this.constructor.id, event => port.send("-;"))
    // tcvr.bind(EventType.mode, this.constructor.id, event => port.send("MD" + (event.value + 1) + ";"))
    tcvr.bind(EventType.freq, this.constructor.id, event => {
      let freq = event.value
      let data = "FA" // + _vfos[this._rxVfo]; // TODO split
      data += "000"
      if (freq < 10000000) { // <10MHz
          data += "0"
      }
      data += freq
      port.send(data + ";")
    })
    tcvr.bind(EventType.wpm, this.constructor.id, event => port.send("KS0" + event.value + ";"))
    tcvr.bind(EventType.filter, this.constructor.id, event => {
      // console.log('bandWidth=' + bandWidth)
      // TODO this.player.setFilter(tcvr.sidetoneFreq, event.value)
      port.send((event.value < 1000 ? "RW0" : "RW") + event.value + ";")
    })
    tcvr.bind(EventType.preamp, this.constructor.id, event => port.send("PA" + (event.value ? "1" : "0") + ";"))
    tcvr.bind(EventType.attn, this.constructor.id, event => port.send("RA0" + (event.value ? "1" : "0") + ";"))
  }
}

class SmartceiverWebUSBPort {
  constructor(device) {
    this._device = device;
    this._encoder = new TextEncoder();
  }

  _open() {
    let decoder = new TextDecoder();
    let readLoop = () => {
      this._device.transferIn(5, 64).then(result => {
        this.onReceive(decoder.decode(result.data));
        readLoop();
      }, error => {
        this.onReceiveError(error);
      });
    };
    return this._device.open()
      .then(() => {
        if (this._device.configuration === null) {
          return this._device.selectConfiguration(1);
        }
      })
      .then(() => this._device.claimInterface(2))
      .then(() => this._device.controlTransferOut({
        'requestType': 'class',
        'recipient': 'interface',
        'request': 0x22,
        'value': 0x01,
        'index': 0x02
      }))
      .then(() => {
        readLoop();
      });
  }

  disconnect() {
    return this._device.controlTransferOut({
      'requestType': 'class',
      'recipient': 'interface',
      'request': 0x22,
      'value': 0x00,
      'index': 0x02
    })
      .then(() => this._device.close());
  }

  send(data) {
    return this._device.transferOut(4, this._encoder.encode(data));
  }

  onReceive(data) {
    console.log('Received: ' + data);
  }

  onReceiveError(error) {
    console.log('Receive error: ' + error);
  }
}

tcvrConnectors.register(new SmartceiverWebUSBConnector());
class SmartceiverApp extends Element {

  static get is() { return 'smartceiver-app'; }

  static get properties() {
    return {
      page: {
        type: String,
        reflectToAttribute: true//,
        // observer: '_pageChanged',
      },
     freqDisplay: {
        type: String,
        computed: 'formatFreq(tcvr.freq)'
      }
    };
  }

  static get observers() {
    return [
      // '_routePageChanged(routeData.page)',
      '_tokenChanged(route.__queryParams)',
      // '_queryParams(route)',
    ];
  }

  constructor() {
    super();
    this.page = 'tune'
    document.token = this.token = ''
    document.tcvr = this.tcvr = new Transceiver();
    this.tcvr.bind(EventType.freq, 'ui', event => this._freqChanged(event.value)); // listen for freq changes on mode/band change
    this.tcvr.bind(EventType.keyDit, 'ui', event => this.onKeyed());
    this.tcvr.bind(EventType.keyDah, 'ui', event => this.onKeyed());
    this.tcvr.bind(EventType.pwrsw, 'ui', event => {
      this.notifyPath('tcvr.freq')
      this.notifyPath('tcvr.powerSwState')
      this.$.tune.notifyPath('freq')
      this.$.tune.notifyPath('power')
    })
  }

  // _queryParams(p) {
    // console.log(`queryParams=${JSON.stringify(p)}`)
  // }

  _freqChanged(freq) {
    if (freq == this._freq) {
      return; // stop propagate freq change when changed by tuning knob (already propagated)
    }
    this.notifyPath('tcvr.freq');
    this.$.tune.notifyPath('freq');
  }

  formatFreq(freq) {
    this._freq = freq; // store value for change detect
    if (freq === null || !this.tcvr.powerSwState) {
      return ''
    }

    let mhz = Math.floor(freq / 1000000);
    let res = '' + mhz + '.';
    let khz = (freq - mhz * 1000000) / 1000;
    if (khz < 10) {
     res += '0';
    }
    if (khz < 100) {
     res += '0';
    }
   res += khz;
    if (khz % 1 === 0) {
     res += '.00';
    } else if (freq % 100 === 0) {
     res += '0';
    }

    return res;
  }

  onKeyed() {
    this.$.freq.style = "color: #dd6b88;"
    if (this.keyedTimer) {
      clearTimeout(this.keyedTimer)
      this.keyedTimer = null
    }
    this.keyedTimer = setTimeout(() => {
      this.keyedTimer = null
      this.$.freq.style = ""
    }, 400)
  }

  switchPower() {
    this.tcvr.switchPower(this.token);
  }

  connectRemoddle() {
    this.tcvr.connectRemoddle();
  }

  _tokenChanged(params) {
    const token = params['token']
    console.log(`token=${token}`)
    if ( ! token) return;
    document.token = this.token = token;
  }

  // _routePageChanged(page) {
  //   // Polymer 2.0 will call with `undefined` on initialization.
  //   // Ignore until we are properly called with a string.
  //   if (page === undefined) {
  //     return;
  //   }

  //   // If no page was found in the route data, page will be an empty string.
  //   // Deault to 'main' in that case.
  //   console.log("page=" + page);
  //   this.page = page || 'tune';

  //   // Close a non-persistent drawer when the page & route are changed.
  //   if (!this.$.drawer.persistent) {
  //     this.$.drawer.close();
  //   }
  // }

  // _pageChanged(page) {
  //   // Load page import on demand. Show 404 page if fails
  //   var resolvedPageUrl = this.resolveUrl(page + '-view.html');
  //   Polymer.importHref(
  //       resolvedPageUrl,
  //       null,
  //       this._showPage404.bind(this),
  //       true);
  // }

  // _showPage404() {
  //   this.page = 'error404';
  // }
}

window.customElements.define(SmartceiverApp.is, SmartceiverApp);
