/**
 * Sound synthesis service using Web Audio API and SpeechSynthesis API
 * Provides procedural alarms with volume fade-in and voice coaching
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private currentGainNode: GainNode | null = null;
  private isAlarmPlaying = false;
  private alarmInterval: number | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Start procedural alarm tone with volume fade-in
   */
  public startAlarm(tone: string, fadeInSec: number = 15): void {
    this.stopAlarm();
    const ctx = this.getContext();
    this.isAlarmPlaying = true;

    // Master gain node for volume control and fade-in
    const masterGain = ctx.createGain();
    this.currentGainNode = masterGain;
    masterGain.connect(ctx.destination);

    // Initial volume start
    const startVolume = fadeInSec > 0 ? 0.05 : 0.85;
    const targetVolume = 0.9;
    masterGain.gain.setValueAtTime(startVolume, ctx.currentTime);

    if (fadeInSec > 0) {
      masterGain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + fadeInSec);
    } else {
      masterGain.gain.setValueAtTime(targetVolume, ctx.currentTime);
    }

    // Play tone loop
    const playNote = () => {
      if (!this.isAlarmPlaying) return;
      this.triggerToneCycle(tone, masterGain);
    };

    playNote();
    // Repeating cycle based on tone style
    const loopIntervalMs = tone === 'marathon_beat' ? 1200 : tone === 'gentle_chimes' ? 2400 : 1800;
    this.alarmInterval = window.setInterval(playNote, loopIntervalMs);
  }

  /**
   * Stop playing the alarm
   */
  public stopAlarm(): void {
    this.isAlarmPlaying = false;
    if (this.alarmInterval !== null) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.currentGainNode && this.ctx) {
      try {
        this.currentGainNode.gain.setValueAtTime(this.currentGainNode.gain.value, this.ctx.currentTime);
        this.currentGainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        setTimeout(() => {
          this.currentGainNode?.disconnect();
          this.currentGainNode = null;
        }, 350);
      } catch {
        this.currentGainNode = null;
      }
    }
  }

  public isPlaying(): boolean {
    return this.isAlarmPlaying;
  }

  private triggerToneCycle(tone: string, targetNode: AudioNode): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    switch (tone) {
      case 'sunrise_birds': {
        // Melodic morning chirps & warm pad
        const baseFreqs = [587.33, 880, 1174.66, 1760]; // D5, A5, D6, A6
        baseFreqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.35, now + idx * 0.15 + 0.1);

          gain.gain.setValueAtTime(0, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.15 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.25);

          osc.connect(gain);
          gain.connect(targetNode);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.3);
        });
        break;
      }

      case 'gentle_chimes': {
        // Warm meditative bells
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.22);

          gain.gain.setValueAtTime(0, now + idx * 0.22);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.22 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 1.2);

          osc.connect(gain);
          gain.connect(targetNode);
          osc.start(now + idx * 0.22);
          osc.stop(now + idx * 0.22 + 1.3);
        });
        break;
      }

      case 'marathon_beat': {
        // High energy electronic workout kicks & hats
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(150, now);
        kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
        kickGain.gain.setValueAtTime(0.6, now);
        kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        kickOsc.connect(kickGain);
        kickGain.connect(targetNode);
        kickOsc.start(now);
        kickOsc.stop(now + 0.28);

        // Hi-hat synths
        [0.2, 0.4, 0.6, 0.8].forEach((offset) => {
          const synthOsc = ctx.createOscillator();
          const synthGain = ctx.createGain();
          synthOsc.type = 'sawtooth';
          synthOsc.frequency.setValueAtTime(880, now + offset);
          synthGain.gain.setValueAtTime(0.12, now + offset);
          synthGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
          synthOsc.connect(synthGain);
          synthGain.connect(targetNode);
          synthOsc.start(now + offset);
          synthOsc.stop(now + offset + 0.1);
        });
        break;
      }

      case 'energetic_pulse':
      default: {
        // Upbeat wake-up arpeggio
        const chords = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        chords.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.12);
          gain.gain.setValueAtTime(0, now + i * 0.12);
          gain.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
          osc.connect(gain);
          gain.connect(targetNode);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.45);
        });
        break;
      }
    }
  }

  /**
   * Play a brief interactive UI tap or step chime
   */
  public playStepChime(): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  /**
   * Audio Voice Coach for split announcements and encouragement
   */
  public speak(text: string): void {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
    }
  }
}

export const soundService = new SoundService();
