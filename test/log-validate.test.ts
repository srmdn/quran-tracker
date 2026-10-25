import { describe, expect, test } from "bun:test";
import { isKhatamPosition, parseLogSubmission } from "../src/lib/log-validate.ts";
import { PAGES_PER_JUZ } from "../src/lib/format-juz.ts";

const base = {
  input_mode: "juz",
  end_surah: "2",
  end_ayah: "5",
};

describe("log submission validation", () => {
  test("accepts an explicit juz amount", () => {
    const result = parseLogSubmission({ ...base, amount: "2" }, "en", { withRepetition: false });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.values.logUnit).toBe("juz");
    expect(result.values.logAmount).toBe(2);
    expect(result.values.juzAmount).toBe(2);
    expect(result.values.endSurah).toBe(2);
    expect(result.values.endJuz).toBe(1);
    expect(result.values.endSurahName).toBe("Al-Baqarah");
  });

  test("accepts pages with a half page", () => {
    const result = parseLogSubmission(
      { ...base, input_mode: "pages", pages_whole: "5", pages_half: "on" },
      "en",
      { withRepetition: false }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.values.logUnit).toBe("pages");
    expect(result.values.logAmount).toBe(5.5);
    expect(result.values.juzAmount).toBeCloseTo(5.5 / PAGES_PER_JUZ, 10);
  });

  test("auto-calculates juz from start and end", () => {
    const result = parseLogSubmission(
      { ...base, start_surah: "1", start_ayah: "1" },
      "en",
      { withRepetition: false }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.values.logUnit).toBe("juz");
    expect(result.values.logAmount).toBe(1);
    expect(result.values.juzAmount).toBe(1);
    expect(result.values.startJuz).toBe(1);
  });

  test("auto-calculates pages from start and end", () => {
    const result = parseLogSubmission(
      { ...base, input_mode: "pages", start_surah: "1", start_ayah: "1" },
      "en",
      { withRepetition: false }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.values.logUnit).toBe("pages");
    expect(result.values.logAmount).toBe(2);
    expect(result.values.juzAmount).toBeCloseTo(2 / PAGES_PER_JUZ, 10);
  });

  test("rejects auto-calculation without a start position", () => {
    const result = parseLogSubmission({ ...base }, "en", { withRepetition: false });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("Fill in the starting position to auto-calculate the amount.");
  });

  test("rejects invalid surah and ayah values", () => {
    expect(parseLogSubmission({ ...base, end_surah: "115", end_ayah: "1" }, "en", { withRepetition: false }).ok).toBe(false);
    expect(parseLogSubmission({ ...base, end_surah: "1", end_ayah: "8" }, "en", { withRepetition: false }).ok).toBe(false);
    expect(parseLogSubmission({ ...base, start_surah: "1", start_ayah: "0" }, "en", { withRepetition: false }).ok).toBe(false);
  });

  test("rejects non-integer, zero, and out-of-range amounts", () => {
    expect(parseLogSubmission({ ...base, amount: "1.5" }, "en", { withRepetition: false }).ok).toBe(false);
    expect(parseLogSubmission({ ...base, amount: "0" }, "en", { withRepetition: false }).ok).toBe(false);
    expect(parseLogSubmission({ ...base, amount: "31" }, "en", { withRepetition: false }).ok).toBe(false);
    expect(parseLogSubmission({ ...base, input_mode: "pages", pages_whole: "605" }, "en", { withRepetition: false }).ok).toBe(false);
  });

  test("rejects a negative page auto-calculation", () => {
    const result = parseLogSubmission(
      { ...base, input_mode: "pages", start_surah: "2", start_ayah: "5", end_surah: "1", end_ayah: "1" },
      "en",
      { withRepetition: false }
    );
    expect(result.ok).toBe(false);
  });

  test("detects the khatam position", () => {
    expect(isKhatamPosition(114, 6)).toBe(true);
    expect(isKhatamPosition(114, 5)).toBe(false);
    expect(isKhatamPosition(null, null)).toBe(false);
  });

  test("validates repetition count only when requested", () => {
    const without = parseLogSubmission({ ...base, amount: "1", repetition_count: "999" }, "en", { withRepetition: false });
    expect(without.ok).toBe(true);

    expect(parseLogSubmission({ ...base, amount: "1", repetition_count: "0" }, "en", { withRepetition: true }).ok).toBe(false);
    expect(parseLogSubmission({ ...base, amount: "1", repetition_count: "101" }, "en", { withRepetition: true }).ok).toBe(false);
    const valid = parseLogSubmission({ ...base, amount: "1", repetition_count: "3" }, "en", { withRepetition: true });
    expect(valid.ok).toBe(true);
    if (!valid.ok) return;
    expect(valid.values.repetitionCount).toBe(3);
  });

  test("accepts an explicit amount without an ending position", () => {
    const result = parseLogSubmission({ input_mode: "juz", amount: "2" }, "en", { withRepetition: false });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.values.juzAmount).toBe(2);
    expect(result.values.endSurah).toBeNull();
    expect(result.values.endAyah).toBeNull();
    expect(result.values.endJuz).toBeNull();
    expect(result.values.endSurahName).toBeNull();
  });

  test("requires an ending position for auto-calculation", () => {
    const result = parseLogSubmission(
      { input_mode: "juz", start_surah: "1", start_ayah: "1" },
      "en",
      { withRepetition: false }
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("Fill in the ending position to auto-calculate the amount.");
  });

  test("rejects start-after-end and same-position logs", () => {
    const after = parseLogSubmission(
      { ...base, amount: "1", start_surah: "2", start_ayah: "5", end_surah: "1", end_ayah: "1" },
      "en",
      { withRepetition: false }
    );
    expect(after.ok).toBe(false);
    if (!after.ok) expect(after.error).toBe("The starting position cannot be after the ending position.");

    const same = parseLogSubmission(
      { ...base, amount: "1", start_surah: "1", start_ayah: "1", end_surah: "1", end_ayah: "1" },
      "en",
      { withRepetition: false }
    );
    expect(same.ok).toBe(false);
    if (!same.ok) expect(same.error).toBe("Starting and ending positions cannot be the same when the amount is greater than zero.");
  });

  test("rejects incomplete start and end positions", () => {
    const startOnly = parseLogSubmission({ ...base, amount: "1", start_surah: "1" }, "en", { withRepetition: false });
    expect(startOnly.ok).toBe(false);
    if (!startOnly.ok) expect(startOnly.error).toBe("Fill in both the starting surah and ayah, or leave both empty.");

    const endOnly = parseLogSubmission({ ...base, amount: "1", end_surah: "1", end_ayah: "" }, "en", { withRepetition: false });
    expect(endOnly.ok).toBe(false);
    if (!endOnly.ok) expect(endOnly.error).toBe("Fill in both the ending surah and ayah, or leave both empty.");
  });
});
