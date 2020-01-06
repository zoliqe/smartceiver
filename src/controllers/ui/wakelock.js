export class WakeLock {

	constructor() {
		this._supported = 'wakeLock' in navigator && 'request' in navigator.wakeLock
		this._wakeLock = null
		this._state = false

		if (this.supported) {
			document.addEventListener('visibilitychange', () => this._requestWakeLock())
			// document.addEventListener('fullscreenchange', () => this._requestWakeLock())
		}
	}

	get supported() {
		return this._supported
	}

	async changeState(state) {
		if (!this.supported) return
		this._state = state
		
		if (state && this._wakeLock == null) {
			await this._requestWakeLock()
		} else if (!state && this._wakeLock != null) {
			this._wakeLock.release()
			this._wakeLock = null
		}
	}

	_handleVisibilityChange() {    
    if (document.visibilityState === 'visible') {
      this._requestWakeLock()
    }
  }

	async _requestWakeLock() {
		if (document.visibilityState !== 'visible' || !this._state) return

    try {
      this._wakeLock = await navigator.wakeLock.request('screen')
      this._wakeLock.addEventListener('release', () => {
        console.info('WakeLock was released')
      })
      console.info('WakeLock is active')
    } catch (e) {      
      console.error(`WakeLock error: ${e.name}, ${e.message}`);
    }
	}
}
