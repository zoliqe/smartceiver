//#define PIN_DDS_CLK			7
//#define PIN_DDS_UPDATE		6
//#define PIN_DDS_DATA		5
#define PIN_BPF_S0			8
#define PIN_BPF_S1			9
//#define PIN_BPF_S2			10
//#define PIN_BPF_S3			11
#define PIN_SIDETONE		A0 //14
#define PIN_ATTN			10
#define PIN_PTT				11
#define PIN_KEY				12
#define PIN_LED				13
#define PIN_MAXPWR			4
#define PIN_PADDLE_LEFT		0/*2*/
#define PIN_PADDLE_RIGHT	1/*3*/

//#define PIN_XFIL			A5
//#define PIN_BATTERY			A1
//#define PIN_PWR_FWD			A2
//#define PIN_PWR_REV			A3

// define Si5351 outputs function
#define RXLO       OUTPUT_CLK0
#define TXLO       OUTPUT_CLK1 & RXLO
//#define BFO      OUTPUT_CLK2


