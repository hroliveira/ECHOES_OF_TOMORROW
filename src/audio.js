// Generative audio system for Echoes of Tomorrow
// Creates an evolving soundscape that responds to player movement and environment

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.masterGain = null;

    // Audio nodes
    this.droneNodes = [];
    this.moveOsc = null;
    this.moveGain = null;
    this.noiseNode = null;
    this.noiseGain = null;
    this.heartNode = null;
    this.heartGain = null;

    // State
    this.movementSpeed = 0;
    this.echoAlignment = 0;
    this.isMeditating = false;
    this.bookFrequencies = {
      physics: 220,
      poetry: 440,
      history: 330,
      fiction: 554.37,
      philosophy: 660,
      fantasy: 880,
      science: 550,
      art: 770
    };
  }

  init() {
    if (this.initialized) return;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);

      this.createDrone();
      this.createMovementOscillator();
      this.createWhiteNoise();
      this.createHeartBeat();
      this.initialized = true;
    } catch (e) {
      console.warn('Audio init failed:', e);
    }
  }

  resume() {
    let prom = Promise.resolve();
    if (this.ctx && this.ctx.state === 'suspended') {
      prom = this.ctx.resume();
    }
    this.init();
    return prom;
  }

  // --- AMBIENT DRONE ---
  createDrone() {
    // Two detuned oscillators for a rich, evolving drone
    const frequencies = [65.41, 98, 130.81]; // C2, G2, C3
    const detuneAmount = [0, 5, -3];

    for (let i = 0; i < frequencies.length; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = frequencies[i];
      osc.detune.value = detuneAmount[i];

      const gain = this.ctx.createGain();
      gain.gain.value = 0.04;

      // Slow modulation for organic feel
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + Math.random() * 0.1;

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.02;

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.droneNodes.push({ osc, gain, lfo, lfoGain });
    }

    // Sub-bass drone
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 32.7; // C1

    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.06;

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start();

    this.subDrone = { osc: subOsc, gain: subGain };
  }

  // --- MOVEMENT REACTIVE ---
  createMovementOscillator() {
    // Rhythmic pulse that responds to movement
    this.moveOsc = this.ctx.createOscillator();
    this.moveOsc.type = 'triangle';
    this.moveOsc.frequency.value = 80;

    this.moveGain = this.ctx.createGain();
    this.moveGain.gain.value = 0;

    // Envelope follower
    this.moveEnv = this.ctx.createGain();
    this.moveEnv.gain.value = 0;

    this.moveOsc.connect(this.moveGain);
    this.moveGain.connect(this.moveEnv);
    this.moveEnv.connect(this.masterGain);
    this.moveOsc.start();
  }

  // --- WHITE NOISE (Silêncio Branco) ---
  createWhiteNoise() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    // Filter the noise to make it less harsh
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2500;
    noiseFilter.Q.value = 0.5;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;

    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    this.noiseNode.start();

    // LFO to modulate noise character
    const noiseLfo = this.ctx.createOscillator();
    noiseLfo.type = 'sine';
    noiseLfo.frequency.value = 0.2;

    const noiseLfoGain = this.ctx.createGain();
    noiseLfoGain.gain.value = 500;

    noiseLfo.connect(noiseLfoGain);
    noiseLfoGain.connect(noiseFilter.frequency);
    noiseLfo.start();

    this.noiseLfo = noiseLfo;
    this.noiseFilter = noiseFilter;
  }

  // --- HEARTBEAT (ambient pulse) ---
  createHeartBeat() {
    this.heartOsc = this.ctx.createOscillator();
    this.heartOsc.type = 'sine';
    this.heartOsc.frequency.value = 60;

    this.heartGain = this.ctx.createGain();
    this.heartGain.gain.value = 0;

    this.heartOsc.connect(this.heartGain);
    this.heartGain.connect(this.masterGain);
    this.heartOsc.start();
  }

  // --- UPDATE (called every frame) ---
  update(time, delta, movementSpeed, echoAlignment) {
    if (!this.initialized || !this.ctx) return;

    this.movementSpeed = movementSpeed;
    this.echoAlignment = echoAlignment;

    const now = this.ctx.currentTime;
    const speed = movementSpeed;

    // Drone - modulate filter and volume based on echo alignment
    for (const node of this.droneNodes) {
      // Higher alignment = richer drone
      const targetGain = 0.02 + echoAlignment * 0.04;
      node.gain.gain.linearRampToValueAtTime(targetGain, now + 0.5);
    }

    if (this.subDrone) {
      const subTarget = 0.02 + echoAlignment * 0.06;
      this.subDrone.gain.gain.linearRampToValueAtTime(subTarget, now + 0.5);
    }

    // Movement reactive pulse
    if (this.moveGain && this.moveEnv) {
      // Pulse rate increases with speed
      const freqTarget = 60 + speed * 15;
      this.moveOsc.frequency.linearRampToValueAtTime(freqTarget, now + 0.1);

      // Volume follows speed with attack/release
      const volTarget = Math.min(0.08, speed * 0.02);
      this.moveGain.gain.linearRampToValueAtTime(volTarget, now + 0.05);

      // Rhythmic pulsing
      const pulseFreq = 2 + speed * 0.5;
      const pulse = Math.sin(time * 0.001 * pulseFreq * Math.PI * 2) * 0.5 + 0.5;
      this.moveEnv.gain.value = pulse * volTarget * 2;
    }

    // White noise — inversely proportional to echo alignment
    if (this.noiseGain) {
      // High alignment = low noise (the "silence" fades when in sync)
      const noiseTarget = Math.max(0, 0.15 * (1 - echoAlignment * 1.5));
      this.noiseGain.gain.linearRampToValueAtTime(noiseTarget, now + 0.3);

      // Shift noise frequency based on alignment
      if (this.noiseFilter) {
        const filterFreq = 1500 + echoAlignment * 2000;
        this.noiseFilter.frequency.linearRampToValueAtTime(filterFreq, now + 0.5);
      }
    }

    // Heartbeat — slows down with meditation, speeds up with movement
    if (this.heartGain) {
      const baseRate = 0.8;
      const moveRate = speed * 0.1;
      const medRate = this.isMeditating ? -0.4 : 0;
      const rate = Math.max(0.3, baseRate + moveRate + medRate);

      // Pulse every 'rate' seconds
      const beatPhase = (now % rate) / rate;
      const beat = Math.sin(beatPhase * Math.PI);
      const vol = Math.max(0, beat) * 0.06;

      this.heartGain.gain.value = vol;
    }
  }

  // --- PLAY BOOK FREQUENCY ---
  playBookSound(category) {
    if (!this.initialized || !this.ctx) return;

    const freq = this.bookFrequencies[category] || 440;
    const now = this.ctx.currentTime;

    // Create a bell-like tone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    // Add harmonics for richness
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2.01;

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.03, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    // Reverb-like effect using delay
    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.3;

    const delayGain = this.ctx.createGain();
    delayGain.gain.setValueAtTime(0.15, now);
    delayGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this.masterGain);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 2.5);
    osc2.start(now);
    osc2.stop(now + 2.0);

    // Visual feedback - briefly increase the master volume for impact
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.35, now + 0.05);
    this.masterGain.gain.linearRampToValueAtTime(0.3, now + 0.3);
  }

  // --- MEDITATION MODE ---
  enterMeditation() {
    this.isMeditating = true;
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Slowly evolve the drone
    for (const node of this.droneNodes) {
      const targetFreq = node.osc.frequency.value * (0.95 + Math.random() * 0.1);
      node.osc.frequency.linearRampToValueAtTime(targetFreq, now + 3);
    }
  }

  exitMeditation() {
    this.isMeditating = false;
  }

  // --- SET WHITE NOISE VOLUME DIRECTLY ---
  setNoiseVolume(volume) {
    if (this.noiseGain && this.ctx) {
      this.noiseGain.gain.linearRampToValueAtTime(
        volume * 0.15,
        this.ctx.currentTime + 0.3
      );
    }
  }
}
