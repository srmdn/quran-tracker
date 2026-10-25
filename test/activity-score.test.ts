import { describe, expect, test } from "bun:test";
import {
  KHATAM_BONUS_POINT,
  MUROJAAH_POINT_PER_JUZ,
  TILAWAH_POINT_PER_JUZ,
  calculateActivityScore,
} from "../src/lib/activity-calc.ts";

describe("activity score", () => {
  test("combines tilawah, murojaah, and khatam points", () => {
    expect(calculateActivityScore(2, 1, 1)).toBe(
      2 * TILAWAH_POINT_PER_JUZ + 1 * MUROJAAH_POINT_PER_JUZ + KHATAM_BONUS_POINT
    );
  });

  test("rounds fractional juz to integer points", () => {
    expect(calculateActivityScore(0.5, 0.5, 0)).toBe(9);
    expect(calculateActivityScore(0, 0, 0)).toBe(0);
  });
});
