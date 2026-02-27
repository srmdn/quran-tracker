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
