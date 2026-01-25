class PCMProcessor extends AudioWorkletProcessor {
    process(inputs) {
      const input = inputs[0];
      if (!input || !input[0]) return true;
  
      const samples = input[0];
      const pcm = new Int16Array(samples.length);
  
      for (let i = 0; i < samples.length; i++) {
        pcm[i] = Math.max(-1, Math.min(1, samples[i])) * 0x7fff;
      }
  
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
      return true;
    }
  }
  
  registerProcessor('pcm-processor', PCMProcessor);
  