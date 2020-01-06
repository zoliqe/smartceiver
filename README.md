# Smartceiver - An Open platform transceiver

Smartceiver is based on these technologies:
* **Arduino (Pro) Micro**
* **Si5351** 
* **WebUSB** 
* **Polymer2 WebComponents** 

### Hardware

##### Supported receiver types
* **Direct Conversion**
* **Superhet with IF**

##### Supported modes
[Only CW]
RX is capable to receive SSB signals with WIDE filter.
TX is keyed by enable/disable Si5351 output (or on AD9850 by power down mode).

### Control Software

Based on new standards WebUSB + WebComponents. Thanks to wide support of these technologies, you can control Smartceiver on computer or mobile.
Currently tested:
- LinuxOS (with latest Chrome browser) and ChromeOS
- Android 7+ with Chrome

*TODO*
- Hide unchangeable values (values.length <= 1)
- panadapter
- build filter table with AudioProcessor filters
- use KV storage to persist state / connectors config
- add login form for remote
- create settings page for connectors (with persistance)
