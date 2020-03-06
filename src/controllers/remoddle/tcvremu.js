/* eslint-disable class-methods-use-this */
import { Bands, Modes } from '../../tcvr.js'
//import { delay } from '../../utils/time.js'

const _modes = {1: Modes.LSB, 2: Modes.USB, 3: Modes.CW, 6: Modes.RTTY, 7: Modes.CWR}

export class TcvrEmulator {

	constructor(tcvr, sendFnc) {
		this._tcvr = tcvr
		this._send = data => sendFnc(`${this.startSeq}${data}${this.endSeq}`)
	}

	/**
	 * 
	 * @param {string} str 
	 */
	handleCatCommand(str) {
		if (!str) return

		let cmd = str.trim().toUpperCase()
		if (cmd.startsWith(this.startSeq)) cmd = cmd.substring(this.startSeq.length)
		if (cmd.endsWith(this.endSeq)) cmd = cmd.substring(0, cmd.length - 1)
		if (!cmd) return

		if (cmd.length < 3) {
			console.debug(`TcvrEmulator: query=${cmd}`)
// 			await delay(300)
			if      (cmd.startsWith('FA')) this._send(`FA${this._freq}`)
			else if (cmd.startsWith('FB')) this._send(`FB${this._freqtx}`)
			else if (cmd.startsWith('FT')) this._send(`FT${this._split}`)
			else if (cmd.startsWith('MD')) this._send(`MD${this._mode}`)
			else if (cmd.startsWith('IF')) this._send(`IF${this._info}`)
			return
		}

		const p = cmd.substring(2)
		console.debug(`TcvrEmulator: cmd=${cmd} param=${p}`)
		if      (cmd.startsWith('FA')) this._freq = p
		else if (cmd.startsWith('FB')) this._freqtx = p
		else if (cmd.startsWith('FT')) this._split = p
		else if (cmd.startsWith('MD')) this._mode = p
		else if (cmd.startsWith('KY')) this._keyer = p
	}

	get _freq() {
		return this._freqcat(this._tcvr.freq)
	}

	set _freq(p) {
		// const fstr = this._stripLeadingZeros(p)
		const freq = parseInt(p, 10)
		if (Number.isNaN(freq)) return
		this._tcvr.freq = freq
		// TODO handle band change
	}

	_freqcat(freq) {
		let res = '000'
		if (freq < 10000000) res += '0'
		return res + freq
	}

	get _freqtx() {
		if (this._tcvr.split) return this._freqcat(this._tcvr.split)
		if (this._freqTX) return this._freqcat(this._freqTX)
		return this._freqcat(this._tcvr.freq)
	}

	set _freqtx(p) {
		const freq = parseInt(p, 10)
		if (Number.isNaN(freq)) return
		this._freqTX = freq
		if (this._tcvr.split) 
			this._tcvr.split = freq
	}

	get _split() {
		return this._tcvr.split ? '1' : '0'
	}

	set _split(p) {
		const enable = p && p.endsWith('1')
		if (enable) {
			if (!this._freqTX)
				this._freqTX = this._tcvr.freq
			this._tcvr.split = this._freqTX
		} else
			this._tcvr.split = 0
	}

	get _mode() {
		const current = this._tcvr.mode
		const m = Object.keys(_modes).find(key => _modes[key] === current)
		return String(m != null ? m : 2)
	}

	set _mode(p) {
		const mode = parseInt(p, 10)
		if (Number.isNaN(mode) || !Object.keys(_modes).includes(p)) return
		this._tcvr.mode = _modes[mode]
	}

	set _keyer(p) {
		// TODO
	}
	
	get _info() {
		// example: IF00007015660     -000000 0003000001 ;
		const ritfrq = String(this._tcvr.rit).padStart(4, '0')
		const ritsign = this._tcvr.rit > 0 ? '+' : '-'
		const rit = this._tcvr.rit !== 0 ? 1 : 0
		const ptt = this._tcvr.ptt ? 1 : 0
		const split = this._tcvr.split !== 0 ? 1 : 0
		return `${this._freqcat(this._tcvr.freq)}` +
			`     ${ritsign}${ritfrq}${rit}0 00${ptt}${this._mode}00${split}001 `;
	}

	get startSeq() {
		return '$'
	}

	get endSeq() {
		return ';'
	}

	// _stripLeadingZeros(str) {
	// 	let res = str
	// 	while (res.startsWith('0')) {
	// 		res = res.substring(1)
	// 	}
	// 	return res
	// }
}
