import { CsrfInput } from "../components/CsrfInput.tsx";
import type { FC } from "hono/jsx";
import { MemberLayout } from "../MemberLayout.tsx";
import { Icon } from "../components/Icon.tsx";
import type { User } from "../../types.ts";
import { SURAHS } from "../../data/quran-meta.ts";
import type { UserTarget } from "../../lib/targets.ts";
import type { UserStreak } from "../../lib/streak.ts";
import type { ActivityTotals, UserMonthlyActivityRank } from "../../lib/activity-calc.ts";
import type { RecentLogEntry, HeatmapCell } from "../../routes/dashboard.tsx";
import type { FastabiqEntry } from "../../lib/fastabiq-verses.ts";
import { t, type Lang } from "../../lib/i18n.ts";
import { formatJuz, formatLogAmount, PAGES_PER_JUZ } from "../../lib/format-juz.ts";

type TargetUnit = "juz" | "pages";

function longDate(ymd: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${ymd}T00:00:00Z`));
}

function shortDate(ymd: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${ymd}T00:00:00Z`));
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match: string, key: string) => values[key] ?? match);
}

function pagesFromJuz(juz: number): number {
  return Math.round(juz * PAGES_PER_JUZ);
}

function targetValue(target: UserTarget | null, kind: "tilawah" | "murojaah"): {
  unit: TargetUnit;
  value: number;
} {
  if (!target) return { unit: "juz", value: 1 };
  const unit = kind === "tilawah" ? target.tilawah_unit : target.murojaah_unit;
  const juz = kind === "tilawah" ? target.tilawah_juz_daily : target.murojaah_juz_daily;
  return {
    unit,
    value: unit === "pages" ? pagesFromJuz(juz) : Math.round(juz),
  };
}

function heatStatus(cell: HeatmapCell, lang: Lang): string {
  if (cell.state === "met") return t(lang, "memberHeatmapStatusMet");
  if (cell.state === "frozen") return t(lang, "memberHeatmapStatusFrozen");
  if (cell.state === "logged") return t(lang, "memberHeatmapStatusLogged");
  return t(lang, "memberHeatmapStatusEmpty");
}

function heatCellLabel(cell: HeatmapCell, lang: Lang): string {
  const date = longDate(cell.date, lang);
  if (cell.state === "empty") return `${date}. ${t(lang, "memberHeatmapStatusEmpty")}.`;
  if (cell.state === "frozen") return `${date}. ${t(lang, "memberHeatmapStatusFrozen")}.`;
  return `${date}. ${formatJuz(cell.count, lang)}, ${heatStatus(cell, lang)}.`;
}

