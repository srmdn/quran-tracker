import { ActivityHistory } from "../components/ActivityHistory.tsx";
import { JuzCoverage } from "../components/JuzCoverage.tsx";
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
    value: unit === "pages" ? Math.round(juz * PAGES_PER_JUZ * 100) / 100 : Math.round(juz * 100) / 100,
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

  view: "today" | "progress" | "history";
  kind: "tilawah" | "murojaah";
  coverage: Record<number, number>;
  week: { date: string; tilawah: number; murojaah: number }[];
  lastPositions: RecentLogEntry[];
  historyCount: number;
  historyPage: number;
  historyFilter: "all" | "tilawah" | "murojaah";
}> = (props) => {
  const {user, lang, todayWib, target, todayTilawah, todayMurojaah, streak,
    activityTotals, monthlyRank, heatmap, heatmapYear, heatmapYears, recentLogs,
    fastabiqEntry, totalKhatam, totalActiveUsers, freezeCreditsLeft, todayFrozen,
    hasTodayLog, success, error, view, kind, coverage, week, lastPositions,
    historyCount, historyPage, historyFilter} = props;
  const needsTarget = !target;
  const tilawahTarget = targetValue(target, "tilawah");
  const murojaahTarget = targetValue(target, "murojaah");
  const activeDays = heatmap.filter(cell => cell.count > 0).length;
  const targetMetDays = heatmap.filter(cell => cell.state === "met").length;
  const yearJuz = heatmap.reduce((sum,cell)=>sum+cell.count,0);
  const focusDate = heatmapYear === Number(todayWib.slice(0,4)) ? todayWib : `${heatmapYear}-12-31`;
  const focusIndex = Math.max(0,heatmap.findIndex(cell=>cell.date===focusDate));
  const detailDays = heatmap.filter(cell=>cell.state!=="filler" && cell.date<=todayWib).slice(-14);
  const khatamPercent = Math.min(100,Math.round(activityTotals.progressToNextKhatam/30*100));
  const khatamRemaining = Math.max(0,30-activityTotals.progressToNextKhatam);
  const total = kind === "tilawah" ? todayTilawah : todayMurojaah;
  const goal = target ? (kind === "tilawah" ? target.tilawah_juz_daily : target.murojaah_juz_daily) : 0;
  const unit = kind === "tilawah" ? tilawahTarget.unit : murojaahTarget.unit;
  const percent = goal > 0 ? Math.min(100,Math.round(total/goal*100)) : 0;
  const other = kind === "tilawah" ? "murojaah" : "tilawah";
  const otherTotal = other === "tilawah" ? todayTilawah : todayMurojaah;
  const otherGoal = target ? (other === "tilawah" ? target.tilawah_juz_daily : target.murojaah_juz_daily) : 0;
  const otherUnit = other === "tilawah" ? tilawahTarget.unit : murojaahTarget.unit;
  const position = lastPositions.find(log=>log.type===kind);
  const lastSurah = SURAHS.find(s=>s.number===position?.end_surah);
  const currentPath = view === "today" ? "/dashboard" : `/dashboard/${view}`;
  const title = t(lang,view === "today" ? "visualTodayTitle" : view === "progress" ? "visualNavProgress" : "visualHistoryTitle");
  function amount(juz:number, selected:TargetUnit) {
    return new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(selected === "pages" ? juz*PAGES_PER_JUZ : juz);
  }
  const historyUrl=(filter:string,page=1)=>`/dashboard/history?kind=${filter}&page=${page}`;
  return <MemberLayout title={title} user={user} lang={lang} currentPath={currentPath} showTargetButton>
    <div class="page-head"><div><p class="eyebrow">{longDate(todayWib,lang)}</p><h1>{title}</h1><p>{user.name.split(" ")[0]} · {t(lang,"visualDashboardLead")}</p></div></div>
    {success && <div class="alert alert-success" role="status">{success}</div>}
    {error && <div class="alert alert-error" role="alert">{error}</div>}
    {view === "today" && <div class="visual-dashboard">
      <section class="visual-hero" aria-label={t(lang,"todayProgress")}>
        <div class="hero-types" aria-label={t(lang,"logPageEyebrow")}>
          <a href="/dashboard?kind=tilawah" aria-current={kind==="tilawah"?"true":undefined}><Icon name="book" size={15}/>Tilawah</a>
          <a href="/dashboard?kind=murojaah" aria-current={kind==="murojaah"?"true":undefined}><Icon name="repeat" size={15}/>Murojaah</a>
        </div>
        {target ? <>
          <div class="hero-progress-row"><div><div class={`hero-number${amount(total,unit).length>4?" is-long":""}`}>{amount(total,unit)}<small>/ {amount(goal,unit)}</small></div><p class="hero-caption">{t(lang,unit==="pages"?"inputModePages":"inputModeJuz")} {kind} · {t(lang,"memberNavToday")}</p><p class="hero-note">{total>=goal ? t(lang,"targetMet") : `${amount(goal-total,unit)} ${t(lang,unit==="pages"?"inputModePages":"inputModeJuz")} ${t(lang,"toGo")}`}</p></div>
            <div class="visual-ring" role="img" aria-label={`${kind}: ${percent}%`}><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="40" class="ring-amount" stroke-dasharray={`${percent*2.513} 251.3`}/></svg><strong>{percent}%</strong></div>
          </div>
          <div class="hero-secondary"><div><strong>{other === "tilawah"?"Tilawah":"Murojaah"}</strong><span>{amount(otherTotal,otherUnit)} / {amount(otherGoal,otherUnit)} {t(lang,otherUnit==="pages"?"inputModePages":"inputModeJuz")}</span></div><a class="btn hero-secondary-action" href={`/${other}`}><Icon name="plus" size={14}/>{t(lang,"visualNavLog")}</a></div>
          <a class="btn hero-action" href={`/${kind}`}><Icon name="plus" size={17}/>{t(lang,kind==="tilawah"?"logTilawah":"logMurojaah")}</a>
        </> : <div class="hero-empty"><h2>{t(lang,"memberNoTarget")}</h2><button class="btn hero-action" type="button" data-target-open>{t(lang,"memberSetTarget")}</button></div>}
      </section>
      <section class="visual-position"><Icon name="book" size={18}/><div><span>{t(lang,"memberLastPosition")} · {kind}</span><strong>{position && lastSurah ? `${lastSurah.name} · ayat ${position.end_ayah}` : t(lang,"memberNoPositionYet")}</strong>{position && <small>Juz {position.end_juz} · {shortDate(position.date_wib,lang)}</small>}</div></section>
      <section class="card visual-coverage"><div class="card-head"><h2>{t(lang,"visualCoverageTitle")} · {kind}</h2><span class="small muted">{new Intl.DateTimeFormat("id-ID",{month:"long",timeZone:"UTC"}).format(new Date(todayWib+"T00:00:00Z"))}</span></div><div class="card-body"><JuzCoverage coverage={coverage} lang={lang}/></div></section>
      <section class="card visual-week"><div class="card-head"><h2>{t(lang,"visualWeekTitle")}</h2><span class="small muted">{week.filter(d=>d.tilawah+d.murojaah>0).length} / 7 {t(lang,"days")}</span></div><div class="card-body"><div class="week-days">{week.map(day=><div><span>{new Intl.DateTimeFormat("id-ID",{weekday:"short",timeZone:"UTC"}).format(new Date(day.date+"T00:00:00Z"))}</span><span class={`week-day ${day.date===todayWib?"is-today":""} ${day.tilawah+day.murojaah>0?"has-log":""}`} role="img" aria-label={`${longDate(day.date,lang)}: ${formatJuz(day.tilawah+day.murojaah,lang)}`}>{day.tilawah+day.murojaah>0?<Icon name="check" size={15}/>:Number(day.date.slice(-2))}</span></div>)}</div><a class="week-detail" href="/dashboard/progress">{t(lang,"visualOpenProgress")} <Icon name="arrow" size={13}/></a></div></section>
      <section class="card visual-recent"><div class="card-head"><h2>{t(lang,"recentActivity")}</h2><a class="text-link" href="/dashboard/history">{t(lang,"visualAllRecords")}</a></div><ActivityHistory logs={recentLogs.slice(0,4)} todayWib={todayWib} lang={lang}/></section>
    </div>}
    {view === "progress" && <div class="visual-progress-page">
      <div class="stats-grid"><div class="stat-card"><span>{t(lang,"allTimeTilawah")}</span><strong>{formatJuz(activityTotals.tilawahJuz,lang)}</strong></div><div class="stat-card"><span>{t(lang,"allTimeMurojaah")}</span><strong>{formatJuz(activityTotals.murojaahJuz,lang)}</strong></div><div class="stat-card"><span>{t(lang,"totalKhatam")}</span><strong>{totalKhatam}</strong><small>{t(lang,"verifiedCompletions")}</small></div><a class="stat-card" href="/activity/leaderboard"><span>{t(lang,"monthRank")}</span><strong>{monthlyRank?`#${monthlyRank.rank}`:"-"}</strong><small>{t(lang,"of")} {totalActiveUsers}</small><small>{t(lang,"monthScore")}: {monthlyRank?.score ?? 0} {t(lang,"ptsLabel")}</small></a></div>
      <div class="progress-layout"><div class="stack">
          <section class="card heatmap-card reveal reveal-delay-3" aria-labelledby="heatmap-title">
            <div class="card-head">
              <h2 id="heatmap-title">{t(lang, "memberYearRhythm")}</h2>
              <form method="get" action="/dashboard/progress" class="year-form">
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
      </div><aside class="side-stack">
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

      </aside></div>
    </div>}
    {view === "history" && <section class="card visual-history-page"><div class="card-head"><h2>{t(lang,"visualHistoryTitle")}</h2><span class="small muted">{historyCount} {t(lang,"entries")}</span></div><nav class="history-filters" aria-label={t(lang,"visualFilterRecords")}>{(["all","tilawah","murojaah"] as const).map(filter=><a href={historyUrl(filter)} aria-current={filter===historyFilter?"true":undefined}>{filter==="all"?t(lang,"visualAllKinds"):filter==="tilawah"?"Tilawah":"Murojaah"}</a>)}</nav><ActivityHistory logs={recentLogs} todayWib={todayWib} lang={lang} removable/>{historyCount>20 && <nav class="pager" aria-label={t(lang,"page")}>{historyPage>1?<a href={historyUrl(historyFilter,historyPage-1)}>{t(lang,"prev")}</a>:<span/>}<span>{t(lang,"page")} {historyPage} / {Math.ceil(historyCount/20)}</span>{historyPage<Math.ceil(historyCount/20)?<a href={historyUrl(historyFilter,historyPage+1)}>{t(lang,"next")}</a>:<span/>}</nav>}</section>}
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
                  min="0.01"
                  step="0.01"
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
                  min="0.01"
                  step="0.01"
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

  </MemberLayout>;
};
