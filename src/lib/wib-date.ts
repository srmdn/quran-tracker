const WIB_TIMEZONE = "Asia/Jakarta";

function isValidDateYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

function ymdToEpochDay(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Math.floor(Date.UTC(year!, month! - 1, day!) / 86400000);
}

export function getWibDateYmd(now = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

export function getWibYearMonth(now = new Date()): { year: number; month: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  });

  const [year, month] = formatter.format(now).split("-").map(Number);
  return { year: year!, month: month! };
}

export function getWibMonthRange(year: number, month: number): { from: string; to: string } {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month range. Use year=YYYY and month=1..12.");
  }

  const from = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-01`;

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const lastDay = new Date(Date.UTC(nextYear, nextMonth - 1, 0)).getUTCDate();
  const to = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${lastDay
    .toString()
    .padStart(2, "0")}`;

  return { from, to };
}

export function validateWibLogDate(input: string): {
  ok: boolean;
  date?: string;
  error?: string;
} {
  if (!isValidDateYmd(input)) {
    return { ok: false, error: "Date must be in YYYY-MM-DD format." };
  }

  const todayWib = getWibDateYmd();
  const diffDays = ymdToEpochDay(todayWib) - ymdToEpochDay(input);

  if (diffDays < 0) {
    return { ok: false, error: "Future dates are not allowed." };
  }
  if (diffDays > 1) {
    return { ok: false, error: "Backdate is limited to 1 day (WIB)." };
  }

  return { ok: true, date: input };
}
