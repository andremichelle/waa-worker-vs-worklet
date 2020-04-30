registerProcessor("square-worklet", class extends AudioWorkletProcessor {
    constructor() {
        super();

        this.frequency = 60.0;
        this.maxHarmonics = Math.floor((sampleRate / 2) / this.frequency);
        this.numHarmonics = 1;
        this.phase = 0.0;

        this.port.onmessage = event => this.numHarmonics = Math.min(this.maxHarmonics, event.data);
    }

    process(inputs, outputs) {
        const channel = outputs[0][0];
        for (let i = 0; i < 128; i++) {
            let out = 0.0;
            for (let j = 1; j <= this.numHarmonics; j++) {
                const b = 2.0 / (j * Math.PI) * (j & 1) * 2;
                out += Math.sin(this.phase * j * 2.0 * Math.PI) * b;
            }
            channel[i] = out * 0.5;
            this.phase += this.frequency / sampleRate;
        }
        return true;
    }
});