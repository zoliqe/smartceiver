/* eslint-disable class-methods-use-this */
import { Bands, Modes } from '../../tcvr.js'

const _modes = [null, Modes.LSB, Modes.USB, Modes.CW, null, null, Modes.RTTY, Modes.CWR]

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
			if (cmd.startsWith('FA')) this._send(`FA${this._freq}`)
			else if (cmd.startsWith('FB')) this._send(`FB${this._split}`)
			else if (cmd.startsWith('MD')) this._send(`MD${this._mode}`)
			return
		}

		const p = cmd.substring(2)
		console.debug(`TcvrEmulator: cmd=${cmd} param=${p}`)
		if (cmd.startsWith('FA')) this._freq = p
		else if (cmd.startsWith('FB')) this._split = p
		else if (cmd.startsWith('MD')) this._mode = p
		else if (cmd.startsWith('KY')) this._keyer = p
	}

	get _freq() {
		return this._freqcat(this._tcvr.freq)
	}

	_freqcat(freq) {
		let res = '000'
		if (freq < 10000000) res += '0'
		return res + freq
	}

	get _split() {
		return this._tcvr.split ? this._freqcat(this._tcvr.split) : this._freqcat(this._tcvr.freq)
	}

	get _mode() {
		const m = _modes.indexOf(this._tcvr.mode)
		return String(m < 0 ? 2 : m)
	}

	set _freq(p) {
		// const fstr = this._stripLeadingZeros(p)
		const freq = parseInt(p, 10)
		if (Number.isNaN(freq)) return
		this._tcvr.freq = freq
		// TODO handle band change
	}

	set _split(p) {
		const split = parseInt(p, 10)
		if (Number.isNaN(split)) return
		this._tcvr.split = split
		// TODO handle split cancelation
	}

	set _mode(p) {
		const mode = parseInt(p, 10)
		if (Number.isNaN(mode) || !Object.keys(_modes).includes(mode)) return
		this._tcvr.mode = _modes[mode]
	}

	set _keyer(p) {
		// TODO
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
