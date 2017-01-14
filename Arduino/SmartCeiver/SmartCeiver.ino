#include <WebUSB.h>

#include <stdio.h>
//#include <AD9850.h>
#include <Wire.h>
#include <si5351.h>
// #include <ClickEncoder.h>
// #include <TimerOne.h>
#include "pins.h"
#include "keyer.h"

// For DirectConversion (DC) RX comment out both of following options
// For superhet type of RX use RX_IF with proper IF value (default 4.9152MHz)
#define RX_IF    4915200L
// For RX with SDR dongle (RTL-SDR) use FIXED_RX_LO set to fixed frequency of SDR receiver
// #define FIXED_RX_LO  65000000L
#if defined(RX_IF) && defined(FIXED_RX_LO)
#error "Cannot have both options enabled: RX_IF && FIXED_RX_LO"
#endif

const WebUSBURL URLS[] = {
  { 1, "zoliqe.github.io/smartceiver" },
  { 0, "localhost:8000" },
};
const uint8_t ALLOWED_ORIGINS[] = { 1, 2 };
WebUSB WebUSBSerial(URLS, 2, 1, ALLOWED_ORIGINS, 2);
#define Serial WebUSBSerial
String serialCommand = "";

//AD9850 osc(PIN_DDS_CLK, PIN_DDS_UPDATE, PIN_DDS_DATA); // w_clk, fq_ud, data
const uint8_t pllMult = 36;
const uint32_t pllFreq = pllMult * SI5351_CRYSTAL_FREQ_25MHZ;
const uint32_t rFractPr = 100000;
Adafruit_SI5351 osc = Adafruit_SI5351();
unsigned long freqTX = 7030000L;
unsigned long freqRX = 0; // will be set by calling setfreq(RX)
bool freqChanged = true;

byte pwrLevel = HIGH;
byte lpfState = 255; // LPF selected band state 1..3
byte bpfState = 255; // BPF selected band state: 0..3; out of range to force set pin values
byte attnState = HIGH;
byte xfilWidth = HIGH;

// ClickEncoder *encoder;

// void encoderTimer() {
//   encoder->service();
// }

void setup() {
  initialize_keyer();
  initialize_pins();
  
  delay(250);  // wait a little bit for the caps to charge up on the paddle lines
  
  if (osc.begin() != ERROR_NONE) {
    /* There was a problem detecting the IC ... check your connections */
  }
  osc.setupPLL(SI5351_PLL_A, pllMult, 0, 1);
  osc.setupPLL(SI5351_PLL_B, pllMult, 0, 1);
  frequency(freqTX);
#ifdef FIXED_RX_LO
  setfreq(RX); // explicitly set the RX freq
#endif
#ifdef RX_IF
  unsigned long freqIF = RX_IF - keyerConf.sidetone;
  osc.setupMultisynth(BFO, SI5351_PLL_A, pllFreq / freqIF, ((pllFreq / ((float) freqIF)) - (pllFreq / freqIF)) * rFractPr, rFractPr);
#endif
	osc.enableOutputs(PIN_RXLO);
  osc.setupDriveStrength(RX, SI5351_DRIVE_2MA);
  osc.setupDriveStrength(BFO, SI5351_DRIVE_2MA);

  selectBPF();
  
  Serial.begin(115200);
//   while (!Serial) {;} // wait for port connected
//   Serial.setTimeout(200); // TODO

  // encoder = new ClickEncoder(A2, A1, A3);
  // Timer1.initialize(1000);
  // Timer1.attachInterrupt(encoderTimer);
}

