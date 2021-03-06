const RENDER_QUANTUM = 128 | 0;

const waveform = (phase, n) => {
    let out = 0.0;
    for (let j = 1; j <= n; j += 2) {
        out += Math.sin(phase * j * 2.0 * Math.PI) * (2.0 / (j * Math.PI));
    }
    return out * 0.5;
};

registerProcessor("square-worklet", class extends AudioWorkletProcessor {
    constructor() {
        super();

        this.frequency = 60.0;
        this.maxHarmonics = Math.floor((sampleRate / 2) / this.frequency);
        this.numHarmonics = 1;
        this.phase = 0.0;

        console.log(`Worklet sampleRate: ${sampleRate}, maxHarmonics: ${this.maxHarmonics}`);

        this.port.onmessage = event => this.numHarmonics = Math.min(this.maxHarmonics, event.data);
    }

    process(inputs, outputs) {
        const channel = outputs[0][0];
        for (let i = 0; i < RENDER_QUANTUM; i++) {
            channel[i] = waveform(this.phase, this.numHarmonics);
            this.phase += this.frequency / sampleRate;
        }
        return true;
    }
});