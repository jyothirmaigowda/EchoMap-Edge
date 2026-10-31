/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EchoMap Edge - TextToSpeech, Tactile Haptics, and Spatial Audio Beacons
 * Fully offline, browser-native speech synthesis and Web Audio cues.
 */

class AudioAndSpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCtx: AudioContext | null = null;
  private lastSpokenText: string = '';
  private isSpeaking: boolean = false;
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private hapticsEnabled: boolean = true;
  private audioBeaconsEnabled: boolean = true;
  private listeners: Set<(isSpeaking: boolean, text: string) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  setSpeechParams(rate: number, pitch: number, haptics: boolean, beacons: boolean) {
    this.rate = rate;
    this.pitch = pitch;
    this.hapticsEnabled = haptics;
    this.audioBeaconsEnabled = beacons;
  }

  subscribe(listener: (isSpeaking: boolean, text: string) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(isSpeaking: boolean, text: string) {
    this.isSpeaking = isSpeaking;
    this.listeners.forEach((l) => l(isSpeaking, text));
  }

  speak(text: string, interrupt = true): void {
    if (!text.trim()) return;
    this.lastSpokenText = text;

    if (!this.synth) {
      this.notify(false, text);
      return;
    }

    try {
      if (interrupt) {
        this.synth.cancel();
      }
    } catch {
      // Ignore cancel failure
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    // Pick a natural local voice if available
    try {
      const voices = this.synth.getVoices();
      if (voices && voices.length > 0) {
        const englishVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.localService));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }
    } catch {
      // Ignore getVoices errors
    }

    utterance.onstart = () => {
      this.notify(true, text);
      this.triggerHaptic([30]);
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.notify(false, text);
    };

    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      // "canceled" or "interrupted" is normal browser behavior when switching phrases or stopping
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('Speech synthesis event:', e.error || 'unhandled');
      }
      this.currentUtterance = null;
      this.notify(false, text);
    };

    this.currentUtterance = utterance;

    // Small delay after cancel prevents Chrome/Edge from immediately cancelling the newly queued utterance
    setTimeout(() => {
      if (!this.synth) return;
      try {
        this.synth.speak(utterance);
      } catch {
        this.notify(false, text);
      }
    }, interrupt ? 20 : 0);
  }

  repeatLast(): void {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText, true);
    } else {
      this.speak('No previous announcement to repeat.', true);
    }
  }

  pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.notify(false, this.lastSpokenText);
    }
  }

  resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.notify(true, this.lastSpokenText);
    }
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      this.notify(false, '');
    }
  }

  getSpeakingStatus(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  getLastSpoken(): string {
    return this.lastSpokenText;
  }

  // ---------------------------------------------------------------------------
  // Web Audio Earcons & Tactile Feedback
  // ---------------------------------------------------------------------------
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  triggerHaptic(pattern: number | number[] = [40]): void {
    if (!this.hapticsEnabled) return;
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        // Ignored if user hasn't interacted yet
      }
    }
  }

  /**
   * Spatial Audio Beacon for Object Finding
   * Frequency shifts based on alignment: 400Hz (off-center) -> 880Hz (locked on target)
   */
  playObjectBeacon(alignmentScore: number): void {
    if (!this.audioBeaconsEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // alignmentScore: 0 (far left/right) to 1 (centered dead ahead)
      const clamped = Math.max(0, Math.min(1, alignmentScore));
      const freq = 440 + clamped * 440; // 440Hz to 880Hz

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);

      this.triggerHaptic(clamped > 0.8 ? [30, 20, 30] : [20]);
    } catch (err) {
      console.warn('Audio beacon error:', err);
    }
  }

  /**
   * Countdown Tick Beep for SOS confirmation
   */
  playCountdownTick(secondsLeft: number): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = secondsLeft <= 2 ? 880 : 580;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.11);

      this.triggerHaptic(secondsLeft <= 2 ? [80, 40, 80] : [50]);
    } catch {
      // Audio context might be restricted
    }
  }

  /**
   * Emergency Tone Sequence
   */
  playEmergencyAlarm(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.18);
      osc.frequency.linearRampToValueAtTime(750, now + 0.36);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.42);

      this.triggerHaptic([100, 50, 100, 50, 150]);
    } catch {
      // Handled
    }
  }
}

export const speechService = new AudioAndSpeechService();