void initialize_pins() {
  pinMode(PIN_PADDLE_LEFT, INPUT);
  digitalWrite(PIN_PADDLE_LEFT, HIGH);
  pinMode(PIN_PADDLE_RIGHT, INPUT);
  digitalWrite(PIN_PADDLE_RIGHT, HIGH);

  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);
  pinMode(PIN_PTT, OUTPUT);
  digitalWrite(PIN_PTT, HIGH);
  pinMode(PIN_ATTN, OUTPUT);
  digitalWrite(PIN_ATTN, attnState);
  pinMode(PIN_SIDETONE, OUTPUT);
  digitalWrite(PIN_SIDETONE, LOW);
  pinMode(PIN_XFIL, OUTPUT);
  digitalWrite(PIN_XFIL, xfilWidth);
  
  pinMode(PIN_BPF_S0, OUTPUT);
  digitalWrite(PIN_BPF_S0, LOW);
  pinMode(PIN_BPF_S1, OUTPUT);
  digitalWrite(PIN_BPF_S1, LOW);
  pinMode(PIN_LPF_S0, OUTPUT);
  digitalWrite(PIN_LPF_S0, LOW);
  pinMode(PIN_LPF_S1, OUTPUT);
  digitalWrite(PIN_LPF_S1, LOW);
}

void initialize_keyer() {
  keyed = 0;
  keyerConf.tx_enabled = 1;
  keyerConf.keyer_mode = IAMBIC_A;
  keyerConf.reverse_paddle = 0;
  keyerConf.wpm = 28;
  keyerConf.autospace = 1;
  keyerConf.sidetone = 650; // Hz
  keyerConf.dah_to_dit_ratio = 300; // 300 = 3 / normal 3:1 ratio
  keyerConf.ptt_tail_time = 50; // ms
  keyerConf.ptt_lead_time = 0; // ms
  keyerConf.length_wordspace = 7;
  keyerConf.length_letterspace = 3;
  keyerConf.weighting = 50; // 50 = weighting factor of 1 (normal)
  keyerConf.keying_compensation = 0;
//  keyerConf.first_extension_time = 0;
}

// --------------------------------------------------------------------------------------------
void loop()
{
  if (Serial) {
    serialControl();
  }
  // int16_t encState = encoder->getValue();
  // if (encState != 0) {
  //   frequency(freqTX + (encState * 100));
  // }

  check_paddles();
  service_dit_dah_buffers();
  // TODO tx timeout

  check_ptt_tail();
}

/////////////////////////////// Serial control
void serialControl() {
  if (Serial.available() > 0) {
  	serialCommand = Serial.readStringUntil(';');
//  	Serial.println("got: " + serialCommand);
  	serialProcessCommand();
  }
}

void serialProcessCommand() {
	if (serialCommand.length() < 2) {
		serialCommand = "";
		return;
	}
	
	String cmd = serialCommand;
	String param = cmd.substring(2);
//	Serial.print("\n#" + cmd + "-" + param + "#\n");
	switch (cmd.charAt(0)) {
		case 'F':
			switch (cmd.charAt(1)) {
				case 'A':
					if (param.length() > 0) {
						frequency(param.substring(3).toInt());
					} else {
						serialSendFreq();
					}
					break;
			}
			break;
		case 'K':
			switch (cmd.charAt(1)) {
				case 'A':
					autospace(_bool(param));
					break;
				case 'E':
					txEnabled(_bool(param));
					break;
				case 'H':
					sidetone(int(param.toInt()));
					break;
				case 'M':
					keyerMode(byte(param.toInt()));
					break;
				case 'P':
					reversePaddle(_bool(param));
					break;
				case 'R':
					dah_to_dit_ratio(int(param.toInt()));
					break;
				case 'S':
					wpm(byte(param.toInt()));
					break;
				case 'T':
					tune(_bool(param));
					break;
			}
			break;
		case 'R':
			switch (cmd.charAt(1)) {
				case 'A':
					attenuator(_bool(param));
					break;
        case 'W':
          switchXfilterWidth(_bool(param));
          break;
			}
			break;
//		case 'T':
//			switch (cmd.charAt(1)) {
//			}
//			break;
	}
	serialCommand = "";
}

bool _bool(String s) {
	if (s.length() > 0) {
		return s.charAt(0) == '1';
	}
	return false;
}

