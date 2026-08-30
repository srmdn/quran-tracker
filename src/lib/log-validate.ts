import { SURAHS, getJuzForPosition, getPageForPosition } from "../data/quran-meta.ts";
import { t, type Lang } from "./i18n.ts";

export type ParsedLogValues = {
  logUnit: "juz" | "pages";
  logAmount: number;
  juzAmount: number;
  startSurah: number | null;
  startAyah: number | null;
  startJuz: number | null;
  endSurah: number;
  endAyah: number;
  endJuz: number;
  endSurahName: string;
  repetitionCount: number | null;
};

export type ParseLogResult =
  | { ok: true; values: ParsedLogValues }
  | { ok: false; error: string };

// Shared field parsing + validation for create and edit log submissions.
// Date handling is NOT part of this helper (create validates it; edit keeps it immutable).
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
      if (totalPages > 30) return { ok: false, error: t(lang, "pagesExceed30") };
      logUnit = "pages";
      logAmount = totalPages;
      juzAmount = totalPages / 20;
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

  // Optional start position
  let startSurah: number | null = null;
  let startAyah: number | null = null;
  let startJuz: number | null = null;
  const startSurahRaw = (body.start_surah as string) || "";
  const startAyahRaw = (body.start_ayah as string) || "";
  if (startSurahRaw && startAyahRaw) {
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

  // Required end position
  const endSurah = parseInt((body.end_surah as string) || "", 10);
  const endAyah = parseInt((body.end_ayah as string) || "", 10);

  const surahMeta = SURAHS.find((s) => s.number === endSurah);
  if (!surahMeta) return { ok: false, error: t(lang, "invalidSurah") };
  if (!Number.isInteger(endAyah) || endAyah < 1 || endAyah > surahMeta.totalAyahs) {
    return {
      ok: false,
      error: `${t(lang, "ayahMustBeBetween")} ${surahMeta.totalAyahs} ${t(lang, "forSurah")} ${surahMeta.name}.`,
    };
  }

  const endJuz = getJuzForPosition(endSurah, endAyah);

  if (needsAutoCalc) {
    if (startSurah === null || startAyah === null) {
      return { ok: false, error: t(lang, "autoCalcNeedsStart") };
    }
    if (logUnit === "pages") {
      const startPage = getPageForPosition(startSurah, startAyah);
      const endPage = getPageForPosition(endSurah, endAyah);
      const pageDiff = endPage - startPage + 1;
      if (pageDiff <= 0) {
        return { ok: false, error: t(lang, "autoCalcNegative") };
      }
      logAmount = pageDiff;
      juzAmount = pageDiff / 20;
    } else {
      if (startJuz === null) {
        return { ok: false, error: t(lang, "autoCalcNeedsStart") };
      }
      const diff = endJuz - startJuz;
      if (diff < 0) {
        return { ok: false, error: t(lang, "autoCalcNegative") };
      }
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
      endSurahName: surahMeta.name,
      repetitionCount,
    },
  };
}
