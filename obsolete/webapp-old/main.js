
  var bands = [3542000, 7030000, 10123000, 14060000, 18088000, 21060000];
  var steps = [10, 100, 1000];
  var band = 1;
  var step = 0;
//   var freq = bands[currentBand];
  var threshold = 5;
  var wheelThreshold = 5;
  var wpm = 28;
  var tunning = true; // will be inverted after connect
  var xfilNarrow = true; // will be inverted after connect
// move defaults to init method and call it in connect()

  var port;
  var buffer = "";

  var powerButton = document.getElementById('power-button');
  var circle = document.getElementById('tuning-knob');
  var center = document.getElementById('knob-center');
  var bandDisplay = document.getElementById('band-display');
  var freqDisplay = document.getElementById('freq-display');
  var wpmDec = document.getElementById('wpm-dec');
  var wpmInc = document.getElementById('wpm-inc');
  var wpmDisplay = document.getElementById('wpm-display');
  var tuneButton = document.getElementById('tune-button');
  var xfilButton = document.getElementById('xfil-button');
  var startAngle = 0;
  var lastAngle = 0;
  var lastRotation = 0;
  var wheelY = 0;
  var startX = circle.offsetLeft + center.offsetLeft;
  var startY = circle.offsetTop + center.offsetTop;

  var self = this;

  function start() {
    // console.log('startX: ' + startX + ', startY: ' + startY);
    circle.addEventListener("touchstart", function (e) {
      var touch = event.changedTouches.item(0);
      startAngle = Math.atan2(touch.pageY - startY, touch.pageX - startX) * 180 / Math.PI;
      // console.log("start: " + startAngle);
    });
    circle.addEventListener("touchmove", rotateByTouch);
    circle.addEventListener("touchend", rotateByTouch);
    circle.addEventListener("wheel", rotateByWheel);
    bandDisplay.addEventListener("wheel", rotateByWheel);
    freqDisplay.addEventListener("wheel", rotateByWheel);

    bandDisplay.innerHTML = '-';
    freqDisplay.innerHTML = '-';
    bandDisplay.addEventListener("click", event => switchBand());
    freqDisplay.addEventListener("click", event => switchStep());

    ///
    wpmDec.addEventListener('click', event => updateWpm(-2));
    wpmInc.addEventListener('click', event => updateWpm(+2));
    
    tuneButton.addEventListener('click', () => switchTunning());
    xfilButton.addEventListener('click', () => switchXFil());

    powerButton.textContent = 'ON';
//     switchPower(); // auto startup, disabled -requires user gesture
    powerButton.addEventListener('click', () => switchPower());
  }

  function switchPower() {
      if (self.port) {
        self.port.disconnect();
        self.port = undefined;
        powerButton.textContent = 'ON';
//        chrome.serial.disconnect(port, () => {
//          self.port = undefined;
//          powerButton.textContent = 'ON';
//        });
      } else {
        console.log('connect');
//         chrome.serial.getDevices((devices) => {
//           console.log('got devs ' + devices.length);
//           let selectDevice;
//           for (let i = 0; i < devices.length; i++) {
//             let dev = devices[i];
//             console.log('try dev ' + dev.path + ' ' + dev.displayName + ' ' + dev.vendorId + ' ' + dev.productId);
//             if ((dev.vendorId === 1027 && dev.productId === 24577)
//                 || (dev.vendorId === 6790 && dev.productId === 29987)) { // china fake
//                 selectDevice = dev;
//                 break;
//             }
//           }
//           if (selectDevice === undefined) {
//             console.log('No device found.');
//           } else {
//             console.log('Connecting to: ' + selectDevice.path + ' ' + selectDevice.displayName);
//             chrome.serial.connect(selectDevice.path, {bitrate: 9600}, (connection) => {
//               self.port = connection.connectionId;
//               powerButton.textContent = 'OFF';
//               chrome.serial.onReceive.addListener(onReceive);
//               chrome.serial.onReceiveError.addListener((info) => {
//                 if (info.connectionId === self.port) {
//                   console.log('onReceiveError: ' + info.error);
//                 }
//               });
//               console.log('Connected: ' + self.port);
//             });
//           }
//         });
        serial.requestPort().then(selectedPort => {
          self.port = selectedPort;
          connect();
        }).catch(error => {
          console.error('Connection error (1): ' + error);
        });
      }
    }

  function connect() {
    console.log('Connecting to ' + self.port.device_.productName);
    self.port.connect().then(() => {
      console.log('Connected ' + self.port);
      powerButton.textContent = 'OFF';
      port.onReceive = data => {
        console.log('Received: ' + data);
      };
      port.onReceiveError = error => {
        console.log('Receive error: ' + error);
      };
      updateFreq(0);
      updateWpm(0);
      switchTunning();
      switchXFil();
    }, error => {
       console.log('Connection error (2): ' + error);
    });
  }

  function rotateByTouch(event) {
    var touch = event.changedTouches.item(0);

    // Turn off default event handling
    event.preventDefault();
    var currentAngle = Math.atan2(touch.pageY - startY, touch.pageX - startX) * 180 / Math.PI;
    var rotation = lastAngle + (currentAngle - startAngle);
  //   lastAngle = rotation;

    if (Math.abs(rotation - lastRotation) > threshold) {
      tune(rotation);
    }

    if (event.type == "touchend") {
      lastAngle = rotation;
    }
    return rotation;
  }

  function rotateByWheel(event) {
    wheelY += event.deltaY;
    if (Math.abs(wheelY) < wheelThreshold) {
      return;
    }
    // console.log('deltaY ' + event.deltaY);
    var rotation = wheelY < 0 ? lastRotation + threshold + 1 : lastRotation - threshold - 1;
    tune(rotation);
    wheelY = 0;
    // lastAngle = rotation;
  }

  function tune(rotation) {
    var delta = rotation - lastRotation > 0 ? steps[step] : 0 - steps[step];
//     freq = rotation - lastRotation > 0 ? freq + delta : freq - delta;
    updateFreq(delta);

    lastRotation = rotation;
    var transform = "rotate(" + rotation + "deg)";
    // console.log(transform);
    circle.style.transform = transform;
  }

  function switchStep() {
    // TODO add number underline
    if (++step >= steps.length) {
      step = 0;
    }
  }

  function switchBand() {
    if (self.port == undefined) {
      return;
    }
    if (++band >= bands.length) {
      band = 0;
    }
    updateFreq(0);
  }

  function updateFreq(delta) {
    if (self.port == undefined) {
      return;
    }
    var freq = bands[band] + delta;
    bands[band] = freq; // store new freq of band
    var mhz = Math.floor(freq / 1000000);
//     console.log(band);
    bandDisplay.innerHTML = mhz.toString();
    var khz = (freq - mhz * 1000000) / 1000;
//     console.log(khz);
    freqDisplay.innerHTML = '';
    if (khz < 10) {
      freqDisplay.innerHTML += '0';
    }
    if (khz < 100) {
      freqDisplay.innerHTML += '0';
    }
    freqDisplay.innerHTML += khz;
    if (khz % 1 === 0) {
      freqDisplay.innerHTML += '.00';
    } else if (freq % 100 === 0) {
      freqDisplay.innerHTML += '0';
    }

    let data = "FA000";
    if (freq < 10000000) { // <10MHz
        data += "0";
    }
    data += freq + ";";
//       chrome.serial.send(self.port, convertStringToArrayBuffer(data), (info) => {
//         if (info.error) {
//           console.log("error sending: " + info.error);
//         }
//       });
    self.port.send(data);
  }

  function updateWpm(change) {
    if (self.port == undefined) {
      return;
    }
    var newWpm = wpm + change;
    if (newWpm < 10 || newWpm > 40) {
      return;
    }
    wpm = newWpm;
    wpmDisplay.innerHTML = 'WPM: ' + wpm;
    let data = "KS" + wpm + ";";
//       chrome.serial.send(self.port, convertStringToArrayBuffer(data), (info) => {
//         if (info.error) {
//           console.log("error sending: " + info.error);
//         }
//       });
    self.port.send(data);
  }

  function switchTunning() {
    if (self.port == undefined) {
      return;
    }
    tunning = !tunning;
    tuneButton.textContent = tunning ? 'STOP' : 'TUNE';
    let data = "KT" + (tunning ? "1" : "0") + ";";
//       chrome.serial.send(self.port, convertStringToArrayBuffer(data), (info) => {
//         if (info.error) {
//           console.log("error sending: " + info.error);
//         }
//       });
    self.port.send(data);
  }

  function switchXFil() {
    if (self.port == undefined) {
      return;
    }
    xfilNarrow = !xfilNarrow;
    xfilButton.textContent = xfilNarrow ? 'NAR' : 'WIDE';
    let data = "RW" + (xfilNarrow ? "1" : "0") + ";";
//       chrome.serial.send(self.port, convertStringToArrayBuffer(data), (info) => {
//         if (info.error) {
//           console.log("error sending: " + info.error);
//         }
//       });
    self.port.send(data);
  }

