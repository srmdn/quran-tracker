import type { FC } from "hono/jsx";
import { Icon } from "./Icon.tsx";
import { CsrfInput } from "./CsrfInput.tsx";
import { SURAHS } from "../../data/quran-meta.ts";
import { t, type Lang } from "../../lib/i18n.ts";
import { formatLogAmount } from "../../lib/format-juz.ts";

export type LogFormInitial = {
  juzAmount?: number;
  logUnit?: string | null;
  logAmount?: number | null;
  startSurah?: number | null;
  startAyah?: number | null;
  endSurah?: number | null;
  endAyah?: number | null;
  repetitionCount?: number | null;
};

export type LogFormLastEntry = {
  date_wib: string;
  juz_amount: number;
  log_unit: string | null;
  log_amount: number | null;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
};

function longDate(ymd: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${ymd}T00:00:00Z`));
}

export const LogForm: FC<{
  kind: "tilawah" | "murojaah";
  lang: Lang;
  todayWib: string;
  lastLog?: LogFormLastEntry | null;
  hasRepetition?: boolean;
  action?: string;
  dateValue?: string;
  dateDisabled?: boolean;
  title?: string;
  submitLabel?: string;
  cancelHref?: string;
  initial?: LogFormInitial;
}> = ({
  kind,
  lang,
  todayWib,
  lastLog = null,
  hasRepetition = false,
  action: actionProp,
  dateValue,
  dateDisabled = false,
  title: titleProp,
  submitLabel,
  cancelHref = "/dashboard",
  initial,
}) => {
  const prefix = `log-${kind}`;
  const action = actionProp ?? (kind === "tilawah" ? "/tilawah" : "/murojaah");
  const title = titleProp ?? (kind === "tilawah" ? t(lang, "logTilawah") : t(lang, "logMurojaah"));
  const saveLabel = submitLabel ?? (kind === "tilawah" ? t(lang, "saveTilawah") : t(lang, "saveMurojaah"));
  const resolvedDate = dateValue ?? todayWib;
  const initialUnit = initial ? (initial.logUnit === "pages" ? "pages" : "juz") : "pages";
  const initialJuzAmount = initial
    ? Math.max(1, Math.round(initial.logAmount ?? initial.juzAmount ?? 1))
    : 1;
  const initialPagesAmount = initial?.logUnit === "pages" ? (initial.logAmount ?? 0) : 0;
  const initialPagesWhole = Math.floor(initialPagesAmount);
  const initialPagesHalf = initialPagesAmount % 1 !== 0;
  const initialSummaryValue = initialUnit === "pages" ? initialPagesAmount : initialJuzAmount;
  const initialSummaryAmount = `${initialSummaryValue} ${initialUnit === "pages" ? t(lang, "inputModePages") : t(lang, "inputModeJuz")}`;
  const initialSummaryEquivalent = initialUnit === "pages"
    ? `${(initialSummaryValue / (604 / 30)).toFixed(2)} ${t(lang, "inputModeJuz")}`
    : `${Math.round(initialSummaryValue * (604 / 30) * 100) / 100} ${t(lang, "inputModePages")}`;
  const minDate = new Date(`${todayWib}T00:00:00Z`); minDate.setUTCDate(minDate.getUTCDate()-1);
  const minDateYmd = minDate.toISOString().slice(0,10);
  const lastSurah = lastLog?.end_surah
    ? SURAHS.find((surah) => surah.number === lastLog.end_surah)
    : null;

  return (
    <form
      method="post"
      action={action}
      class="card log-form reveal reveal-delay-1"
      data-log-form
      data-unit-juz={t(lang, "inputModeJuz")}
      data-unit-pages={t(lang, "inputModePages")}
      data-unit-conversion-note={t(lang,"visualPageConversion")}
      data-juz-unit-note={t(lang,"visualWholeJuz")}
    >
      <CsrfInput />
      <h2>{title}</h2>
      <p class="form-intro">{longDate(resolvedDate, lang)} · WIB</p>

      {lastLog && !dateDisabled && (
        <div class="continue-box">
          <div class="icon-wrap">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H20v16H5.5A2.5 2.5 0 0 0 3 21.5z" />
              <path d="M3 5.5v16M7 7h9M7 11h7" />
            </svg>
          </div>
          <div>
            {lastSurah && lastLog.end_juz !== null && lastLog.end_ayah !== null ? (
              <>
                <strong>
                  {t(lang, "logContinueFrom")} Juz {lastLog.end_juz} · {lastSurah.name} {lastLog.end_ayah}
                </strong>
                <span>{t(lang, "loggedOn")} {longDate(lastLog.date_wib, lang)}</span>
              </>
            ) : (
              <>
                <strong>
                  {t(lang, "logLastEntry")}: {formatLogAmount(lastLog.juz_amount, lastLog.log_unit, lastLog.log_amount, lang)}
                </strong>
                <span>{t(lang, "noPositionRecorded")}</span>
              </>
            )}
          </div>
        </div>
      )}

      {lastSurah && lastLog?.end_ayah && !dateDisabled && (lastSurah.number < 114 || lastLog.end_ayah < lastSurah.totalAyahs) && (
        <button class="continue-position" type="button" data-continue-surah={lastSurah.number}
          data-continue-ayah={lastLog.end_ayah}>{t(lang,"visualContinue")} <Icon name="arrow" size={14}/></button>
      )}
      <div class="form-grid-2">
        <div class="field">
          <label for={`${prefix}-date`}>{t(lang, "dateWib")}</label>
          <input
            id={`${prefix}-date`}
            type="date"
            name="date_wib"
            value={resolvedDate}
            min={dateDisabled ? resolvedDate : minDateYmd}
            max={todayWib}
            disabled={dateDisabled}
            required
          />
        </div>
        <div class="field">
          <label>{t(lang, "logUnitLabel")}</label>
          <div class="segmented" role="group" aria-label={t(lang, "logUnitLabel")}>
            <button type="button" data-log-unit="juz" aria-pressed={initialUnit === "juz" ? "true" : "false"}>{t(lang, "inputModeJuz")}</button>
            <button type="button" data-log-unit="pages" aria-pressed={initialUnit === "pages" ? "true" : "false"}>{t(lang, "inputModePages")}</button>
          </div>
          <input type="hidden" name="input_mode" value={initialUnit} data-log-mode />
        </div>
      </div>

      <div class="field">
        <label for={initialUnit === "pages" ? `${prefix}-pages` : `${prefix}-amount`}>{t(lang, "logAmountLabel")}</label>
        <div class="amount-row" aria-label={t(lang, "logQuickAmount")}>
          <button class="amount-chip" type="button" data-log-preset data-unit="juz" data-amount="1">1 juz</button>
          <button class="amount-chip" type="button" data-log-preset data-unit="juz" data-amount="2">2 juz</button>
          <button class="amount-chip" type="button" data-log-preset data-unit="pages" data-amount="5">5 {t(lang, "inputModePages")}</button>
          <button class="amount-chip" type="button" data-log-preset data-unit="pages" data-amount="10">10 {t(lang, "inputModePages")}</button>
          <div data-log-juz hidden={initialUnit === "pages"}>
            <input
              class="amount-input"
              id={`${prefix}-amount`}
              aria-label={t(lang,"visualAmountJuz")}
              type="number"
              name="amount"
              min="1"
              max="30"
              step="1"
              value={initialJuzAmount}
              inputmode="numeric"
              data-log-amount
            />
          </div>
          <div data-log-pages hidden={initialUnit !== "pages"}>
            <input
              class="amount-input"
              id={`${prefix}-pages`}
              aria-label={t(lang,"visualAmountPages")}
              type="number"
              name="pages_whole"
              min="0"
              max="604"
              step="1"
              placeholder="10"
              value={initialPagesWhole || ""}
              inputmode="numeric"
              data-log-pages-whole
            />
            <label class="check-inline">
              <input type="checkbox" name="pages_half" checked={initialPagesHalf} data-log-pages-half />
              {t(lang, "logHalfPage")}
            </label>
          </div>
        </div>
        <p class="field-hint" data-log-hint>{t(lang, "logAmountHint")}</p>
      </div>

      <div class="summary-box" aria-live="polite">
        <div>
          <span>{t(lang, "logSummary")}</span>
          <strong data-log-summary-amount>{initialSummaryAmount}</strong>
        </div>
        <div style="text-align:right">
          <span>{t(lang, "logEquivalent")}</span>
          <strong data-log-summary-equivalent>{initialSummaryEquivalent}</strong>
        </div>
      </div>

      {hasRepetition && (
        <div class="field" style="margin-top:18px">
          <label for={`${prefix}-repetition`}>{t(lang, "repetitionCount")}</label>
          <input
            id={`${prefix}-repetition`}
            type="number"
            name="repetition_count"
            min="1"
            max="100"
            step="1"
            value={initial?.repetitionCount ?? ""}
            inputmode="numeric"
          />
          <p class="field-hint">{t(lang, "repetitionCountHint")} {t(lang,"visualRepeatHint")}</p>
        </div>
      )}

      <section class="detail-drawer reading-position" aria-labelledby={`${prefix}-position-title`}>
        <div class="position-head"><h3 id={`${prefix}-position-title`}>{t(lang,"visualPositionTitle")}</h3><span>{t(lang,"visualOptional")}</span></div>
        <div class="detail-grid">
          <div class="field">
            <label for={`${prefix}-start-surah`}>{t(lang,"visualStartSurah")}</label>
            <select id={`${prefix}-start-surah`} name="start_surah">
              <option value="">{lang === "id" ? "Pilih surah..." : "Select surah..."}</option>
              {SURAHS.map((surah) => (
                <option value={String(surah.number)} data-total-ayahs={surah.totalAyahs} selected={initial?.startSurah === surah.number}>{surah.number}. {surah.name}</option>
              ))}
            </select>
          </div>
          <div class="field">
            <label for={`${prefix}-start-ayah`}>{t(lang,"visualStartAyah")}</label>
            <input id={`${prefix}-start-ayah`} type="number" name="start_ayah" min="1" max={SURAHS.find(s=>s.number===initial?.startSurah)?.totalAyahs} step="1" value={initial?.startAyah ?? ""} inputmode="numeric" />
          </div>
          <div class="field">
            <label for={`${prefix}-end-surah`}>{t(lang,"visualEndSurah")}</label>
            <select id={`${prefix}-end-surah`} name="end_surah">
              <option value="">{lang === "id" ? "Pilih surah..." : "Select surah..."}</option>
              {SURAHS.map((surah) => (
                <option value={String(surah.number)} data-total-ayahs={surah.totalAyahs} selected={initial?.endSurah === surah.number}>{surah.number}. {surah.name}</option>
              ))}
            </select>
          </div>
          <div class="field">
            <label for={`${prefix}-end-ayah`}>{t(lang,"visualEndAyah")}</label>
            <input id={`${prefix}-end-ayah`} type="number" name="end_ayah" min="1" max={SURAHS.find(s=>s.number===initial?.endSurah)?.totalAyahs} step="1" value={initial?.endAyah ?? ""} inputmode="numeric" />
          </div>
        </div>
        <p class="field-hint">{t(lang, "logDetailHint")}</p>
      </section>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit" style="flex:1">{saveLabel}</button>
        <a class="btn btn-secondary" href={cancelHref}>
          {lang === "id" ? "Batal" : "Cancel"}
        </a>
      </div>
    </form>
  );
};
