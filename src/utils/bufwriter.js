class BufferedWriter {
    #buffer = []
    #state = false
    #writer

    constructor(writerMethod) {
        this.#writer = async data => { data != null && (await writerMethod(data)) }
    }

    async write(data) {
        let len = this.#buffer.push(data)
        if (this.#state) return

        this.#state = true
        while (len) {
            await this.#writer(this.#buffer.shift())
            len = this.#buffer.length
        }
        this.#state = false
    }
}

export {BufferedWriter}