//   function onReceive(receiveInfo) {
//     if (receiveInfo.connectionId !== self.port) {
//       return;
//     }

//     buffer += ab2str(receiveInfo.data);
//     var index;
//     while ((index = buffer.indexOf(';')) >= 0) {
//       var line = buffer.substr(0, index + 1);
//       console.log('tcvr: ' + line);
//       buffer = buffer.substr(index + 1);
//     }
//   }

  /* Interprets an ArrayBuffer as UTF-8 encoded string data. */
//   var ab2str = function(buf) {
//     var bufView = new Uint8Array(buf);
//     var encodedString = String.fromCharCode.apply(null, bufView);
//     return decodeURIComponent(escape(encodedString));
//   };

  /* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
//   var str2ab = function(str) {
//     var encodedString = unescape(encodeURIComponent(str));
//     var bytes = new Uint8Array(encodedString.length);
//     for (var i = 0; i < encodedString.length; ++i) {
//       bytes[i] = encodedString.charCodeAt(i);
//     }
//     return bytes.buffer;
//   };

  // Convert string to ArrayBuffer
//   function convertStringToArrayBuffer(str) {
//     var buf=new ArrayBuffer(str.length);
//     var bufView=new Uint8Array(buf);
//     for (var i=0; i<str.length; i++) {
//       bufView[i]=str.charCodeAt(i);
//     }
//     return buf;
//   }

window.onload = function() {
  start();
};
