#define STRAIGHT 0
#define IAMBIC_B 1
#define IAMBIC_A 2
#define SENDING_NOTHING 0
#define SENDING_DIT		1
#define SENDING_DAH 	2
#define AUTOMATIC_SENDING 0
#define MANUAL_SENDING 1
#define SIDETONE_HZ_LOW_LIMIT 299
#define SIDETONE_HZ_HIGH_LIMIT 2001
#define WPM_MIN 12
#define WPM_MAX 40
#define RATIO_MIN 150
#define RATIO_MAX 810

// Variables and stuff
struct keyer_config_t {
  byte         wpm;                 // KS.
  bool         reverse_paddle;      // KP.
  byte         keyer_mode;          // KM.
  unsigned int sidetone;            // KH.
  unsigned int dah_to_dit_ratio;    // KR.
  byte         length_wordspace;    // SW
  byte         length_letterspace;  // SL
  bool         autospace;           // KA.
  unsigned int ptt_tail_time;       // PT
  unsigned int ptt_lead_time;       // PL
  byte         weighting;           // KW
  byte         keying_compensation; // KC number of milliseconds to extend all dits and dahs - for QSK on boatanchors
  bool         tx_enabled;          // KE. 0 = tx_key_line control suppressed
//  byte         first_extension_time;// KE number of milliseconds to extend first sent dit or dah
} keyerConf;

byte dit_buffer = 0;     // used for buffering paddle hits in iambic operation
byte dah_buffer = 0;     // used for buffering paddle hits in iambic operation
byte being_sent = 0;     // SENDING_NOTHING, SENDING_DIT, SENDING_DAH
byte keyed = 0;          // RX,TX,TQ; 0 = key up, 1 = key down
unsigned long ptt_time = 0;
byte ptt_active = 0;
byte last_sending_type = MANUAL_SENDING;
byte iambic_flag = 0;

//byte send_buffer_array[255];
//byte send_buffer_bytes = 0;