void frequency(unsigned long new_freq) {
	if (new_freq >= 1e6 && new_freq <= 1e8) {
		freqTX = new_freq;
		freqChanged = true;
#ifndef FIXED_RX_LO
		setfreq(RX);
#endif
		selectBPF();
    serialSendFreq();
	}
}

void setfreq(OscType type) {
  si5351PLL_t pllSource = type == TX ? SI5351_PLL_B : SI5351_PLL_A;
  if (type == RX) {
#ifdef FIXED_RX_LO
      freqRX = FIXED_RX_LO;
#else
#ifdef RX_IF
      freqRX = freqTX > RX_IF ? (freqTX - RX_IF) : (RX_IF - freqTX);
#else
      freqRX = freqTX + keyerConf.sidetone; // USB
#endif // RX_IF
#endif // FIXED_RX_LO
  }
  unsigned long freq = type == TX ? freqTX : freqRX;
  freq += correctFreq;

  uint32_t a = pllFreq / freq;
  uint32_t b = ((pllFreq / ((float) freq)) - a) * rFractPr;
  uint32_t c = b ? rFractPr : 1;
//  Serial.print("a=");
//  Serial.print(a);
//  Serial.print(";b=");
//  Serial.print(b);
//  Serial.print(";");

  osc.setupMultisynth(type, pllSource, a, b, c);
}

void serialSendFreq() {
	Serial.print("FA000");
	if (freqTX < 10000000) { // <10MHz
		Serial.print('0');
	}
	Serial.print(freqTX);
	Serial.print(';');
  Serial.flush();
}

void attenuator(bool state) {
	attnState = state ? LOW : HIGH;
	if (!keyed) {
		digitalWrite(PIN_ATTN, attnState);
	}
	Serial.print("RA");
	Serial.print(attnState);
	Serial.print(';');
  Serial.flush();
}

void switchXfilterWidth(bool state) {
  xfilWidth = state ? HIGH : LOW;
  digitalWrite(PIN_XFIL, xfilWidth);
	Serial.print("RW");
	Serial.print(xfilWidth);
	Serial.print(';');
  Serial.flush();
}

void wpm(byte wpm) {
	if (wpm >= WPM_MIN && wpm <= WPM_MAX) {
		keyerConf.wpm = wpm;
	}
	Serial.print("KS0");
	Serial.print(keyerConf.wpm);
	Serial.print(';');
  Serial.flush();
}

void dah_to_dit_ratio(int ratio) {
	if (ratio >= RATIO_MIN && ratio <= RATIO_MAX) {
		keyerConf.dah_to_dit_ratio = ratio;
	}
}

void sidetone(int sidetone) {
	if (sidetone >= SIDETONE_HZ_LOW_LIMIT && sidetone <= SIDETONE_HZ_HIGH_LIMIT) {
		keyerConf.sidetone = sidetone;
	}
	Serial.print("KH");
	Serial.print(keyerConf.sidetone);
	Serial.print(';');
  Serial.flush();
}

void autospace(bool autospace) {
	keyerConf.autospace = autospace;
}

void keyerMode(byte mode) {
	if (mode == STRAIGHT || mode == IAMBIC_A || mode == IAMBIC_B) {
		keyerConf.keyer_mode = mode;
	}
}

void reversePaddle(bool reverse) {
	keyerConf.reverse_paddle = reverse;
	Serial.print("KP");
	Serial.print(keyerConf.reverse_paddle ? '1' : '0');
	Serial.print(';');
  Serial.flush();
}

void txEnabled(bool enabled) {
	// at first, stop transmiting
	if (!enabled) {
		tx(0);
		tune(false);
		ptt_unkey();
	}

	keyerConf.tx_enabled = enabled;
	Serial.print("KE");
	Serial.print(keyerConf.tx_enabled ? '1' : '0');
	Serial.print(';');
  Serial.flush();
}

