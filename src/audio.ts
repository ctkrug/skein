/**
 * WebAudio-synthesized SFX — zero binary assets. Every sound is generated from
 * oscillators and a noise buffer at call time. The AudioContext is created
 * lazily on the first user gesture (autoplay policy) and every path is guarded
 * so the class is inert, never throwing, in environments without WebAudio
 * (the test runner) or when muted.
 */

/** Minimal persistence surface so the mute preference can be unit-tested. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const MUTE_KEY = "scenario-loom:muted";

/** localStorage when present, otherwise null (SSR / tests). */
function safeStore(): KeyValueStore | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Reads a key from a store that may itself throw on access. */
function safeRead(store: KeyValueStore | null, key: string): string | null {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

type Ctor = new () => AudioContext;

function audioCtor(): Ctor | null {
  const w = globalThis as unknown as {
    AudioContext?: Ctor;
    webkitAudioContext?: Ctor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export class Synth {
  private ctx: AudioContext | null = null;
  private muted: boolean;
  private lastBlip = 0;

  constructor(private readonly store: KeyValueStore | null = safeStore()) {
    this.muted = safeRead(this.store, MUTE_KEY) === "1";
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /** Flips mute, persists it, and returns the new state. */
  toggleMute(): boolean {
    this.muted = !this.muted;
    // Some private-browsing modes throw from setItem even though getItem works.
    try {
      this.store?.setItem(MUTE_KEY, this.muted ? "1" : "0");
    } catch {
      // unpersisted for this session; the in-memory toggle still applies
    }
    return this.muted;
  }

  /**
   * Lazily creates/resumes the AudioContext. Call from a real user gesture
   * (pointerdown) so playback is allowed. No-op where WebAudio is absent.
   */
  resume(): void {
    if (this.muted) return;
    if (!this.ctx) {
      const Ctor = audioCtor();
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch {
        this.ctx = null;
        return;
      }
    }
    void this.ctx.resume?.();
  }

  /** Short tick while a slider drags — rate-throttled so it never buzzes. */
  blip(): void {
    const now = this.ctx?.currentTime ?? 0;
    if (now - this.lastBlip < 0.045) return;
    this.lastBlip = now;
    this.tone({ freq: 440, dur: 0.05, type: "triangle", gain: 0.05 });
  }

  /** A soft filtered-noise whoosh when the whole path set resimulates. */
  sweep(): void {
    const ctx = this.play();
    if (!ctx) return;
    const src = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.sin(i * 0.02) * (1 - i / data.length)) / 6;
    }
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.35);
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  }

  /** A two-note rising chime confirming an export. */
  chime(): void {
    this.tone({ freq: 660, dur: 0.12, type: "sine", gain: 0.08 });
    this.tone({ freq: 990, dur: 0.16, type: "sine", gain: 0.07, delay: 0.09 });
  }

  private play(): AudioContext | null {
    if (this.muted) return null;
    this.resume();
    return this.ctx;
  }

  private tone(o: {
    freq: number;
    dur: number;
    type: OscillatorType;
    gain: number;
    delay?: number;
  }): void {
    const ctx = this.play();
    if (!ctx) return;
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = o.type;
    osc.frequency.setValueAtTime(o.freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(o.gain, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.02);
  }
}
