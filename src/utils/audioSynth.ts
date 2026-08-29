// Web Audio API ambient tone, acoustic therapy & podcast narration generator
import { SynthType } from '../types';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private activeNodes: {
    [key: string]: {
      oscs: (OscillatorNode | AudioBufferSourceNode)[];
      gain: GainNode;
      filter?: BiquadFilterNode;
      timer?: number;
      intervalIds?: number[];
    };
  } = {};

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play a soft notification tone
  playNotification() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext blocked or not supported
    }
  }

  // Play a subtle haptic click
  playClick() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // Ignore
    }
  }

  // Play a soft chime for breathing / check-ins
  playChime(freq = 528, duration = 1.8) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext blocked or not supported
    }
  }

  // Play Tibetan Singing Bowl resonance with multi-harmonics
  playTibetanBowl(baseFreq = 174) {
    try {
      const ctx = this.getContext();
      const harmonics = [1, 2.76, 5.4, 8.1];
      const gains = [0.25, 0.12, 0.05, 0.02];

      harmonics.forEach((h, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * h, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(gains[i], ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 5.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 5.0);
      });
    } catch {
      // Ignore
    }
  }

  // Helper to build a loopable colored noise buffer
  private createNoiseBuffer(ctx: AudioContext, type: 'pink' | 'white' | 'brown' = 'pink'): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
    } else {
      // Brown noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }
    return noiseBuffer;
  }

  // Continuous Ambient Soundscapes for each unique SynthType
  async startAmbient(type: SynthType | string, key = 'ambient') {
    this.stopAmbient(key);
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const sources: (OscillatorNode | AudioBufferSourceNode)[] = [];
      const intervals: number[] = [];

      switch (type) {
        // 1. 432Hz Bình Yên & Sóng Biển Hoàng Hôn
        case 'ocean':
        case '432Hz':
        case 'stressRelief': {
          const noiseSrc = ctx.createBufferSource();
          noiseSrc.buffer = this.createNoiseBuffer(ctx, 'brown');
          noiseSrc.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(320, ctx.currentTime);

          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(200, ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);

          noiseSrc.connect(filter);
          filter.connect(masterGain);

          const tone432 = ctx.createOscillator();
          tone432.type = 'sine';
          tone432.frequency.setValueAtTime(432, ctx.currentTime);
          const toneGain = ctx.createGain();
          toneGain.gain.value = 0.045;
          tone432.connect(toneGain);
          toneGain.connect(masterGain);

          lfo.start();
          noiseSrc.start();
          tone432.start();
          sources.push(lfo, noiseSrc, tone432);
          break;
        }

        // 2. 528Hz Tái Tạo Năng Lượng & Suối Rừng Tre
        case 'solfeggio528': {
          const osc528 = ctx.createOscillator();
          osc528.type = 'sine';
          osc528.frequency.setValueAtTime(528, ctx.currentTime);
          const g528 = ctx.createGain();
          g528.gain.value = 0.05;
          osc528.connect(g528);
          g528.connect(masterGain);
          osc528.start();
          sources.push(osc528);

          const osc1056 = ctx.createOscillator();
          osc1056.type = 'triangle';
          osc1056.frequency.setValueAtTime(1056, ctx.currentTime);
          const g1056 = ctx.createGain();
          g1056.gain.value = 0.015;
          osc1056.connect(g1056);
          g1056.connect(masterGain);
          osc1056.start();
          sources.push(osc1056);

          const streamSrc = ctx.createBufferSource();
          streamSrc.buffer = this.createNoiseBuffer(ctx, 'pink');
          streamSrc.loop = true;
          const bandFilter = ctx.createBiquadFilter();
          bandFilter.type = 'bandpass';
          bandFilter.frequency.setValueAtTime(750, ctx.currentTime);
          bandFilter.Q.setValueAtTime(1.5, ctx.currentTime);
          streamSrc.connect(bandFilter);
          bandFilter.connect(masterGain);
          streamSrc.start();
          sources.push(streamSrc);

          const chimeTimer = window.setInterval(() => {
            try {
              const chimeFreqs = [528, 792, 1056, 1320];
              const f = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
              const chimeOsc = ctx.createOscillator();
              const cg = ctx.createGain();
              chimeOsc.type = 'sine';
              chimeOsc.frequency.setValueAtTime(f, ctx.currentTime);
              cg.gain.setValueAtTime(0.001, ctx.currentTime);
              cg.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.04);
              cg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);
              chimeOsc.connect(cg);
              cg.connect(masterGain);
              chimeOsc.start();
              chimeOsc.stop(ctx.currentTime + 2.2);
            } catch {}
          }, 3500);
          intervals.push(chimeTimer);
          break;
        }

        // 3. 396Hz Gió Đỉnh Núi Mờ Sương & Đàn Cầm
        case 'solfeggio396': {
          const osc396 = ctx.createOscillator();
          osc396.type = 'sine';
          osc396.frequency.setValueAtTime(396, ctx.currentTime);
          const g396 = ctx.createGain();
          g396.gain.value = 0.06;
          osc396.connect(g396);
          g396.connect(masterGain);
          osc396.start();
          sources.push(osc396);

          const windSrc = ctx.createBufferSource();
          windSrc.buffer = this.createNoiseBuffer(ctx, 'pink');
          windSrc.loop = true;
          const windFilter = ctx.createBiquadFilter();
          windFilter.type = 'bandpass';
          windFilter.frequency.setValueAtTime(450, ctx.currentTime);
          windFilter.Q.setValueAtTime(4.0, ctx.currentTime);

          const windLfo = ctx.createOscillator();
          windLfo.frequency.setValueAtTime(0.08, ctx.currentTime);
          const windLfoGain = ctx.createGain();
          windLfoGain.gain.setValueAtTime(250, ctx.currentTime);
          windLfo.connect(windLfoGain);
          windLfoGain.connect(windFilter.frequency);

          windSrc.connect(windFilter);
          windFilter.connect(masterGain);
          windLfo.start();
          windSrc.start();
          sources.push(windLfo, windSrc);

          const harpNotes = [396, 440, 528, 594, 660];
          let noteIdx = 0;
          const harpTimer = window.setInterval(() => {
            try {
              const note = harpNotes[noteIdx % harpNotes.length];
              noteIdx++;
              const hOsc = ctx.createOscillator();
              const hGain = ctx.createGain();
              hOsc.type = 'triangle';
              hOsc.frequency.setValueAtTime(note, ctx.currentTime);
              hGain.gain.setValueAtTime(0.001, ctx.currentTime);
              hGain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.02);
              hGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.0);
              hOsc.connect(hGain);
              hGain.connect(masterGain);
              hOsc.start();
              hOsc.stop(ctx.currentTime + 3.0);
            } catch {}
          }, 2400);
          intervals.push(harpTimer);
          break;
        }

        // 4. White Noise Mưa Rào Xoa Dịu Trên Mái Hiên
        case 'rain': {
          const rainSrc = ctx.createBufferSource();
          rainSrc.buffer = this.createNoiseBuffer(ctx, 'pink');
          rainSrc.loop = true;
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(950, ctx.currentTime);
          rainSrc.connect(filter);
          filter.connect(masterGain);
          rainSrc.start();
          sources.push(rainSrc);

          const dropTimer = window.setInterval(() => {
            try {
              const dropOsc = ctx.createOscillator();
              const dropGain = ctx.createGain();
              dropOsc.type = 'sine';
              dropOsc.frequency.setValueAtTime(800 + Math.random() * 600, ctx.currentTime);
              dropGain.gain.setValueAtTime(0.001, ctx.currentTime);
              dropGain.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 0.01);
              dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
              dropOsc.connect(dropGain);
              dropGain.connect(masterGain);
              dropOsc.start();
              dropOsc.stop(ctx.currentTime + 0.08);
            } catch {}
          }, 350);
          intervals.push(dropTimer);
          break;
        }

        // 5. 2Hz Sóng Não Delta & Tiếng Mưa Đêm
        case 'deltaSleep': {
          const oscL = ctx.createOscillator();
          const oscR = ctx.createOscillator();
          oscL.type = 'sine';
          oscL.frequency.setValueAtTime(100, ctx.currentTime);
          oscR.type = 'sine';
          oscR.frequency.setValueAtTime(102, ctx.currentTime);

          const gL = ctx.createGain();
          const gR = ctx.createGain();
          gL.gain.value = 0.08;
          gR.gain.value = 0.08;

          oscL.connect(gL);
          oscR.connect(gR);
          gL.connect(masterGain);
          gR.connect(masterGain);

          oscL.start();
          oscR.start();
          sources.push(oscL, oscR);

          const nightRain = ctx.createBufferSource();
          nightRain.buffer = this.createNoiseBuffer(ctx, 'brown');
          nightRain.loop = true;
          const lowFilter = ctx.createBiquadFilter();
          lowFilter.type = 'lowpass';
          lowFilter.frequency.setValueAtTime(420, ctx.currentTime);
          nightRain.connect(lowFilter);
          lowFilter.connect(masterGain);
          nightRain.start();
          sources.push(nightRain);
          break;
        }

        // 6. Pink Noise Lửa Trại Đêm Trong Rừng Thông
        case 'campfire': {
          const pinkSrc = ctx.createBufferSource();
          pinkSrc.buffer = this.createNoiseBuffer(ctx, 'pink');
          pinkSrc.loop = true;
          const pinkFilter = ctx.createBiquadFilter();
          pinkFilter.type = 'lowpass';
          pinkFilter.frequency.setValueAtTime(300, ctx.currentTime);
          pinkSrc.connect(pinkFilter);
          pinkFilter.connect(masterGain);
          pinkSrc.start();
          sources.push(pinkSrc);

          const celloOsc = ctx.createOscillator();
          celloOsc.type = 'sawtooth';
          celloOsc.frequency.setValueAtTime(110, ctx.currentTime);
          const celloFilter = ctx.createBiquadFilter();
          celloFilter.type = 'lowpass';
          celloFilter.frequency.setValueAtTime(220, ctx.currentTime);
          const celloGain = ctx.createGain();
          celloGain.gain.value = 0.035;
          celloOsc.connect(celloFilter);
          celloFilter.connect(celloGain);
          celloGain.connect(masterGain);
          celloOsc.start();
          sources.push(celloOsc);

          const crackleTimer = window.setInterval(() => {
            try {
              const crackle = ctx.createBufferSource();
              crackle.buffer = this.createNoiseBuffer(ctx, 'white');
              const cf = ctx.createBiquadFilter();
              cf.type = 'highpass';
              cf.frequency.setValueAtTime(1500, ctx.currentTime);
              const cg = ctx.createGain();
              cg.gain.setValueAtTime(0.001, ctx.currentTime);
              cg.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.005);
              cg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
              crackle.connect(cf);
              cf.connect(cg);
              cg.connect(masterGain);
              crackle.start();
              crackle.stop(ctx.currentTime + 0.04);
            } catch {}
          }, 450);
          intervals.push(crackleTimer);
          break;
        }

        // 7. 0.5Hz Sóng Não Delta Phục Hồi Thần Kinh
        case 'deltaDeep05': {
          const bassDrone = ctx.createOscillator();
          bassDrone.type = 'sine';
          bassDrone.frequency.setValueAtTime(65, ctx.currentTime);

          const pulseLfo = ctx.createOscillator();
          pulseLfo.type = 'sine';
          pulseLfo.frequency.setValueAtTime(0.5, ctx.currentTime);
          const modGain = ctx.createGain();
          modGain.gain.value = 0.08;

          pulseLfo.connect(modGain.gain);
          bassDrone.connect(modGain);
          modGain.connect(masterGain);

          pulseLfo.start();
          bassDrone.start();
          sources.push(pulseLfo, bassDrone);
          break;
        }

        // 8. Hồ Nước Đêm Trăng & Tiếng Dế Kêu
        case 'cricketsNight': {
          const waterSrc = ctx.createBufferSource();
          waterSrc.buffer = this.createNoiseBuffer(ctx, 'brown');
          waterSrc.loop = true;
          const waterFilt = ctx.createBiquadFilter();
          waterFilt.type = 'lowpass';
          waterFilt.frequency.setValueAtTime(260, ctx.currentTime);
          waterSrc.connect(waterFilt);
          waterFilt.connect(masterGain);
          waterSrc.start();
          sources.push(waterSrc);

          const cricketTimer = window.setInterval(() => {
            try {
              const carrier = ctx.createOscillator();
              carrier.type = 'sine';
              carrier.frequency.setValueAtTime(4600 + Math.random() * 200, ctx.currentTime);

              const mod = ctx.createOscillator();
              mod.type = 'sine';
              mod.frequency.setValueAtTime(45, ctx.currentTime);
              const modGain = ctx.createGain();
              modGain.gain.setValueAtTime(800, ctx.currentTime);
              mod.connect(carrier.frequency);

              const cg = ctx.createGain();
              cg.gain.setValueAtTime(0.001, ctx.currentTime);
              cg.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.03);
              cg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

              carrier.connect(cg);
              cg.connect(masterGain);

              carrier.start();
              mod.start();
              carrier.stop(ctx.currentTime + 0.25);
              mod.stop(ctx.currentTime + 0.25);
            } catch {}
          }, 1800);
          intervals.push(cricketTimer);
          break;
        }

        // 9. 10Hz Sóng Não Alpha & Gió Rừng Xanh
        case 'alpha': {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(432, ctx.currentTime);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(442, ctx.currentTime);

          const g1 = ctx.createGain();
          const g2 = ctx.createGain();
          g1.gain.value = 0.06;
          g2.gain.value = 0.06;

          osc1.connect(g1);
          osc2.connect(g2);
          g1.connect(masterGain);
          g2.connect(masterGain);

          osc1.start();
          osc2.start();
          sources.push(osc1, osc2);

          const canopySrc = ctx.createBufferSource();
          canopySrc.buffer = this.createNoiseBuffer(ctx, 'pink');
          canopySrc.loop = true;
          const canopyFilt = ctx.createBiquadFilter();
          canopyFilt.type = 'bandpass';
          canopyFilt.frequency.setValueAtTime(600, ctx.currentTime);
          canopyFilt.Q.setValueAtTime(2.0, ctx.currentTime);
          canopySrc.connect(canopyFilt);
          canopyFilt.connect(masterGain);
          canopySrc.start();
          sources.push(canopySrc);
          break;
        }

        // 10. 65dB Quán Cafe Góc Phố Ngày Mưa Lofi
        case 'lofiCafe': {
          const vinylSrc = ctx.createBufferSource();
          vinylSrc.buffer = this.createNoiseBuffer(ctx, 'pink');
          vinylSrc.loop = true;
          const vFilt = ctx.createBiquadFilter();
          vFilt.type = 'bandpass';
          vFilt.frequency.setValueAtTime(1200, ctx.currentTime);
          vFilt.Q.setValueAtTime(1.0, ctx.currentTime);
          const vGain = ctx.createGain();
          vGain.gain.value = 0.04;
          vinylSrc.connect(vFilt);
          vFilt.connect(vGain);
          vGain.connect(masterGain);
          vinylSrc.start();
          sources.push(vinylSrc);

          const chords = [
            [164.81, 246.94, 293.66, 370.0],
            [220.0, 277.18, 329.63, 440.0],
            [146.83, 220.0, 293.66, 370.0],
          ];
          let chordIdx = 0;
          const lofiTimer = window.setInterval(() => {
            try {
              const chord = chords[chordIdx % chords.length];
              chordIdx++;
              chord.forEach((freq) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                o.frequency.setValueAtTime(freq, ctx.currentTime);
                g.gain.setValueAtTime(0.001, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 0.05);
                g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.8);
                o.connect(g);
                g.connect(masterGain);
                o.start();
                o.stop(ctx.currentTime + 3.8);
              });
            } catch {}
          }, 4000);
          intervals.push(lofiTimer);
          break;
        }

        // 11. 40Hz Sóng Não Gamma Đột Phá Ý Tưởng
        case 'gammaFocus': {
          const carrier40 = ctx.createOscillator();
          carrier40.type = 'sine';
          carrier40.frequency.setValueAtTime(440, ctx.currentTime);

          const gammaLfo = ctx.createOscillator();
          gammaLfo.type = 'sine';
          gammaLfo.frequency.setValueAtTime(40, ctx.currentTime);
          const gammaAmp = ctx.createGain();
          gammaAmp.gain.value = 0.5;

          const carrierGain = ctx.createGain();
          carrierGain.gain.value = 0.07;

          gammaLfo.connect(gammaAmp);
          carrier40.connect(carrierGain);
          carrierGain.connect(masterGain);

          carrier40.start();
          gammaLfo.start();
          sources.push(carrier40, gammaLfo);

          const shimmer = ctx.createOscillator();
          shimmer.type = 'triangle';
          shimmer.frequency.setValueAtTime(880, ctx.currentTime);
          const shimmerGain = ctx.createGain();
          shimmerGain.gain.value = 0.015;
          shimmer.connect(shimmerGain);
          shimmerGain.connect(masterGain);
          shimmer.start();
          sources.push(shimmer);
          break;
        }

        // 12. 174Hz Chuông Xoay Tây Tạng & Suối Reo
        case 'tibetan': {
          const tibetanTimer = window.setInterval(() => {
            this.playTibetanBowl(174);
          }, 5000);
          this.playTibetanBowl(174);
          intervals.push(tibetanTimer);

          const creekSrc = ctx.createBufferSource();
          creekSrc.buffer = this.createNoiseBuffer(ctx, 'pink');
          creekSrc.loop = true;
          const cFilt = ctx.createBiquadFilter();
          cFilt.type = 'bandpass';
          cFilt.frequency.setValueAtTime(500, ctx.currentTime);
          cFilt.Q.setValueAtTime(1.2, ctx.currentTime);
          const cGain = ctx.createGain();
          cGain.gain.value = 0.035;
          creekSrc.connect(cFilt);
          cFilt.connect(cGain);
          cGain.connect(masterGain);
          creekSrc.start();
          sources.push(creekSrc);
          break;
        }

        // 13. 639Hz Kết Nối Trái Tim & Yêu Thương
        case 'solfeggio639': {
          const osc639 = ctx.createOscillator();
          osc639.type = 'sine';
          osc639.frequency.setValueAtTime(639, ctx.currentTime);
          const g639 = ctx.createGain();
          g639.gain.value = 0.055;
          osc639.connect(g639);
          g639.connect(masterGain);
          osc639.start();
          sources.push(osc639);

          const oscFifth = ctx.createOscillator();
          oscFifth.type = 'sine';
          oscFifth.frequency.setValueAtTime(639 * 1.5, ctx.currentTime);
          const gFifth = ctx.createGain();
          gFifth.gain.value = 0.018;
          oscFifth.connect(gFifth);
          gFifth.connect(masterGain);
          oscFifth.start();
          sources.push(oscFifth);

          const breathLfo = ctx.createOscillator();
          breathLfo.frequency.setValueAtTime(0.15, ctx.currentTime);
          const breathGain = ctx.createGain();
          breathGain.gain.value = 0.02;
          breathLfo.connect(breathGain.gain);
          breathLfo.start();
          sources.push(breathLfo);
          break;
        }

        // 14. 852Hz Khai Mở Trực Giác & Thanh Tịnh
        case 'solfeggio852': {
          const osc852 = ctx.createOscillator();
          osc852.type = 'sine';
          osc852.frequency.setValueAtTime(852, ctx.currentTime);
          const g852 = ctx.createGain();
          g852.gain.value = 0.045;
          osc852.connect(g852);
          g852.connect(masterGain);
          osc852.start();
          sources.push(osc852);

          const osc1704 = ctx.createOscillator();
          osc1704.type = 'sine';
          osc1704.frequency.setValueAtTime(1704, ctx.currentTime);
          const g1704 = ctx.createGain();
          g1704.gain.value = 0.012;
          osc1704.connect(g1704);
          g1704.connect(masterGain);
          osc1704.start();
          sources.push(osc1704);

          const airSrc = ctx.createBufferSource();
          airSrc.buffer = this.createNoiseBuffer(ctx, 'pink');
          airSrc.loop = true;
          const airFilt = ctx.createBiquadFilter();
          airFilt.type = 'highpass';
          airFilt.frequency.setValueAtTime(2200, ctx.currentTime);
          const airGain = ctx.createGain();
          airGain.gain.value = 0.02;
          airSrc.connect(airFilt);
          airFilt.connect(airGain);
          airGain.connect(masterGain);
          airSrc.start();
          sources.push(airSrc);
          break;
        }

        default: {
          const defOsc = ctx.createOscillator();
          defOsc.type = 'sine';
          defOsc.frequency.setValueAtTime(432, ctx.currentTime);
          const defGain = ctx.createGain();
          defGain.gain.value = 0.05;
          defOsc.connect(defGain);
          defGain.connect(masterGain);
          defOsc.start();
          sources.push(defOsc);
          break;
        }
      }

      this.activeNodes[key] = {
        oscs: sources,
        gain: masterGain,
        intervalIds: intervals,
      };
    } catch {}
  }

  stopAmbient(key = 'ambient') {
    if (this.activeNodes[key]) {
      const node = this.activeNodes[key];
      if (node.timer) {
        clearInterval(node.timer);
      }
      if (node.intervalIds) {
        node.intervalIds.forEach((id) => clearInterval(id));
      }
      node.oscs.forEach((osc) => {
        try {
          if ('stop' in osc) {
            osc.stop();
          }
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      if (node.gain) {
        try {
          node.gain.disconnect();
        } catch {
          // ignore
        }
      }
      delete this.activeNodes[key];
    }
  }
}

export const audioSynth = new SoundSynthesizer();