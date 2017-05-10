var webusb = {};

(function() {
  'use strict';
  
  webusb.encoder_ = new TextEncoder();
  webusb.decoder_ = new TextDecoder();

  webusb.getPorts = function() {
    return navigator.usb.getDevices().then(devices => {
      return devices.map(device => new webusb.Port(device));
    });
  };

  webusb.requestPort = function() {
    const filters = [
      { 'vendorId': 0x2341, 'productId': 0x8036 },
      { 'vendorId': 0x2341, 'productId': 0x8037 },
    ];
    return navigator.usb.requestDevice({ 'filters': filters }).then(
      device => new webusb.Port(device)
    );
  }

  webusb.Port = function(device) {
    this.device_ = device;
  };

  webusb.Port.prototype.connect = function() {
    let readLoop = () => {
      this.device_.transferIn(5, 64).then(result => {
        this.onReceive(webusb.decoder_.decode(result.data));
        readLoop();
      }, error => {
        this.onReceiveError(error);
      });
    };

    return this.device_.open()
        .then(() => {
          if (this.device_.configuration === null) {
            return this.device_.selectConfiguration(1);
          }
        })
        .then(() => this.device_.claimInterface(2))
        .then(() => this.device_.controlTransferOut({
            'requestType': 'class',
            'recipient': 'interface',
            'request': 0x22,
            'value': 0x01,
            'index': 0x02}))
        .then(() => {
          readLoop();
        });
  };

  webusb.Port.prototype.disconnect = function() {
    return this.device_.controlTransferOut({
            'requestType': 'class',
            'recipient': 'interface',
            'request': 0x22,
            'value': 0x00,
            'index': 0x02})
        .then(() => this.device_.close());
  };

  webusb.Port.prototype.send = function(data) {
    return this.device_.transferOut(4, webusb.encoder_.encode(data));
  };
})();
