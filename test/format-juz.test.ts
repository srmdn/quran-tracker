import { describe, expect, test } from "bun:test";
import { formatJuz, formatLogAmount } from "../src/lib/format-juz.ts";

describe("juz formatting", () => {
  test("formats whole juz", () => {
    expect(formatJuz(2, "en")).toBe("2 juz");
    expect(formatJuz(1, "id")).toBe("1 juz");
  });

  test("formats fractional juz as pages", () => {
    expect(formatJuz(0.5, "en")).toBe("10 pages");
    expect(formatJuz(0.5, "id")).toBe("10 halaman");
    expect(formatJuz(1.6, "en")).toBe("1 juz 12 pages");
  });

  test("prefers the stored unit for new logs", () => {
    expect(formatLogAmount(0.5, "pages", 10, "id")).toBe("10 halaman");
    expect(formatLogAmount(0.275, "pages", 5.5, "en")).toBe("5½ pages");
    expect(formatLogAmount(0.025, "pages", 0.5, "en")).toBe("½ pages");
    expect(formatLogAmount(2, "juz", 2, "en")).toBe("2 juz");
  });

  test("falls back to juz formatting for legacy logs", () => {
    expect(formatLogAmount(1.6, null, null, "en")).toBe("1 juz 12 pages");
  });
});
