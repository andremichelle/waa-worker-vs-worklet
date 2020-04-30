const NUM_BUFFERS = 32 | 0;
const RENDER_QUANTUM = 128 | 0;

registerProcessor("push-worklet", class extends AudioWorkletProcessor {
    constructor() {
        super();

        this.ready = false;
        this.indices = null;
        this.buffer = null;
        this.readIndex = 0 | 0;
        this.port.onmessage = event => {
            const data = event.data;
            if (data.action === "init") {
                this.indices = new Int32Array(data.indices);
                this.buffer = new Float32Array(data.buffer);
                this.ready = true;
            }
        };
    }

    process(inputs, outputs) {
        if (!this.ready) {
            return true;
        }
        const channel = outputs[0][0];
        if (Atomics.load(this.indices, 1) <= this.readIndex) {
            // no audio data to read
            // nice place to detect buffer underflow
            for (let i = 0; i < RENDER_QUANTUM; i++) {
                channel[i] = 0.0;
            }
            return true;
        }
        const offset = (this.readIndex % NUM_BUFFERS) * RENDER_QUANTUM;
        for (let i = 0, j = offset; i < RENDER_QUANTUM; ++i) {
            channel[i] = this.buffer[j++];
        }
        Atomics.store(this.indices, 0, this.readIndex);
        Atomics.notify(this.indices, 0, this.readIndex);
        this.readIndex++;
        return true;
    }
});