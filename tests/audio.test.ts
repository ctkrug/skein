import { describe, expect, it } from "vitest";
import { Synth, type KeyValueStore } from "../src/audio";

function fakeStore(initial: Record<string, string> = {}): KeyValueStore {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

describe("Synth mute state", () => {
  it("defaults to unmuted with no stored preference", () => {
    expect(new Synth(fakeStore()).isMuted).toBe(false);
  });

  it("restores a persisted muted preference", () => {
    expect(new Synth(fakeStore({ "scenario-loom:muted": "1" })).isMuted).toBe(
      true,
    );
  });

  it("toggles and persists across instances sharing a store", () => {
    const store = fakeStore();
    const a = new Synth(store);
    expect(a.toggleMute()).toBe(true);
    expect(new Synth(store).isMuted).toBe(true);
  });
});

describe("Synth without WebAudio", () => {
  it("never throws when no AudioContext exists (headless)", () => {
    const s = new Synth(fakeStore());
    expect(() => {
      s.resume();
      s.blip();
      s.sweep();
      s.chime();
    }).not.toThrow();
  });

  it("tolerates a null store entirely", () => {
    expect(() => new Synth(null).toggleMute()).not.toThrow();
  });

  it("falls back to unmuted when even referencing localStorage throws", () => {
    // Some sandboxed/private-browsing contexts throw just from accessing the
    // global, before any getItem call, so the default-store probe must catch.
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get(): never {
        throw new Error("access denied");
      },
    });
    try {
      expect(() => new Synth().isMuted).not.toThrow();
      expect(new Synth().isMuted).toBe(false);
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
      else delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });
});

/** A fake WebAudio graph that counts the nodes a Synth wires up. */
function installFakeAudio() {
  const created = { osc: 0, gain: 0, buffer: 0, source: 0, filter: 0 };
  const param = () => ({
    value: 0,
    setValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  });
  const node = () => ({ connect: (n: unknown) => n });
  class FakeCtx {
    currentTime = 0;
    sampleRate = 44100;
    destination = {};
    resume() {}
    createOscillator() {
      created.osc++;
      return {
        type: "sine",
        frequency: param(),
        connect: node().connect,
        start: () => {},
        stop: () => {},
      };
    }
    createGain() {
      created.gain++;
      return { gain: param(), connect: node().connect };
    }
    createBuffer() {
      created.buffer++;
      return { getChannelData: () => new Float32Array(64) };
    }
    createBufferSource() {
      created.source++;
      return { buffer: null, connect: node().connect, start: () => {} };
    }
    createBiquadFilter() {
      created.filter++;
      return { type: "bandpass", frequency: param(), connect: node().connect };
    }
  }
  const g = globalThis as unknown as { AudioContext?: unknown };
  const prev = g.AudioContext;
  g.AudioContext = FakeCtx as never;
  return { created, restore: () => (g.AudioContext = prev) };
}

describe("Synth with WebAudio present", () => {
  it("wires oscillators and a noise source when unmuted", () => {
    const { created, restore } = installFakeAudio();
    try {
      const s = new Synth(fakeStore());
      s.resume();
      s.blip();
      s.sweep();
      s.chime();
      expect(created.osc).toBeGreaterThan(0);
      expect(created.source).toBe(1);
      expect(created.filter).toBe(1);
    } finally {
      restore();
    }
  });

  it("makes no sound while muted", () => {
    const { created, restore } = installFakeAudio();
    try {
      const s = new Synth(fakeStore({ "scenario-loom:muted": "1" }));
      s.resume();
      s.blip();
      s.sweep();
      s.chime();
      expect(created.osc).toBe(0);
      expect(created.source).toBe(0);
    } finally {
      restore();
    }
  });
});
