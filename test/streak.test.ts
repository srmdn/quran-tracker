import { describe, expect, test } from "bun:test";
import { isStreakActive } from "../src/lib/streak.ts";

describe("streak activity", () => {
  test("is active for today or yesterday", () => {
    expect(isStreakActive("2026-10-25", "2026-10-25")).toBe(true);
    expect(isStreakActive("2026-10-24", "2026-10-25")).toBe(true);
  });

  test("is inactive for older dates or no activity", () => {
    expect(isStreakActive("2026-10-23", "2026-10-25")).toBe(false);
    expect(isStreakActive(null, "2026-10-25")).toBe(false);
  });
});
