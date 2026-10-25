import { SURAHS, getJuzForPosition, getPageForPosition } from "../data/quran-meta.ts";
import { PAGES_PER_JUZ } from "./format-juz.ts";
import { t, type Lang } from "./i18n.ts";

export type ParsedLogValues = {
  logUnit: "juz" | "pages";
  logAmount: number;
  juzAmount: number;
  startSurah: number | null;
  startAyah: number | null;
  startJuz: number | null;
  endSurah: number | null;
  endAyah: number | null;
  endJuz: number | null;
  endSurahName: string | null;
  repetitionCount: number | null;
};

export type ParseLogResult =
  | { ok: true; values: ParsedLogValues }
  | { ok: false; error: string };

export function isKhatamPosition(endSurah: number | null, endAyah: number | null): boolean {
  return endSurah === 114 && endAyah === 6;
}

function comparePosition(
  startSurah: number,
  startAyah: number,
  endSurah: number,
  endAyah: number
): number {
  if (startSurah !== endSurah) return startSurah < endSurah ? -1 : 1;
  if (startAyah !== endAyah) return startAyah < endAyah ? -1 : 1;
  return 0;
}

// Shared field parsing + validation for create and edit log submissions.
// Date handling is NOT part of this helper (create validates it; edit keeps it immutable).
//
// An explicit amount is the fast path: start and end positions are optional.
// If the amount is left empty, both start and end are required for auto-calculation.
export function parseLogSubmission(
  body: Record<string, string | File>,
  lang: Lang,
  opts: { withRepetition: boolean }
): ParseLogResult {
  const inputMode = (body.input_mode as string) === "pages" ? "pages" : "juz";

  let juzAmount = 0;
  let logUnit: "juz" | "pages";
  let logAmount = 0;
  let needsAutoCalc = false;

  if (inputMode === "pages") {
    const pagesWholeRaw = (body.pages_whole as string)?.trim() || "";
    const pagesHalf = !!(body.pages_half as string);
    let pagesWhole = 0;
    if (pagesWholeRaw !== "") {
      if (!/^\d+$/.test(pagesWholeRaw)) {
        return { ok: false, error: t(lang, "invalidPagesAmount") };
      }
      pagesWhole = parseInt(pagesWholeRaw, 10);
    }
    const totalPages = pagesWhole + (pagesHalf ? 0.5 : 0);
    if (totalPages === 0) {
      needsAutoCalc = true;
      logUnit = "pages";
    } else {
      if (totalPages > 604) return { ok: false, error: t(lang, "pagesExceed30") };
      logUnit = "pages";
      logAmount = totalPages;
      juzAmount = totalPages / PAGES_PER_JUZ;
    }
  } else {
    const amountRaw = (body.amount as string)?.trim() || "";
    if (amountRaw === "") {
      needsAutoCalc = true;
      logUnit = "juz";
    } else {
      if (!/^\d+$/.test(amountRaw)) {
        return { ok: false, error: t(lang, "invalidJuzAmount") };
      }
      const amountInt = parseInt(amountRaw, 10);
      if (amountInt <= 0) return { ok: false, error: t(lang, "invalidJuzAmount") };
      if (amountInt > 30) return { ok: false, error: t(lang, "juzExceeds30") };
      logUnit = "juz";
      logAmount = amountInt;
      juzAmount = amountInt;
    }
  }

  // Optional start position.
  let startSurah: number | null = null;
  let startAyah: number | null = null;
  let startJuz: number | null = null;
  const startSurahRaw = ((body.start_surah as string) || "").trim();
  const startAyahRaw = ((body.start_ayah as string) || "").trim();
  if (startSurahRaw || startAyahRaw) {
    if (!startSurahRaw || !startAyahRaw) {
      return { ok: false, error: t(lang, "startPositionIncomplete") };
    }
    const parsedStartSurah = parseInt(startSurahRaw, 10);
    const parsedStartAyah = parseInt(startAyahRaw, 10);
    const startSurahMeta = SURAHS.find((s) => s.number === parsedStartSurah);
    if (!startSurahMeta) return { ok: false, error: t(lang, "invalidSurah") };
    if (!Number.isInteger(parsedStartAyah) || parsedStartAyah < 1 || parsedStartAyah > startSurahMeta.totalAyahs) {
      return {
        ok: false,
        error: `${t(lang, "ayahMustBeBetween")} ${startSurahMeta.totalAyahs} ${t(lang, "forSurah")} ${startSurahMeta.name}.`,
      };
    }
    startSurah = parsedStartSurah;
    startAyah = parsedStartAyah;
    startJuz = getJuzForPosition(startSurah, startAyah);
  }

  // Optional end position.
  let endSurah: number | null = null;
  let endAyah: number | null = null;
  let endJuz: number | null = null;
  let endSurahName: string | null = null;
  const endSurahRaw = ((body.end_surah as string) || "").trim();
  const endAyahRaw = ((body.end_ayah as string) || "").trim();
  if (endSurahRaw || endAyahRaw) {
    if (!endSurahRaw || !endAyahRaw) {
      return { ok: false, error: t(lang, "endPositionIncomplete") };
    }
    const parsedEndSurah = parseInt(endSurahRaw, 10);
    const parsedEndAyah = parseInt(endAyahRaw, 10);
    const endSurahMeta = SURAHS.find((s) => s.number === parsedEndSurah);
    if (!endSurahMeta) return { ok: false, error: t(lang, "invalidSurah") };
    if (!Number.isInteger(parsedEndAyah) || parsedEndAyah < 1 || parsedEndAyah > endSurahMeta.totalAyahs) {
      return {
        ok: false,
        error: `${t(lang, "ayahMustBeBetween")} ${endSurahMeta.totalAyahs} ${t(lang, "forSurah")} ${endSurahMeta.name}.`,
      };
    }
    endSurah = parsedEndSurah;
    endAyah = parsedEndAyah;
    endJuz = getJuzForPosition(endSurah, endAyah);
    endSurahName = endSurahMeta.name;
  }

  if (startSurah !== null && startAyah !== null && endSurah !== null && endAyah !== null) {
    const order = comparePosition(startSurah, startAyah, endSurah, endAyah);
    if (order > 0) return { ok: false, error: t(lang, "startAfterEnd") };
    if (order === 0) return { ok: false, error: t(lang, "samePosition") };
  }

  if (needsAutoCalc) {
    if (startSurah === null || startAyah === null) {
      return { ok: false, error: t(lang, "autoCalcNeedsStart") };
    }
    if (endSurah === null || endAyah === null) {
      return { ok: false, error: t(lang, "autoCalcNeedsEnd") };
    }
    if (logUnit === "pages") {
      const startPage = getPageForPosition(startSurah, startAyah);
      const endPage = getPageForPosition(endSurah, endAyah);
      const pageDiff = endPage - startPage + 1;
      if (pageDiff <= 0) {
        return { ok: false, error: t(lang, "autoCalcNegative") };
      }
      logAmount = pageDiff;
      juzAmount = pageDiff / PAGES_PER_JUZ;
    } else {
      if (startJuz === null || endJuz === null) {
        return { ok: false, error: t(lang, "autoCalcNeedsStart") };
      }
      const diff = endJuz - startJuz;
      logAmount = diff + 1;
      juzAmount = diff + 1;
    }
  }

  let repetitionCount: number | null = null;
  if (opts.withRepetition) {
    const repRaw = (body.repetition_count as string | undefined)?.trim();
    if (repRaw) {
      const parsed = parseInt(repRaw, 10);
      if (!Number.isInteger(parsed) || parsed <= 0) return { ok: false, error: t(lang, "repetitionInvalid") };
      if (parsed > 100) return { ok: false, error: t(lang, "repetitionMax") };
      repetitionCount = parsed;
    }
  }

  return {
    ok: true,
    values: {
      logUnit,
      logAmount,
      juzAmount,
      startSurah,
      startAyah,
      startJuz,
      endSurah,
      endAyah,
      endJuz,
      endSurahName,
      repetitionCount,
    },
  };
}
