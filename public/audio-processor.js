class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.silenceThreshold = 0.01;
    this.silenceFrames = 0;
    this.silenceFramesRequired = 48; // ~1 second at 16kHz with 4096 buffer
    this.isSpeaking = false;
    this.frameCount = 0;
    console.log('[AudioProcessor] Initialized - Silence threshold:', this.silenceThreshold);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) {
      return true;
    }

    const inputData = input[0];
    
    // Convert Float32 to Int16
    const int16 = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      int16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
    }

    // Calculate RMS for voice activity detection
    let sum = 0;
    for (let i = 0; i < inputData.length; i++) {
      sum += inputData[i] * inputData[i];
    }
    const rms = Math.sqrt(sum / inputData.length);

    // Voice Activity Detection
    this.frameCount++;
    if (rms > this.silenceThreshold) {
      this.silenceFrames = 0;
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        console.log('[AudioProcessor] Speech detected! RMS:', rms.toFixed(4));
        this.port.postMessage({ type: 'speech-start' });
      }
    } else {
      this.silenceFrames++;
      if (this.isSpeaking && this.silenceFrames >= this.silenceFramesRequired) {
        this.isSpeaking = false;
        console.log('[AudioProcessor] Speech ended after', this.silenceFrames, 'silent frames');
        this.port.postMessage({ type: 'speech-end' });
      }
    }

    // Log RMS every 100 frames for monitoring
    if (this.frameCount % 100 === 0) {
      console.log('[AudioProcessor] RMS:', rms.toFixed(4), '| Speaking:', this.isSpeaking, '| Silent frames:', this.silenceFrames);
    }

    // Send audio data
    this.port.postMessage({
      type: 'audio-data',
      data: int16,
      isSpeaking: this.isSpeaking
    });

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