void tune(bool enabled) {
	if (enabled) {
		pwrLevel = LOW;
//    osc.setupDriveStrength(TX, SI5351_DRIVE_2MA);
//		tx(1);
	} else {
//		tx(0);
    pwrLevel = HIGH;
	}
	Serial.print("KT");
	Serial.print(enabled ? '1' : '0');
	Serial.print(';');
  Serial.flush();
}

//--- KEYING -------------------------------------------------------------------
void tx(int state) {
	if (state && !keyed) {
		if (keyerConf.tx_enabled) {
//        byte first_element = !ptt_active;
			ptt_key();
//		    osc.setfreq(freqTX); // set current TX freq
			if (freqChanged) {
				setfreq(TX);
				freqChanged = false;
			}
osc.setupDriveStrength(TX, pwrLevel == LOW ? SI5351_DRIVE_2MA : SI5351_DRIVE_8MA);
			osc.enableOutputs(PIN_TXLO);
//        if (keyerConf.first_extension_time && first_element) {
//          delay(keyerConf.first_extension_time);
//        }
		}
		tone(PIN_SIDETONE, keyerConf.sidetone);
		keyed = 1;
	} else if (!state && keyed) {
		if (keyerConf.tx_enabled) {
			osc.enableOutputs(PIN_RXLO);
//	osc.down();
			ptt_key();
//      if (pwrLevel == LOW) {
//    		pwrLevel = HIGH;
//        osc.setupDriveStrength(TX, SI5351_DRIVE_8MA);
//      }
    }
		noTone(PIN_SIDETONE);
		keyed = 0;
	}
}

void ptt_key() {
  if (!ptt_active) {   // if PTT is currently deactivated, bring it up and insert PTT lead time delay
    digitalWrite(PIN_PTT, LOW);
    // delay(keyerConf.ptt_lead_time);
		digitalWrite(PIN_ATTN, LOW);
		digitalWrite(PIN_LED, HIGH);
    ptt_active = 1;
  }
  ptt_time = millis();
}

void ptt_unkey() {
  if (ptt_active) {
		digitalWrite(PIN_ATTN, attnState);
  	digitalWrite(PIN_LED, LOW);
    digitalWrite(PIN_PTT, HIGH);
    ptt_active = 0;
//	osc.setfreq(freqRX); // set RX IF freq
  }
}

void check_ptt_tail() {
  if (keyed) {
    ptt_time = millis();
    return;
  }
  
  if (ptt_active && (millis() - ptt_time) >= keyerConf.ptt_tail_time) {
    ptt_unkey();
  }
}

// --- BPF ---
void selectBPF() {
//	byte new_state = 0; // <4 MHz
//	if (freqTX >= 16000000L) { // 16+ MHz
//		new_state = 3;
//	} else if (freqTX >= 8000000L) { // 8-16 MHz
//		new_state = 2;	
//	} else if (freqTX >= 4000000L) { // 4-8 MHz
//		new_state = 1;
//	}
	byte state = 3;
  if (freqTX < 12000000L) {
    state = freqTX < 4000000L ? 1 : 2;
  }
	
	if (lpfState != state) { // write the state only when changed
    lpfState = state;
		digitalWrite(PIN_LPF_S0, state < 3);
		digitalWrite(PIN_LPF_S1, state == 3);
    delay(10);
    digitalWrite(PIN_LPF_S0, state == 1);
    digitalWrite(PIN_LPF_S1, state == 1);
	}
}

//-------------------------------------------------------------------------------------------------------
///////////////////////////// CW KEYER by K3NG
void check_paddles() {
	check_dit_paddle();
	check_dah_paddle();
}

void check_dit_paddle() {
  byte pin = keyerConf.reverse_paddle ? PIN_PADDLE_RIGHT : PIN_PADDLE_LEFT;
  if (!digitalRead(pin)) {
    dit_buffer = 1;
  }
}

