import { describe, expect, it } from "vitest";
import { formatValue, formatSigned, exportFilename } from "../src/format";

describe("formatValue", () => {
  it("scales precision to magnitude", () => {
    expect(formatValue(123.45)).toBe("123");
    expect(formatValue(12.34)).toBe("12.3");
    expect(formatValue(1.234)).toBe("1.23");
  });

  it("shows an em dash for non-finite input", () => {
    expect(formatValue(NaN)).toBe("—");
    expect(formatValue(Infinity)).toBe("—");
  });
});

describe("formatSigned", () => {
  it("prefixes an explicit sign, using a real minus glyph", () => {
    expect(formatSigned(0.35)).toBe("+0.35");
    expect(formatSigned(-0.6)).toBe("−0.60");
    expect(formatSigned(0)).toBe("±0.00");
  });

  it("shows an em dash for non-finite input", () => {
    expect(formatSigned(NaN)).toBe("—");
    expect(formatSigned(-Infinity)).toBe("—");
  });
});

describe("exportFilename", () => {
  it("slugifies the preset name", () => {
    expect(exportFilename("Volatile stock")).toBe("skein-volatile-stock.png");
  });

  it("falls back when the name has no usable characters", () => {
    expect(exportFilename("  ")).toBe("skein-scenario.png");
    expect(exportFilename("!!!")).toBe("skein-scenario.png");
  });
});
