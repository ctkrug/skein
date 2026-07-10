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

  it("never throws in the constructor when the store's getItem itself throws", () => {
    // A store that exists but whose getItem call throws (some restrictive
    // sandboxes) must not crash App's whole constructor over a mute prefs read.
    const store: KeyValueStore = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {},
    };
    expect(() => new Synth(store)).not.toThrow();
    expect(new Synth(store).isMuted).toBe(false);
  });

  it("never throws when the store's setItem itself throws", () => {
    // Old Safari private-browsing mode throws QuotaExceededError from
    // setItem even for a tiny write, while getItem still works fine.
    const store: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    const s = new Synth(store);
    expect(() => s.toggleMute()).not.toThrow();
    expect(s.isMuted).toBe(true);
  });

  it("fails safe to unmuted for a corrupt or hand-edited stored value", () => {
    expect(
      new Synth(fakeStore({ "scenario-loom:muted": "true" })).isMuted,
    ).toBe(false);
    expect(new Synth(fakeStore({ "scenario-loom:muted": "" })).isMuted).toBe(
      false,
    );
    expect(
      new Synth(fakeStore({ "scenario-loom:muted": "yes please" })).isMuted,
    ).toBe(false);
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
    const descriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "localStorage",
    );
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
      if (descriptor)
        Object.defineProperty(globalThis, "localStorage", descriptor);
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
  let lastInstance: FakeCtx | undefined;
  const onCreate = (ctx: FakeCtx) => (lastInstance = ctx);
  class FakeCtx {
    currentTime = 0;
    sampleRate = 44100;
    destination = {};
    constructor() {
      onCreate(this);
    }
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
  return {
    created,
    getCtx: () => lastInstance as unknown as { currentTime: number },
    restore: () => (g.AudioContext = prev),
  };
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

  it("throttles blips inside the tick window but lets a later one through", () => {
    const { created, getCtx, restore } = installFakeAudio();
    try {
      const s = new Synth(fakeStore());
      s.resume();
      const ctx = getCtx();
      ctx.currentTime = 0.1;
      s.blip();
      expect(created.osc).toBe(1);
      ctx.currentTime = 0.12; // 20ms later — inside the 45ms throttle window
      s.blip();
      expect(created.osc).toBe(1);
      ctx.currentTime = 0.2; // past the window
      s.blip();
      expect(created.osc).toBe(2);
    } finally {
      restore();
    }
  });

  it("swallows a throwing AudioContext constructor instead of crashing", () => {
    const g = globalThis as unknown as { AudioContext?: unknown };
    const prev = g.AudioContext;
    g.AudioContext = class {
      constructor() {
        throw new Error("blocked by browser policy");
      }
    } as never;
    try {
      const s = new Synth(fakeStore());
      expect(() => s.resume()).not.toThrow();
      expect(() => s.blip()).not.toThrow();
    } finally {
      g.AudioContext = prev;
    }
  });
});