export const DashboardPage: FC<{
  user: User;
  lang: Lang;
  todayWib: string;
  target: UserTarget | null;
  todayTilawah: number;
  todayMurojaah: number;
  streak: UserStreak;
  activityTotals: ActivityTotals;
  monthlyRank: UserMonthlyActivityRank;
  heatmap: HeatmapCell[];
  heatmapYear: number;
  heatmapYears: number[];
  recentLogs: RecentLogEntry[];
  fastabiqEntry: FastabiqEntry;
  totalKhatam: number;
  totalActiveUsers: number;
  freezeCreditsLeft: number;
  todayFrozen: boolean;
  hasTodayLog: boolean;
  success?: string;
  error?: string;
}> = ({
  user,
  lang,
  todayWib,
  target,
  todayTilawah,
  todayMurojaah,
  streak,
  activityTotals,
  monthlyRank,
  heatmap,
  heatmapYear,
  heatmapYears,
  recentLogs,
  fastabiqEntry,
  totalKhatam,
  totalActiveUsers,
  freezeCreditsLeft,
  todayFrozen,
  hasTodayLog,
  success,
  error,
}) => {
  const firstName = user.name.split(" ")[0];
  const needsTarget = !target;
  const dateLabel = longDate(todayWib, lang);
  const tilawahPercent = target
    ? Math.min(100, Math.round((todayTilawah / target.tilawah_juz_daily) * 100))
    : 0;
  const murojaahPercent = target
    ? Math.min(100, Math.round((todayMurojaah / target.murojaah_juz_daily) * 100))
    : 0;
  const khatamPercent = Math.min(100, Math.round((activityTotals.progressToNextKhatam / 30) * 100));
  const khatamRemaining = Math.max(0, 30 - activityTotals.progressToNextKhatam);
  const lastPosition = recentLogs.find((log) => log.end_surah && log.end_ayah && log.end_juz);
  const lastSurah = lastPosition?.end_surah
    ? SURAHS.find((surah) => surah.number === lastPosition.end_surah)
    : null;
  const editCutoff = new Date(`${todayWib}T00:00:00Z`);
  editCutoff.setUTCDate(editCutoff.getUTCDate() - 6);
  const editCutoffYmd = editCutoff.toISOString().slice(0, 10);
  const activeDays = heatmap.filter((cell) => cell.count > 0).length;
  const targetMetDays = heatmap.filter((cell) => cell.state === "met").length;
  const yearJuz = heatmap.reduce((sum, cell) => sum + cell.count, 0);
  const currentYear = Number(todayWib.slice(0, 4));
  const focusDate = heatmapYear === currentYear ? todayWib : `${heatmapYear}-12-31`;
  const firstFocusIndex = heatmap.findIndex((cell) => cell.date === focusDate);
  const firstDayIndex = heatmap.findIndex((cell) => cell.state !== "filler");
  const focusIndex = firstFocusIndex >= 0 ? firstFocusIndex : firstDayIndex;
  const detailDays = heatmap
    .filter((cell) => cell.state !== "filler" && cell.date <= todayWib)
    .slice(-14);
  const tilawahTarget = targetValue(target, "tilawah");
  const murojaahTarget = targetValue(target, "murojaah");
  const tilawahRemaining = target ? Math.max(0, target.tilawah_juz_daily - todayTilawah) : 0;
  const murojaahRemaining = target ? Math.max(0, target.murojaah_juz_daily - todayMurojaah) : 0;
  const tilawahOver = target ? Math.max(0, todayTilawah - target.tilawah_juz_daily) : 0;
  const murojaahOver = target ? Math.max(0, todayMurojaah - target.murojaah_juz_daily) : 0;

  function targetLabel(unit: TargetUnit, juz: number): string {
    return unit === "pages"
      ? `${pagesFromJuz(juz)} ${t(lang, "inputModePages")}`
      : `${Math.round(juz)} ${t(lang, "inputModeJuz")}`;
  }

  function progressLeft(juz: number): string {
    return `${t(lang, "memberLogged")} ${formatJuz(juz, lang)}`;
  }

  function progressRight(juz: number, over: number): string {
    if (juz <= 0 && over <= 0) return t(lang, "targetMet");
    if (juz <= 0) return `${t(lang, "memberTargetExceeded")} ${formatJuz(over, lang)}`;
    return `${formatJuz(juz, lang)} ${t(lang, "toGo")}`;
  }

  return (
    <MemberLayout
      title={t(lang, "memberNavToday")}
      description={t(lang, "memberDashboardLead")}
      user={user}
      lang={lang}
      currentPath="/dashboard"
      showTargetButton
    >
      <div class="page-head reveal">
        <div>
          <p class="eyebrow">Markaz Talaqqi</p>
          <h1>Assalamu'alaikum, {firstName}.</h1>
          <p>{t(lang, "memberDashboardLead")}</p>
        </div>
        <span class="date-chip">
          <Icon name="calendar" size={14} />
          {dateLabel}
        </span>
      </div>

      {success && <div class="alert alert-success" role="status">{success}</div>}
      {error && <div class="alert alert-error" role="alert">{error}</div>}

      <div class="dash-grid">
        <div class="stack">
          <section class="today-card reveal reveal-delay-1" aria-labelledby="today-title">
            <div class="today-head">
              <div>
                <h2 id="today-title">{t(lang, "memberTodayTitle")}</h2>
                <p>{t(lang, "memberTodayLead")}</p>
              </div>
              {freezeCreditsLeft > 0 && !todayFrozen && (
                <span class="freeze-pill">
                  <Icon name="snow" size={14} />
                  {freezeCreditsLeft} {t(lang, "freezeCreditsLeft")}
                </span>
              )}
              {todayFrozen && (
                <span class="freeze-pill">
                  <Icon name="snow" size={14} />
                  {t(lang, "memberFrozenToday")}
                </span>
              )}
            </div>

            {target ? (
              <>
                <div class="progress-grid">
                  <div class="progress-item">
                    <div class="progress-label">
                      <span>Tilawah</span>
                      <span class="tabular">
                        {formatJuz(todayTilawah, lang)} / {targetLabel(tilawahTarget.unit, target.tilawah_juz_daily)}
                      </span>
                    </div>
                    <div
                      class="progress-track"
                      role="progressbar"
                      aria-label={`Tilawah ${t(lang, "todayProgress")}`}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={String(tilawahPercent)}
                    >
                      <div
                        class={`progress-fill${tilawahPercent >= 100 ? " teal" : ""}`}
                        style={`width:${tilawahPercent}%`}
                      />
                    </div>
                    <div class="progress-meta">
                      <span>{progressLeft(todayTilawah)}</span>
                      <span>{progressRight(tilawahRemaining, tilawahOver)}</span>
                    </div>
                  </div>

                  <div class="progress-item">
                    <div class="progress-label">
                      <span>Murojaah</span>
                      <span class="tabular">
                        {formatJuz(todayMurojaah, lang)} / {targetLabel(murojaahTarget.unit, target.murojaah_juz_daily)}
                      </span>
                    </div>
                    <div
                      class="progress-track"
                      role="progressbar"
                      aria-label={`Murojaah ${t(lang, "todayProgress")}`}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={String(murojaahPercent)}
                    >
                      <div
                        class={`progress-fill${murojaahPercent >= 100 ? " teal" : ""}`}
                        style={`width:${murojaahPercent}%`}
                      />
                    </div>
                    <div class="progress-meta">
                      <span>{progressLeft(todayMurojaah)}</span>
                      <span>{progressRight(murojaahRemaining, murojaahOver)}</span>
                    </div>
                  </div>
                </div>

                <div class="today-actions">
                  <a class="btn btn-primary" href="/tilawah">
                    <Icon name="book" size={17} />
                    {t(lang, "memberContinueTilawah")}
                  </a>
                  <a class="btn btn-secondary" href="/murojaah">
                    <Icon name="repeat" size={17} />
                    {t(lang, "memberRecordMurojaah")}
                  </a>
                </div>
              </>
            ) : (
              <div class="today-empty">
                <p>{t(lang, "memberNoTarget")}</p>
                <button class="btn btn-primary" type="button" data-target-open>
                  <Icon name="target" size={17} />
                  {t(lang, "memberSetTarget")}
                </button>
              </div>
            )}
          </section>

          <div class="last-position reveal reveal-delay-2">
            <div class="icon-wrap">
              <Icon name="book" size={18} />
            </div>
            <div>
              <h3>{t(lang, "memberLastPosition")}</h3>
              {lastPosition && lastSurah ? (
                <>
                  <p>
                    <strong>Juz {lastPosition.end_juz}</strong> · {lastSurah.name} ayat {lastPosition.end_ayah}
                  </p>
                  <p class="small">{t(lang, "loggedOn")} {longDate(lastPosition.date_wib, lang)}</p>
                </>
              ) : (
                <p class="small">{t(lang, "memberNoPositionYet")}</p>
              )}
            </div>
          </div>

          <div class="stats-grid reveal reveal-delay-2">
            <a class="stat-card" href="/activity/leaderboard">
              <span>{t(lang, "monthRank")}</span>
              <strong class="tabular">{monthlyRank ? `#${monthlyRank.rank}` : "-"}</strong>
              <small>{t(lang, "of")} {totalActiveUsers}</small>
            </a>
            <div class="stat-card">
              <span>{t(lang, "monthScore")}</span>
              <strong class="tabular">{monthlyRank?.score ?? 0}</strong>
              <small>{t(lang, "ptsLabel")}</small>
            </div>
            <div class="stat-card">
              <span>{t(lang, "totalKhatam")}</span>
              <strong class="tabular">{totalKhatam}</strong>
              <small>{t(lang, "times")}</small>
            </div>
            <div class="stat-card">
              <span>{t(lang, "bestStreakLabel")}</span>
              <strong class="tabular">{streak.longest_streak}</strong>
              <small>{t(lang, "days")}</small>
            </div>
          </div>

          <section class="card reveal reveal-delay-3" aria-labelledby="activity-title">
            <div class="card-head">
              <h2 id="activity-title">{t(lang, "recentActivity")}</h2>
              <div class="card-links">
                <a href="/tilawah">{t(lang, "allTilawah")}</a>
                <a href="/murojaah">{t(lang, "allMurojaah")}</a>
              </div>
            </div>
            {recentLogs.length === 0 ? (
              <div class="card-body empty-state">
                <p>{t(lang, "memberRecentEmpty")}</p>
                <a class="btn btn-primary btn-sm" href="/tilawah">{t(lang, "logTilawah")}</a>
              </div>
            ) : (
              <div class="activity-list">
                {recentLogs.map((log) => {
                  const surahName = log.end_surah
                    ? SURAHS.find((surah) => surah.number === log.end_surah)?.name
                    : null;
                  const isTilawah = log.type === "tilawah";
                  const canEdit = log.date_wib >= editCutoffYmd;
                  return (
                    <div class="activity-row">
                      <div class={`activity-mark${isTilawah ? "" : " teal"}`}>
                        <Icon name={isTilawah ? "book" : "repeat"} size={17} />
                      </div>
                      <div class="activity-main">
                        <strong>
                          {formatLogAmount(log.juz_amount, log.log_unit, log.log_amount, lang)}
                          {log.repetition_count ? ` · ${log.repetition_count}x` : ""}
                        </strong>
                        <span>
                          {surahName && log.end_juz && log.end_ayah
                            ? `${t(lang, "endedAt")} Juz ${log.end_juz} · ${surahName}: ${log.end_ayah}`
                            : t(lang, "memberLogged")}
                        </span>
                      </div>
                      <div class="activity-side">
                        <span class="activity-date">{shortDate(log.date_wib, lang)}</span>
                        {canEdit && (
                          <a class="activity-edit" href={`/${log.type}/logs/${log.id}/edit`}>
                            {t(lang, "memberEdit")}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section class="card heatmap-card reveal reveal-delay-3" aria-labelledby="heatmap-title">
            <div class="card-head">
              <h2 id="heatmap-title">{t(lang, "memberYearRhythm")}</h2>
              <form method="get" action="/dashboard" class="year-form">
                <label class="sr-only" for="heatmap-year">{t(lang, "memberYear")}</label>
                <select id="heatmap-year" name="year" onchange="this.form.submit()">
                  {heatmapYears.map((year) => (
                    <option value={String(year)} selected={year === heatmapYear}>{year}</option>
                  ))}
                </select>
              </form>
            </div>
            <div class="card-body heatmap-body">
              <div>
                <div class="heatmap-scroll">
                  <div
                    class="heatmap"
                    data-heatmap
                    data-detail="heatmap-detail"
                    role="group"
                    aria-label={`${t(lang, "memberYearRhythm")} ${heatmapYear}: ${activeDays} ${t(lang, "memberActiveDays")}, ${targetMetDays} ${t(lang, "targetMetLabel")}`}
                  >
                    {heatmap.map((cell, index) => (
                      cell.state === "filler" ? (
                        <span class="heat-cell is-filler" aria-hidden="true" />
                      ) : (
                        <button
                          type="button"
                          class="heat-cell"
                          data-heat-date={cell.date}
                          data-heat-count={String(cell.count)}
                          data-heat-state={cell.state}
                          data-level={cell.state === "met" ? "4" : cell.state === "logged" ? "2" : "0"}
                          data-frozen={cell.state === "frozen" ? "true" : undefined}
                          tabindex={index === focusIndex ? 0 : -1}
                          aria-label={heatCellLabel(cell, lang)}
                        />
                      )
                    ))}
                  </div>
                </div>
                <div class="heat-legend">
                  <span><i class="heat-swatch" /> {t(lang, "noLogLabel")}</span>
                  <span><i class="heat-swatch" data-level="2" /> {t(lang, "partialLabel")}</span>
                  <span><i class="heat-swatch" data-level="4" /> {t(lang, "targetMetLabel")}</span>
                  <span><i class="heat-swatch" data-frozen="true" /> {t(lang, "frozenLabel")}</span>
                </div>
                <p class="heatmap-hint small muted">{t(lang, "memberHeatmapHint")}</p>
                <p id="heatmap-detail" class="heatmap-detail small muted" aria-live="polite">
                  {t(lang, "memberHeatmapIdle")}
                </p>
                <details class="heatmap-details">
                  <summary>{t(lang, "memberHeatmapDetails")}</summary>
                  <ul class="heatmap-day-list">
                    {detailDays.map((cell) => (
                      <li>
                        <span>{shortDate(cell.date, lang)}</span>
                        <span>
                          {cell.count > 0 ? formatJuz(cell.count, lang) : t(lang, "memberHeatmapStatusEmpty")}
                          {cell.state === "frozen" ? ` · ${t(lang, "memberHeatmapStatusFrozen")}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
              <div class="heatmap-summary">
                <div><span>{t(lang, "memberActiveDays")}</span><strong>{activeDays}</strong></div>
                <div><span>{t(lang, "dayStreak")}</span><strong>{streak.current_streak}</strong></div>
                <div><span>{t(lang, "memberYearJuz")}</span><strong>{formatJuz(yearJuz, lang)}</strong></div>
              </div>
            </div>
          </section>
        </div>

        <aside class="side-stack">
          <section class="streak-card reveal reveal-delay-2" aria-labelledby="streak-title">
            <div class="streak-top">
              <div class="streak-seal">
                <strong>{streak.current_streak}</strong>
                <span>{t(lang, "days")}</span>
              </div>
              <div>
                <h3 id="streak-title">{t(lang, "memberStreakTitle")}</h3>
                <p>{fill(t(lang, "memberStreakBest"), { days: String(streak.longest_streak) })}</p>
              </div>
            </div>
            <div class="streak-actions">
              {todayFrozen ? (
                <span class="freeze-pill">
                  <Icon name="snow" size={14} />
                  {t(lang, "memberFrozenToday")}
                </span>
              ) : streak.current_streak > 0 && !hasTodayLog && freezeCreditsLeft > 0 ? (
                <form method="post" action="/dashboard/freeze">
                  <CsrfInput />
                  <button class="btn btn-secondary btn-sm" type="submit">
                    <Icon name="snow" size={15} />
                    {t(lang, "freezeProtectToday")}
                  </button>
                </form>
              ) : streak.current_streak === 0 ? (
                <span class="small muted">{t(lang, "startLoggingStreak")}</span>
              ) : null}
              <span class="small muted">
                {freezeCreditsLeft} {t(lang, "freezeCreditsLeft")}
              </span>
            </div>
          </section>

          <section class="verse-mini reveal reveal-delay-3" aria-label={t(lang, "fastabiqDashboardLabel")}>
            <p class="arabic" lang="ar" dir="rtl">{fastabiqEntry.verseArabic}</p>
            <p>{lang === "id" ? fastabiqEntry.verseId : fastabiqEntry.verseEn}</p>
            <span>{fastabiqEntry.verseRef}</span>
          </section>

          <section class="card reveal reveal-delay-3" aria-labelledby="month-title">
            <div class="card-head">
              <h2 id="month-title">{t(lang, "memberMonthTitle")}</h2>
            </div>
            <div class="card-body">
              <div class="progress-item">
                <div class="progress-label">
                  <span>{t(lang, "memberKhatamProgress")}</span>
                  <span class="tabular">
                    {formatJuz(activityTotals.progressToNextKhatam, lang)} / 30
                  </span>
                </div>
                <div
                  class="progress-track"
                  role="progressbar"
                  aria-label={t(lang, "memberKhatamProgress")}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={String(khatamPercent)}
                >
                  <div class="progress-fill" style={`width:${khatamPercent}%`} />
                </div>
              </div>
              <p class="small muted" style="margin-top:12px">
                {khatamRemaining === 0
                  ? t(lang, "khatamCompleted")
                  : fill(t(lang, "memberKhatamRemaining"), { amount: formatJuz(khatamRemaining, lang) })}
              </p>
            </div>
          </section>
        </aside>
      </div>

      <div
        class="modal-backdrop"
        data-target-modal
        data-auto-open={needsTarget ? "true" : undefined}
        data-juz-suffix={t(lang, "memberTargetJuzSuffix")}
        data-pages-suffix={t(lang, "memberTargetPagesSuffix")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="target-title"
        aria-hidden="true"
      >
        <div class="modal">
          <div class="modal-head">
            <div>
              <p class="eyebrow">{t(lang, "memberSetTarget")}</p>
              <h2 id="target-title">{target ? t(lang, "updateDailyTarget") : t(lang, "setDailyTarget")}</h2>
            </div>
            <button class="modal-close" type="button" data-modal-close aria-label={lang === "id" ? "Tutup" : "Close"}>
              <Icon name="close" size={18} />
            </button>
          </div>
          <p class="small muted" style="margin-bottom:18px">{t(lang, "memberTargetLead")}</p>
          <form method="post" action="/dashboard/set-target">
            <CsrfInput />
            <div class="field">
              <label for="target-tilawah-input">{t(lang, "memberTargetTilawah")}</label>
              <div class="segmented" role="group" aria-label={t(lang, "memberTargetTilawah")}>
                <button
                  type="button"
                  data-target-field="tilawah"
                  data-target-unit="juz"
                  aria-pressed={tilawahTarget.unit === "juz" ? "true" : "false"}
                >
                  {t(lang, "inputModeJuz")}
                </button>
                <button
                  type="button"
                  data-target-field="tilawah"
                  data-target-unit="pages"
                  aria-pressed={tilawahTarget.unit === "pages" ? "true" : "false"}
                >
                  {t(lang, "inputModePages")}
                </button>
              </div>
              <input type="hidden" name="tilawah_unit" id="target-tilawah-unit" value={tilawahTarget.unit} />
              <div class="target-input-wrap">
                <input
                  type="number"
                  name="tilawah_juz_daily"
                  id="target-tilawah-input"
                  min="1"
                  step="1"
                  max={tilawahTarget.unit === "pages" ? 604 : 30}
                  value={tilawahTarget.value}
                  required
                />
                <span id="target-tilawah-suffix">
                  {tilawahTarget.unit === "pages"
                    ? t(lang, "memberTargetPagesSuffix")
                    : t(lang, "memberTargetJuzSuffix")}
                </span>
              </div>
            </div>

            <div class="field">
              <label for="target-murojaah-input">{t(lang, "memberTargetMurojaah")}</label>
              <div class="segmented" role="group" aria-label={t(lang, "memberTargetMurojaah")}>
                <button
                  type="button"
                  data-target-field="murojaah"
                  data-target-unit="juz"
                  aria-pressed={murojaahTarget.unit === "juz" ? "true" : "false"}
                >
                  {t(lang, "inputModeJuz")}
                </button>
                <button
                  type="button"
                  data-target-field="murojaah"
                  data-target-unit="pages"
                  aria-pressed={murojaahTarget.unit === "pages" ? "true" : "false"}
                >
                  {t(lang, "inputModePages")}
                </button>
              </div>
              <input type="hidden" name="murojaah_unit" id="target-murojaah-unit" value={murojaahTarget.unit} />
              <div class="target-input-wrap">
                <input
                  type="number"
                  name="murojaah_juz_daily"
                  id="target-murojaah-input"
                  min="1"
                  step="1"
                  max={murojaahTarget.unit === "pages" ? 604 : 30}
                  value={murojaahTarget.value}
                  required
                />
                <span id="target-murojaah-suffix">
                  {murojaahTarget.unit === "pages"
                    ? t(lang, "memberTargetPagesSuffix")
                    : t(lang, "memberTargetJuzSuffix")}
                </span>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-primary" type="submit" style="flex:1">
                {target ? t(lang, "saveChanges") : t(lang, "startTracking")}
              </button>
              <button class="btn btn-secondary" type="button" data-modal-close>
                {lang === "id" ? "Batal" : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MemberLayout>
  );
};
