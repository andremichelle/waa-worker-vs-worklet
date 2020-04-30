const NUM_BUFFERS = 32 | 0;
const RENDER_QUANTUM = 128 | 0;

let indices = null;
let buffer = null;
let writeIndex = 0 | 0;

let sampleRate = NaN;
let frequency = 60.0;
let maxHarmonics = NaN;
let numHarmonics = 300;
let phase = 0.0;

const waveform = phase => {
    let out = 0.0;
    for (let k = 0; k < 6; k++) {
        for (let j = 1; j <= numHarmonics; j += 2) {
            out += Math.sin(phase * j * 2.0 * Math.PI) * (2.0 / (j * Math.PI));
        }
    }
    return out * 0.1;
};

const render = () => {
    const readIndex = Atomics.load(indices, 0);
    if (readIndex + NUM_BUFFERS < writeIndex) {
        Atomics.wait(indices, 0, readIndex, 100); // wait for playback
        if (indices[0] !== readIndex) {
            setTimeout(timeoutRender, 1000);
            return;
        }
    }
    let count = 0;
    while (Atomics.load(indices, 0) + NUM_BUFFERS >= writeIndex) { // render towards play-head
        const offset = (writeIndex % NUM_BUFFERS) * RENDER_QUANTUM;
        for (let i = 0; i < RENDER_QUANTUM; i++) {
            buffer[i + offset] = waveform(phase);
            phase += frequency / sampleRate;
        }
        Atomics.store(indices, 1, ++writeIndex);
        if (++count === NUM_BUFFERS) { // avoid endless loop
            break;
        }
    }
    setTimeout(timeoutRender, 0);
};
const timeoutRender = () => render();

onmessage = event => {
    const data = event.data;
    if (data.action === "init") {
        indices = new Int32Array(data.indices);
        buffer = new Float32Array(data.buffer);
        sampleRate = data.sampleRate;
        maxHarmonics = Math.floor((sampleRate / 2) / frequency);
        console.log(`Worker sampleRate: ${sampleRate}, maxHarmonics: ${maxHarmonics}, indices: ${indices.length}, buffer: ${buffer.length}`);
        render();
    } else if (data.action === "set-num-harmonics") {
        numHarmonics = Math.min(maxHarmonics, data.value);
        console.log(`set numHarmonics: ${numHarmonics}`);
    }
};

postMessage("ready");