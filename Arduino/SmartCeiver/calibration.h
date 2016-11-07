typedef enum {RX = 0, TX = 1, BFO = 2} OscType;

const uint32_t correctTX7 = -130;
const uint32_t correctRX7 = -3600;

//#define BAND_1_8	0
//#define BAND_3_5	1
//#define BAND_5		2
//#define BAND_7		3
//#define BAND_10_1	4
//#define BAND_14		5
//#define BAND_18		6
//#define BAND_21		7
//#define BAND_24		8
//#define BAND_28		9

// freq of measured calibration
//unsigned long calibration_freq[] = {
// 1850000,
// 3550000,
// 5050000,
// 7030000,
//10120000,
//14030000,
//18100000,
//21000000,
//24900000,
//28050000
//};
//calibration_freq[BAND_1_8]  =  1850000;
//calibration_freq[BAND_3_5]  =  3550000;
//calibration_freq[BAND_5]    =  5050000;
//calibration_freq[BAND_7]    =  7030000;
//calibration_freq[BAND_10_1] = 10120000;
//calibration_freq[BAND_14]   = 14030000;
//calibration_freq[BAND_18]   = 18100000;
//calibration_freq[BAND_21]   = 21000000;
//calibration_freq[BAND_24]   = 24900000;
//calibration_freq[BAND_28]   = 28050000;

// freq correction (+/-) in Hz per band
//int freq_correction[sizeof(calibration_freq)] = {
//0, // 1.8
//0, // 3.5
//0, // 5
//-600, // 7
//0, // 10.1
//0, // 14
//0, // 18
//0, // 21
//0, // 24
//0 // 28
//};
//int freq_correction[BAND_28+1];
//freq_correction[BAND_1_8]  = 0;
//freq_correction[BAND_3_5]  = 0;
//freq_correction[BAND_5]    = 0;
//freq_correction[BAND_7]    = -600;
//freq_correction[BAND_10_1] = 0;
//freq_correction[BAND_14]   = 0;
//freq_correction[BAND_18]   = 0;
//freq_correction[BAND_21]   = 0;
//freq_correction[BAND_24]   = 0;
//freq_correction[BAND_28]   = 0;
