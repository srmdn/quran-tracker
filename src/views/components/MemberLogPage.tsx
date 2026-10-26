import type { FC } from "hono/jsx";
import { MemberLayout } from "../MemberLayout.tsx";
import { Icon } from "./Icon.tsx";
import { ActivityHistory } from "./ActivityHistory.tsx";
import { LogForm } from "./LogForm.tsx";
import { SURAHS } from "../../data/quran-meta.ts";
import { t, type Lang } from "../../lib/i18n.ts";
import { formatJuz, formatLogAmount } from "../../lib/format-juz.ts";
import type { UserTarget } from "../../lib/targets.ts";
import type { User } from "../../types.ts";

export type MemberLogEntry = {
  id: number;
  date_wib: string;
  juz_amount: number;
  log_unit: string | null;
  log_amount: number | null;
  repetition_count?: number | null;
  start_surah: number | null;
  start_ayah: number | null;
  start_juz: number | null;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
  created_at: string;
  updated_at: string | null;
};

type Coverage = Record<number, number>;

function shortDate(ymd: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${ymd}T00:00:00Z`));
}

function wibTime(utcStr: string): string {
  return new Date(`${utcStr.replace(" ", "T")}Z`).toLocaleString("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function JuzGrid({ coverage }: { coverage: Coverage }) {
  return (
    <div class="juz-grid" aria-label="Juz coverage">
      {Array.from({ length: 30 }, (_, index) => index + 1).map((juz) => {
        const count = coverage[juz] ?? 0;
        return (
          <div
            class="juz-cell"
            data-level={String(Math.min(4, count))}
            title={`Juz ${juz}: ${count}x`}
          >
            {juz}
          </div>
        );
      })}
    </div>
  );
}

export const MemberLogPage: FC<{
  kind: "tilawah" | "murojaah";
  user: User;
  lang: Lang;
  success?: string;
  error?: string;
  todayWib: string;
  todayTotal: number;
  target: UserTarget;
  lastLog: MemberLogEntry | null;
  recentLogs: MemberLogEntry[];
  allTimeJuz: number;
  thisMonthJuz: number;
  totalKhatam?: number;
  page: number;
  totalLogs: number;
  perPage: number;
  coverage?: { month: Coverage; allTime: Coverage };
}> = ({
  kind,
  user,
  lang,
  success,
  error,
  todayWib,
  todayTotal,
  target,
  lastLog,
  recentLogs,
  allTimeJuz,
  thisMonthJuz,
  totalKhatam,
  page,
  totalLogs,
  perPage,
  coverage,
}) => {
  const isTilawah = kind === "tilawah";
  const targetJuz = isTilawah ? target.tilawah_juz_daily : target.murojaah_juz_daily;
  const targetUnit = isTilawah ? target.tilawah_unit : target.murojaah_unit;
  const percent = targetJuz > 0 ? Math.min(100, Math.round((todayTotal / targetJuz) * 100)) : 0;
  const remaining = Math.max(0, targetJuz - todayTotal);
  const over = Math.max(0, todayTotal - targetJuz);
  const totalPages = Math.max(1, Math.ceil(totalLogs / perPage));
  const targetLabel = targetUnit === "pages"
    ? `${Math.round(targetJuz * (604 / 30))} ${t(lang, "inputModePages")}`
    : `${Math.round(targetJuz)} ${t(lang, "inputModeJuz")}`;
  const cutoff = new Date(`${todayWib}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 6);
  const cutoffYmd = cutoff.toISOString().slice(0, 10);
  const pageTitle = isTilawah ? t(lang, "logTilawah") : t(lang, "logMurojaah");
  const pageSubtitle = isTilawah ? t(lang, "tilawahSubtitle") : t(lang, "murojaahSubtitle");
  const listTitle = isTilawah ? t(lang, "tilawahLogs") : t(lang, "murojaahLogs");
  const emptyText = isTilawah ? t(lang, "noTilawahYet") : t(lang, "noMurojaahYet");

  function positionText(log: MemberLogEntry): string {
    if (log.end_surah === null || log.end_ayah === null || log.end_juz === null) {
      return t(lang, "noPositionRecorded");
    }
    const endSurah = SURAHS.find((surah) => surah.number === log.end_surah)?.name ?? "";
    const end = `${t(lang, "endedAt")} Juz ${log.end_juz} · ${endSurah}:${log.end_ayah}`;
    if (log.start_surah === null || log.start_ayah === null || log.start_juz === null) return end;
    const startSurah = SURAHS.find((surah) => surah.number === log.start_surah)?.name ?? "";
    return `${t(lang, "startedAt")} Juz ${log.start_juz} · ${startSurah}:${log.start_ayah} → ${end}`;
  }

  return (
    <MemberLayout
      title={isTilawah ? "Tilawah" : "Murojaah"}
      description={pageSubtitle}
      user={user}
      lang={lang}
      currentPath={isTilawah ? "/tilawah" : "/murojaah"}
    >
      <div class="page-head reveal">
        <div>
          <p class="eyebrow">{t(lang, "logPageEyebrow")}</p>
          <h1>{pageTitle}</h1>
          <p>{pageSubtitle}</p>
        </div>
        <div class="segmented" aria-label={t(lang, "logPageEyebrow")}>
          <a href="/tilawah" aria-current={isTilawah ? "page" : undefined}>Tilawah</a>
          <a href="/murojaah" aria-current={!isTilawah ? "page" : undefined}>Murojaah</a>
        </div>
      </div>

      {success && <div class="alert alert-success" role="status">{success}</div>}
      {error && <div class="alert alert-error" role="alert">{error}</div>}

      <div class="log-layout">
        <LogForm
          kind={kind}
          lang={lang}
          todayWib={todayWib}
          lastLog={lastLog}
          hasRepetition={!isTilawah}
        />

        <aside class="side-stack">
          <section class="side-note" aria-labelledby="log-progress-title">
            <h3 id="log-progress-title">{t(lang, "logTargetProgress")}</h3>
            <div class="progress-item" style="margin-top:14px">
              <div class="progress-label">
                <span>{isTilawah ? "Tilawah" : "Murojaah"}</span>
                <span class="tabular">{formatJuz(todayTotal, lang)} / {targetLabel}</span>
              </div>
              <div
                class="progress-track"
                role="progressbar"
                aria-label={t(lang, "logTargetProgress")}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={String(percent)}
              >
                <div class={`progress-fill${percent >= 100 ? " teal" : ""}`} style={`width:${percent}%`} />
              </div>
              <p class="small muted" style="margin-top:8px">
                {percent >= 100
                  ? over > 0
                    ? `${t(lang, "targetMet")} ${t(lang, "targetExceeded")} ${formatJuz(over, lang)}`
                    : t(lang, "targetMet")
                  : `${formatJuz(remaining, lang)} ${t(lang, "toGo")}`}
              </p>
            </div>
          </section>

          <div class="stats-grid" style="grid-template-columns:1fr 1fr">
            <div class="stat-card">
              <span>{isTilawah ? t(lang, "thisMonthTilawahStat") : t(lang, "thisMonthMurojaahStat")}</span>
              <strong style="font-size:20px">{formatJuz(thisMonthJuz, lang)}</strong>
            </div>
            <div class="stat-card">
              <span>{isTilawah ? t(lang, "allTimeTilawahStat") : t(lang, "allTimeMurojaahStat")}</span>
              <strong style="font-size:20px">{formatJuz(allTimeJuz, lang)}</strong>
            </div>
            {isTilawah && totalKhatam !== undefined && (
              <div class="stat-card">
                <span>{t(lang, "totalKhatam")}</span>
                <strong style="font-size:20px">{totalKhatam}</strong>
                <small>{t(lang, "verifiedCompletions")}</small>
              </div>
            )}
            <a class="stat-card" href="/activity/leaderboard">
              <span>{t(lang, "leaderboard")}</span>
              <strong style="font-size:16px">{t(lang, "viewLeaderboard")}</strong>
            </a>
          </div>

          {coverage && (
            <section class="card" data-coverage aria-labelledby="coverage-title">
              <div class="card-head">
                <h2 id="coverage-title">{t(lang, "logCoverageTitle")}</h2>
                <div class="segmented" role="group" aria-label={t(lang, "logCoverageTitle")}>
                  <button type="button" data-coverage-tab="month" aria-pressed="true">
                    {t(lang, "logCoverageMonth")}
                  </button>
                  <button type="button" data-coverage-tab="all" aria-pressed="false">
                    {t(lang, "logCoverageAll")}
                  </button>
                </div>
              </div>
              <div class="card-body">
                <p class="small muted" style="margin-bottom:12px">{t(lang, "visualCoverageHint")}</p>
                <div data-coverage-panel="month">
                  <JuzGrid coverage={coverage.month} />
                </div>
                <div data-coverage-panel="all" hidden>
                  <JuzGrid coverage={coverage.allTime} />
                </div>
              </div>
            </section>
          )}

          <section class="side-note" aria-labelledby="last-entries-title">
            <h3 id="last-entries-title">{t(lang, "logLastEntry")}</h3>
            {recentLogs.length === 0 ? (
              <p>{t(lang, "logRecentHint")}</p>
            ) : (
              <div class="mini-log">
                {recentLogs.slice(0, 3).map((log) => (
                  <div class="mini-log-row">
                    <div>
                      <strong>{formatLogAmount(log.juz_amount, log.log_unit, log.log_amount, lang)}</strong>
                      <span>{shortDate(log.date_wib, lang)}</span>
                    </div>
                    <span>{log.end_juz !== null && log.end_surah !== null && log.end_ayah !== null
                      ? `Juz ${log.end_juz} · ${SURAHS.find((surah) => surah.number === log.end_surah)?.name}:${log.end_ayah}`
                      : t(lang, "noPositionRecorded")}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section class="side-note">
            <h3>{t(lang, "logEditWindowTitle")}</h3>
            <p>{t(lang, "logEditWindowText")}</p>
          </section>

          {!isTilawah && (
            <section class="side-note">
              <h3>{t(lang, "aboutMurojaah")}</h3>
              <p>{t(lang, "aboutMurojaahText")}</p>
            </section>
          )}
        </aside>
      </div>

      <section class="card reveal reveal-delay-2" aria-labelledby="log-list-title">
        <div class="card-head">
          <h2 id="log-list-title">{listTitle}</h2>
          <span class="small muted">{totalLogs} {t(lang, "entries")}</span>
        </div>
        {recentLogs.length === 0 ? (
          <div class="card-body empty-state"><p>{emptyText}</p></div>
        ) : (
          <>
            <ActivityHistory logs={recentLogs.map(log=>({...log,type:kind}))} todayWib={todayWib} lang={lang} removable />
            {totalPages > 1 && (
              <div class="pager">
                <div>
                  {page > 1 ? <a href={`/${kind}?page=${page - 1}`}>{t(lang, "prev")}</a> : <span />}
                </div>
                <span>{t(lang, "page")} {page} / {totalPages}</span>
                <div>
                  {page < totalPages ? <a href={`/${kind}?page=${page + 1}`}>{t(lang, "next")}</a> : <span />}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </MemberLayout>
  );
};
