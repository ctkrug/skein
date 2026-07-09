import { describe, expect, it } from "vitest";
import { encodeState, decodeState } from "../src/url";
import { DEFAULT_PARAMS } from "../src/params";

describe("url round-trip", () => {
  it("restores the same slider values it encoded", () => {
    const params = {
      mean: 42,
      variance: 250,
      correlation: -0.3,
      paths: 1500,
      seed: 1,
    };
    const { params: back, presetId } = decodeState(
      encodeState(params, "streak"),
    );
    expect(back.mean).toBe(42);
    expect(back.variance).toBe(250);
    expect(back.correlation).toBe(-0.3);
    expect(back.paths).toBe(1500);
    expect(presetId).toBe("streak");
  });

  it("clamps out-of-range values from a hostile hash", () => {
    const { params } = decodeState("#m=999&v=-10&c=5&n=99999");
    expect(params.mean).toBe(200);
    expect(params.variance).toBe(0);
    expect(params.correlation).toBe(1);
    expect(params.paths).toBe(5000);
  });

  it("falls back to defaults for a missing or junk hash", () => {
    const empty = decodeState("");
    expect(empty.params).toEqual(DEFAULT_PARAMS);
    expect(empty.presetId).toBeNull();

    const junk = decodeState("#m=banana&v=&c=xyz");
    expect(junk.params.mean).toBe(DEFAULT_PARAMS.mean);
    expect(junk.params.variance).toBe(DEFAULT_PARAMS.variance);
    expect(junk.params.correlation).toBe(DEFAULT_PARAMS.correlation);
  });

  it("tolerates a leading hash or none", () => {
    expect(decodeState("#m=50").params.mean).toBe(50);
    expect(decodeState("m=50").params.mean).toBe(50);
  });
});
