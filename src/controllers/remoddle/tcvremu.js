import { Bands, Modes } from '../../tcvr.js'

const _modes = {
	1: Modes.LSB,
	2: Modes.USB,
	3: Modes.CW,
	6: Modes.RTTY,
	7: Modes.CWR,
}

export class TcvrEmulator {

	constructor(tcvr) {
		this._tcvr = tcvr
	}

	/**
	 * 
	 * @param {string} str 
	 */
	handleCatCommand(str) {
		if (!str) return

		let cmd = str.trim().toUpperCase()
		if (cmd.startsWith(this.startSeq)) cmd = cmd.substring(this.startSeq.length)
		if (cmd.endsWith(this.endSeq)) cmd = cmd.substring(0, cmd.length)

		const p = cmd.substring(2)
		console.debug(`TcvrEmulator: cmd=${cmd} param=${p}`)
		if (cmd.startsWith('FA')) this._freq(p)
		else if (cmd.startsWith('FB')) this._split(p)
		else if (cmd.startsWith('MD')) this._mode(p)
		else if (cmd.startsWith('KY')) this._keyer(p)
	}

	_freq(p) {
		// const fstr = this._stripLeadingZeros(p)
		const freq = parseInt(p)
		if (isNaN(freq)) return
		this._tcvr.freq = freq
		// TODO handle band change
	}

	_split(p) {
		// TODO
	}

	_mode(p) {
		const mode = parseInt(p)
		if (isNaN(mode) || !Object.keys(_modes).includes(mode)) return
		this._tcvr.mode = _modes[mode]
	}

	_keyer(p) {
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
