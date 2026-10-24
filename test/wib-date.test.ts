import { describe, expect, test } from "bun:test";
import {
  getPreviousWibYearMonth,
  getWibDateYmd,
  getWibMonthRange,
  getWibYearMonth,
  validateWibLogDate,
} from "../src/lib/wib-date.ts";

describe("WIB date helpers", () => {
  test("uses the WIB calendar day at the UTC boundary", () => {
    expect(getWibDateYmd(new Date("2026-10-23T16:59:59Z"))).toBe("2026-10-23");
    expect(getWibDateYmd(new Date("2026-10-23T17:00:00Z"))).toBe("2026-10-24");
  });

  test("returns the WIB year and month", () => {
    expect(getWibYearMonth(new Date("2026-12-31T17:00:00Z"))).toEqual({ year: 2027, month: 1 });
    expect(getWibYearMonth(new Date("2026-01-31T16:59:59Z"))).toEqual({ year: 2026, month: 1 });
  });

  test("computes the previous WIB month across a year boundary", () => {
    expect(getPreviousWibYearMonth(new Date("2026-01-15T03:00:00Z"))).toEqual({ year: 2025, month: 12 });
    expect(getPreviousWibYearMonth(new Date("2026-10-15T03:00:00Z"))).toEqual({ year: 2026, month: 9 });
  });

  test("builds inclusive month ranges, including leap February", () => {
    expect(getWibMonthRange(2028, 2)).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(getWibMonthRange(2026, 12)).toEqual({ from: "2026-12-01", to: "2026-12-31" });
    expect(() => getWibMonthRange(2026, 13)).toThrow();
  });

  test("validates today and yesterday and rejects future or older dates", () => {
    const today = getWibDateYmd();
    const yesterday = getWibDateYmd(new Date(Date.now() - 86_400_000));
    const twoDaysAgo = getWibDateYmd(new Date(Date.now() - 2 * 86_400_000));
    const tomorrow = getWibDateYmd(new Date(Date.now() + 86_400_000));

    expect(validateWibLogDate(today)).toEqual({ ok: true, date: today });
    expect(validateWibLogDate(yesterday)).toEqual({ ok: true, date: yesterday });
    expect(validateWibLogDate(twoDaysAgo).ok).toBe(false);
    expect(validateWibLogDate(tomorrow).ok).toBe(false);
    expect(validateWibLogDate("2026-02-30").ok).toBe(false);
    expect(validateWibLogDate("not-a-date").ok).toBe(false);
  });
});