void check_dah_paddle() {
  byte pin = keyerConf.reverse_paddle ? PIN_PADDLE_LEFT : PIN_PADDLE_RIGHT;
  if (!digitalRead(pin)) {
    dah_buffer = 1;
  }
}

byte one_paddle_touched() {
  return digitalRead(PIN_PADDLE_LEFT) == LOW || digitalRead(PIN_PADDLE_RIGHT) == LOW;
}

byte both_paddles_touched() {
  return digitalRead(PIN_PADDLE_LEFT) == LOW && digitalRead(PIN_PADDLE_RIGHT) == LOW;
}

void service_dit_dah_buffers() {
//  if ((keyerConf.keyer_mode != IAMBIC_A) && (keyerConf.keyer_mode != IAMBIC_B)) {
//    return;
//  }
  if ((keyerConf.keyer_mode == IAMBIC_A) && (iambic_flag) && both_paddles_touched()) {
    iambic_flag = 0;
    dit_buffer = 0;
    dah_buffer = 0;
    return;
  }
  
  if (dit_buffer) {
    dit_buffer = 0;
    send_dit(MANUAL_SENDING);
  }
  if (dah_buffer) {
    dah_buffer = 0;
    send_dah(MANUAL_SENDING);
  }
}

void send_dit(byte sending_type) {
  being_sent = SENDING_DIT;
  tx(1);
  loop_element_lengths((1.0*(float(keyerConf.weighting)/50)),keyerConf.keying_compensation,sending_type);
  tx(0);
  loop_element_lengths((2.0-(float(keyerConf.weighting)/50)),(-1.0*keyerConf.keying_compensation),sending_type);
  insert_autospace(sending_type);

  being_sent = SENDING_NOTHING;
  last_sending_type = sending_type;
  
  check_paddles();
}

void send_dah(byte sending_type) {
  being_sent = SENDING_DAH;
  tx(1);
  loop_element_lengths((float(keyerConf.dah_to_dit_ratio/100.0)*(float(keyerConf.weighting)/50)),keyerConf.keying_compensation,sending_type);
  tx(0);
  loop_element_lengths((4.0-(3.0*(float(keyerConf.weighting)/50))),(-1.0*keyerConf.keying_compensation),sending_type);
  insert_autospace(sending_type);

  check_paddles();

  being_sent = SENDING_NOTHING;
  last_sending_type = sending_type;
}

void insert_autospace(byte sending_type) {
  if ((sending_type == MANUAL_SENDING) && (keyerConf.autospace)) {
    check_paddles();
    if ((dit_buffer == 0) && (dah_buffer == 0)) {
      loop_element_lengths(2,0,sending_type);
    }
  }
}

void loop_element_lengths(float lengths, float additional_time_ms, byte sending_type){
  if (lengths <= 0) {
    return;
  }
  float element_length = 1200/keyerConf.wpm;

  unsigned long endtime = micros() + long(element_length*lengths*1000) + long(additional_time_ms*1000);
  while ((micros() < endtime) && (micros() > 200000)) {  // the second condition is to account for millis() rollover
//      if (keyerConf.keyer_mode != ULTIMATIC) {
    if ((keyerConf.keyer_mode == IAMBIC_A) && both_paddles_touched()) {
      iambic_flag = 1;
    }
    
    if (being_sent == SENDING_DIT) {
      check_dah_paddle();
    } else if (being_sent == SENDING_DAH) {
      check_dit_paddle();
    }
//      } //while ((millis() < endtime) && (millis() > 200))
      
    if (sending_type == AUTOMATIC_SENDING && (one_paddle_touched() || dit_buffer || dah_buffer)) {
      return;
    }
  }
   
  if ((keyerConf.keyer_mode == IAMBIC_A) && (iambic_flag) && !one_paddle_touched()) {
    iambic_flag = 0;
    dit_buffer = 0;
    dah_buffer = 0;
 }
} //void loop_element_lengths
