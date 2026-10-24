import { describe, expect, test } from "bun:test";
import { safeRedirectTarget } from "../src/lib/redirect.ts";
import { maskEmail } from "../src/lib/redact.ts";

describe("safe redirect target", () => {
  const base = "https://quran.example.test";

  test("keeps same-origin paths", () => {
    expect(safeRedirectTarget(`${base}/dashboard?tab=1`, base)).toBe("/dashboard?tab=1");
    expect(safeRedirectTarget("/tilawah", base)).toBe("/tilawah");
  });

  test("rejects other origins", () => {
    expect(safeRedirectTarget("https://evil.example/phish", base)).toBe("/");
    expect(safeRedirectTarget("//evil.example/phish", base)).toBe("/");
    expect(safeRedirectTarget("javascript:alert(1)", base)).toBe("/");
  });

  test("falls back when missing or malformed", () => {
    expect(safeRedirectTarget(undefined, base)).toBe("/");
    expect(safeRedirectTarget("not a url", base)).toBe("/");
  });
});

describe("email masking", () => {
  test("keeps the domain and one local character", () => {
    expect(maskEmail("ahmad@example.test")).toBe("a***@example.test");
    expect(maskEmail("a@example.test")).toBe("a***@example.test");
  });

  test("handles malformed values", () => {
    expect(maskEmail("not-an-email")).toBe("***");
    expect(maskEmail("@example.test")).toBe("***");
  });
});
