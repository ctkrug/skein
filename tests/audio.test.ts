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
    expect(new Synth(fakeStore({ "scenario-loom:muted": "1" })).isMuted).toBe(true);
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
});
