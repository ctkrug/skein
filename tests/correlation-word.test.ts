import { describe, expect, it } from "vitest";
import { correlationWord } from "../src/app";

describe("correlationWord", () => {
  it("labels the memory regime across the full slider range", () => {
    expect(correlationWord(0.8)).toBe("strong momentum");
    expect(correlationWord(0.4)).toBe("mild pull");
    expect(correlationWord(0)).toBe("near-memoryless");
    expect(correlationWord(-0.4)).toBe("choppy reversal");
    expect(correlationWord(-0.9)).toBe("hard oscillation");
  });

  it("is monotonic-ish at the boundaries", () => {
    expect(correlationWord(0.6)).toBe("strong momentum");
    expect(correlationWord(0.2)).toBe("mild pull");
    expect(correlationWord(-0.2)).toBe("choppy reversal");
  });
});
