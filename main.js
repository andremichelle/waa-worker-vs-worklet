const SAMPLE_RATE_HINT = 44100;
const NUM_BUFFERS = 32;
const RENDER_QUANTUM = 128;
const DEFAULT_WORKLET_OPTIONS = {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    channelCount: 1,
    channelCountMode: "explicit",
    channelInterpretation: "speakers"
};
const loadWorker = async (url) => {
    return new Promise((resolve, error) => {
        const worker = new Worker(url);
        worker.onmessage = (event) => {
            if (event.data === "ready") {
                worker.onmessage = null;
                resolve(worker);
            } else {
                error("wrong message");
            }
        };
    });
};
const loadWorklet = async (context, url, name) => {
    return await context.audioWorklet.addModule(url)
        .then(() => new AudioWorkletNode(context, name, DEFAULT_WORKLET_OPTIONS));
};
// https://www.w3.org/TR/webaudio/#basic-waveform-phase
window.onload = () => {
    const runPureWorkletTest = async () => {
        const context = new AudioContext({latencyHint: 0.09, sampleRate: SAMPLE_RATE_HINT});
        console.log(context.baseLatency, context.outputLatency);
        const node = await loadWorklet(context, "square-worklet.js", "square-worklet");
        node.connect(context.destination);
        return {
            context: context,
            setNumHarmonics: n => node.port.postMessage(n)
        };
    };

    const runWorkerWorkletTest = async () => {
        const context = new AudioContext({latencyHint: 0.0, sampleRate: SAMPLE_RATE_HINT});
        const worker = await loadWorker("square-worker.js");
        const indices = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2); // read / write index
        const buffer = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * RENDER_QUANTUM * NUM_BUFFERS);
        worker.postMessage({
            action: "init",
            indices: indices,
            buffer: buffer,
            sampleRate: context.sampleRate
        });

        const node = await loadWorklet(context, "push-worklet.js", "push-worklet");
        node.port.postMessage({
            action: "init",
            indices: indices,
            buffer: buffer
        });
        node.connect(context.destination);
        return {
            context: context,
            setNumHarmonics: n => {
                worker.postMessage({action: "set-num-harmonics", value: n});
            }
        }
    };

    document.querySelector("button#run-worklet-test").onclick = async () => {
        const controls = await runPureWorkletTest();
        const inputElement = document.querySelector("input");
        inputElement.oninput = () => controls.setNumHarmonics(parseInt(inputElement.value));
    };

    document.querySelector("button#run-worker-test").onclick = async () => {
        const controls = await runWorkerWorkletTest();
        const inputElement = document.querySelector("input");
        inputElement.oninput = () => controls.setNumHarmonics(parseInt(inputElement.value));
    };
};