const sampleRate = 44100;

window.onload = () => {
    const runPureWorkletTest = async () => {
        const context = new AudioContext({latencyHint: 0.09, sampleRate: sampleRate});
        const node = await context
            .audioWorklet
            .addModule("square-worklet.js")
            .then(() => {
                return new AudioWorkletNode(context, "square-worklet", {
                    numberOfInputs: 0,
                    numberOfOutputs: 1,
                    outputChannelCount: [1],
                    channelCount: 1,
                    channelCountMode: "explicit",
                    channelInterpretation: "speakers"
                });
            });
        node.connect(context.destination);
        return {
            context: context,
            setNumHarmonics: n => node.port.postMessage(n)
        };
    };
    document.querySelector("button#run-worklet-test").onclick = async () => {
        const controls = await runPureWorkletTest();
        const inputElement = document.querySelector("input");
        inputElement.oninput = () => controls.setNumHarmonics(parseInt(inputElement.value));
    };
};