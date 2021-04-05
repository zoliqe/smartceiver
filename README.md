# Smartceiver - An Open platform transceiver

Smartceiver is based on these technologies:
* **Arduino (Pro) Micro**
* **Si5351** 
* **WebUSB/WebSerial** 
* **LitElement library** 

### Hardware

##### Supported receiver types
* **Direct Conversion**
* **Superhet with IF**

##### Supported modes
[Only CW]
RX is capable to receive SSB signals with WIDE filter.
TX is keyed by enable/disable Si5351 output (or on AD9850 by power down mode).

### Control Software

Based on new standards WebUSB/WebSerial + WebComponents. Thanks to wide support of these technologies, you can control Smartceiver on desktopPC/notebook or your mobile/tablet.
Currently tested:
- Linux (with latest Chrome browser) and ChromeOS
- Android 7+ with Chrome

*TODO*
- Powron: try remove Serial.begin() (it's optional) and change baudrate to 115200
- Remoddle functions enc2Hold (switch NAR/WIDE filter; switch PaddleReverse), enc3Hold (RIT clear)
- Refactor WebRTC to use Microphone module
- Reimplement support for SSB mic (bidir audio transfer)

- use KV storage to persist state / connectors config
- build filter table with AudioProcessor filters
- add login form for remote
- create settings page for connectors (with persistance)
- check: Hide unchangeable values (values.length <= 1)
- show loaded version: await fetch('https://api.github.com/repos/zoliqe/Smartceiver/commits/master')
