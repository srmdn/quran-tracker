import { describe, expect, test } from "bun:test";
import {
  normalizeDisplayName,
  parsePage,
  passwordMinimum,
  sanitizeExternalDisplayName,
  validatePassword,
} from "../src/lib/validation.ts";

describe("display name validation", () => {
  test("accepts ordinary Indonesian, Arabic, and apostrophe names", () => {
    expect(normalizeDisplayName("Ahmad Fauzan").ok).toBe(true);
    expect(normalizeDisplayName("Siti Aisyah").ok).toBe(true);
    expect(normalizeDisplayName("O'Brien").ok).toBe(true);
    expect(normalizeDisplayName("Abdur-Rahman II").ok).toBe(true);
    expect(normalizeDisplayName("عبد الرحمن").ok).toBe(true);
  });

  test("collapses whitespace and trims", () => {
    const result = normalizeDisplayName("  Ahmad   Fauzan  ");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe("Ahmad Fauzan");
  });

  test("rejects empty, control, and script punctuation", () => {
    expect(normalizeDisplayName("").ok).toBe(false);
    expect(normalizeDisplayName("   ").ok).toBe(false);
    expect(normalizeDisplayName("Ahmad\nFauzan").ok).toBe(false);
    expect(normalizeDisplayName("X') && alert(1) || ('").ok).toBe(false);
    expect(normalizeDisplayName("<script>alert(1)</script>").ok).toBe(false);
    expect(normalizeDisplayName("A".repeat(101)).ok).toBe(false);
  });

  test("sanitizes external names without rejecting punctuation", () => {
    expect(sanitizeExternalDisplayName("  Ahmad\nFauzan  ")).toBe("Ahmad Fauzan");
    expect(sanitizeExternalDisplayName("O'Brien")).toBe("O'Brien");
    expect(sanitizeExternalDisplayName("")).toBe("Member");
  });
});

describe("password policy", () => {
  test("requires a longer password for administrators", () => {
    expect(passwordMinimum("santri")).toBe(8);
    expect(passwordMinimum("admin")).toBe(12);
    expect(passwordMinimum("super_admin")).toBe(12);

    expect(validatePassword("short", "santri")).not.toBeNull();
    expect(validatePassword("eightchr", "santri")).toBeNull();
    expect(validatePassword("elevenchars", "admin")).not.toBeNull();
    expect(validatePassword("twelvechars!", "admin")).toBeNull();
    expect(validatePassword("A".repeat(201), "santri")).not.toBeNull();
  });
});

describe("page parsing", () => {
  test("returns a positive fallback for invalid values", () => {
    expect(parsePage("2")).toBe(2);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-5")).toBe(1);
    expect(parsePage("abc", 3)).toBe(3);
  });
});
