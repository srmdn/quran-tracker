export const PAGES_PER_JUZ = 20;

/**
 * Format a stored juz_amount (REAL) as a human-readable string without decimals.
 * Used for aggregate totals and legacy records where log_unit/log_amount are null.
 *
 * Examples:
 *   2.0  → "2 juz"
 *   0.5  → "10 pages"  (en) / "10 halaman"  (id)
 *   1.6  → "1 juz 12 pages"  (en)
 */
export function formatJuz(juz: number, lang: string): string {
  const whole = Math.floor(juz);
  const pages = Math.round((juz - whole) * PAGES_PER_JUZ);
  const pageWord = lang === "id" ? "halaman" : "pages";
  if (pages === 0) return `${whole} juz`;
  if (whole === 0) return `${pages} ${pageWord}`;
  return `${whole} juz ${pages} ${pageWord}`;
}

/**
 * Format a log entry for display — uses the original unit if stored,
 * falls back to formatJuz for legacy records (log_amount is null).
 */
export function formatLogAmount(
  juzAmount: number,
  logUnit: string | null,
  logAmount: number | null,
  lang: string
): string {
  if (logUnit && logAmount !== null) {
    if (logUnit === "pages") {
      return lang === "id" ? `${logAmount} halaman` : `${logAmount} pages`;
    }
    return `${logAmount} juz`;
  }
  return formatJuz(juzAmount, lang);
}
