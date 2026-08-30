import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { SURAHS } from "../../data/quran-meta.ts";
import { APP_NAME } from "../../config.ts";
import type { UserTarget } from "../../lib/targets.ts";
import type { UserStreak } from "../../lib/streak.ts";
import type { ActivityTotals, UserMonthlyActivityRank } from "../../lib/activity-calc.ts";
import type { RecentLogEntry, HeatmapCell } from "../../routes/dashboard.tsx";
import { t, type Lang } from "../../lib/i18n.ts";
import { formatJuz, formatLogAmount } from "../../lib/format-juz.ts";
import type { FastabiqEntry } from "../../lib/fastabiq-verses.ts";

export const DashboardPage: FC<{
  user: User;
  lang: Lang;
  todayWib: string;
  target: UserTarget;
  todayTilawah: number;
  todayMurojaah: number;
  streak: UserStreak;
  activityTotals: ActivityTotals;
  monthlyRank: UserMonthlyActivityRank;
  heatmap: HeatmapCell[];
  recentLogs: RecentLogEntry[];
  totalKhatam: number;
  totalActiveUsers: number;
  fastabiqEntry: FastabiqEntry;
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
  recentLogs,
  totalKhatam,
  totalActiveUsers,
  fastabiqEntry,
  freezeCreditsLeft,
  todayFrozen,
  hasTodayLog,
  success,
  error,
}) => {
  const firstName = user.name.split(" ")[0];
  const tilawahPercent = Math.min(100, Math.round((todayTilawah / target.tilawah_juz_daily) * 100));
  const murojaahPercent = Math.min(100, Math.round((todayMurojaah / target.murojaah_juz_daily) * 100));
  const khatamProgressPercent = Math.min(
    100,
    Math.round((activityTotals.progressToNextKhatam / 30) * 100)
  );

  return (
    <Layout title={`Dashboard - ${APP_NAME}`}>
      <Header user={user} currentPath="/dashboard" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">

        {success && (
          <div class="w-full bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-4 border border-emerald-200">{success}</div>
        )}
        {error && (
          <div class="w-full bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200">{error}</div>
        )}

        {/* Compact greeting + streak chip */}
        <div class="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 class="text-text-main text-2xl font-black leading-tight tracking-[-0.033em]">
              Assalamu'alaikum, {firstName}!
            </h1>
            <p class="text-text-secondary text-xs mt-0.5">{t(lang, "todayProgress")} · {todayWib}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            {streak.current_streak > 0 ? (
              <div class="flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-full border border-border-light bg-white">
                <span class="text-base leading-none">{todayFrozen ? "❄️" : "🔥"}</span>
                <span class={`text-sm font-bold ${todayFrozen ? "text-sky-500" : "text-orange-500"}`}>
                  {streak.current_streak} {t(lang, "dayStreak")}
                </span>
                {!hasTodayLog && !todayFrozen && freezeCreditsLeft > 0 && (
                  <form method="POST" action="/dashboard/freeze" class="inline">
                    <button type="submit"
                      class="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors">
                      <span class="material-symbols-outlined text-sm">ac_unit</span>
                      {t(lang, "freezeProtectToday")}
                    </button>
                  </form>
                )}
                {todayFrozen && (
                  <span class="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border border-sky-200 bg-sky-50 text-sky-600">
                    <span class="material-symbols-outlined text-sm">ac_unit</span>
                    {t(lang, "frozenLabel")}
                  </span>
                )}
                {freezeCreditsLeft > 0 && !todayFrozen && (
                  <span class="hidden sm:inline text-xs text-text-secondary">{freezeCreditsLeft} {t(lang, "freezeCreditsLeft")}</span>
                )}
              </div>
            ) : (
              <p class="text-xs text-text-secondary">{t(lang, "startLoggingStreak")}</p>
            )}
            <a
              href="/setup"
              class="flex items-center gap-2 px-3 py-1.5 bg-white border border-border-light rounded-full text-sm font-medium text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
            >
              <span class="material-symbols-outlined text-lg">tune</span>
              {t(lang, "setTargets")}
            </a>
          </div>
        </div>

        {/* Hero: today's progress */}
        <section class="w-full bg-gradient-to-br from-primary/5 to-white border border-primary/15 rounded-2xl p-5 sm:p-6 mb-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Tilawah bar */}
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold text-text-main">Tilawah</span>
                <span class="text-sm font-semibold text-text-secondary">{formatJuz(todayTilawah, lang)} / {target.tilawah_juz_daily} juz</span>
              </div>
              <div class="w-full h-3 rounded-full bg-white border border-slate-200 overflow-hidden">
                <div
                  class={`h-full rounded-full transition-all ${tilawahPercent >= 100 ? "bg-emerald-500" : "bg-primary"}`}
                  style={`width: ${tilawahPercent}%`}
                />
              </div>
              <p class={`text-xs mt-1.5 font-semibold ${tilawahPercent >= 100 ? "text-emerald-600" : "text-text-secondary"}`}>
                {tilawahPercent >= 100
                  ? todayTilawah > target.tilawah_juz_daily
                    ? `${t(lang, "targetMet")} ${t(lang, "targetExceeded")} ${formatJuz(todayTilawah - target.tilawah_juz_daily, lang)}`
                    : t(lang, "targetMet")
                  : `${formatJuz(Math.max(0, target.tilawah_juz_daily - todayTilawah), lang)} ${t(lang, "toGo")}`}
              </p>
            </div>
            {/* Murojaah bar */}
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold text-text-main">Murojaah</span>
                <span class="text-sm font-semibold text-text-secondary">{formatJuz(todayMurojaah, lang)} / {target.murojaah_juz_daily} juz</span>
              </div>
              <div class="w-full h-3 rounded-full bg-white border border-slate-200 overflow-hidden">
                <div
                  class={`h-full rounded-full transition-all ${murojaahPercent >= 100 ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={`width: ${murojaahPercent}%`}
                />
              </div>
              <p class={`text-xs mt-1.5 font-semibold ${murojaahPercent >= 100 ? "text-emerald-600" : "text-text-secondary"}`}>
                {murojaahPercent >= 100
                  ? todayMurojaah > target.murojaah_juz_daily
                    ? `${t(lang, "targetMet")} ${t(lang, "targetExceeded")} ${formatJuz(todayMurojaah - target.murojaah_juz_daily, lang)}`
                    : t(lang, "targetMet")
                  : `${formatJuz(Math.max(0, target.murojaah_juz_daily - todayMurojaah), lang)} ${t(lang, "toGo")}`}
              </p>
            </div>
          </div>

          {/* Quick-log buttons */}
          <div class="grid grid-cols-2 gap-3 mt-5">
            <a
              href="/tilawah"
              class="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors"
            >
              <span class="material-symbols-outlined text-lg">menu_book</span>
              {t(lang, "logTilawah")}
            </a>
            <a
              href="/murojaah"
              class="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
            >
              <span class="material-symbols-outlined text-lg">repeat</span>
              {t(lang, "logMurojaah")}
            </a>
          </div>

          {/* Khatam progress strip */}
          <div class="mt-5 pt-4 border-t border-border-light">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-semibold text-text-main flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary text-base">auto_stories</span>
                {t(lang, "progressToNextKhatam")}
              </span>
              <span class="text-xs font-semibold text-text-secondary">
                {formatJuz(activityTotals.progressToNextKhatam, lang)} / 30 juz
              </span>
            </div>
            <div class="w-full h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
              <div
                class={`h-full rounded-full ${khatamProgressPercent >= 100 ? "bg-emerald-500" : "bg-primary"}`}
                style={`width: ${khatamProgressPercent}%`}
              />
            </div>
            <p class="text-xs text-text-secondary mt-1">
              {khatamProgressPercent >= 100
                ? t(lang, "khatamCompleted")
                : `${formatJuz(Math.max(0, 30 - activityTotals.progressToNextKhatam), lang)} ${t(lang, "toNextKhatam")}`}
            </p>
          </div>
        </section>

        {/* Key stats: 4 numbers */}
        <div class="w-full grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <a href="/activity/leaderboard" class="bg-white border border-border-light rounded-xl p-4 hover:border-primary/30 transition-colors">
            <p class="text-text-secondary text-xs font-medium mb-1">{t(lang, "monthRank")}</p>
            <p class="text-2xl font-black text-primary">
              {monthlyRank ? `#${monthlyRank.rank}` : "-"}
            </p>
            <p class="text-xs text-text-secondary">{t(lang, "of")} {totalActiveUsers}</p>
          </a>
          <div class="bg-white border border-border-light rounded-xl p-4">
            <p class="text-text-secondary text-xs font-medium mb-1">{t(lang, "monthScore")}</p>
            <p class="text-2xl font-black text-text-main">{monthlyRank?.score ?? 0}</p>
            <p class="text-xs text-text-secondary">{t(lang, "ptsLabel")}</p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4">
            <p class="text-text-secondary text-xs font-medium mb-1">{t(lang, "totalKhatam")}</p>
            <p class="text-2xl font-black text-primary">{totalKhatam}</p>
            <p class="text-xs text-text-secondary">{t(lang, "times")}</p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4">
            <p class="text-text-secondary text-xs font-medium mb-1">{t(lang, "bestStreakLabel")}</p>
            <p class="text-2xl font-black text-orange-500">{streak.longest_streak}</p>
            <p class="text-xs text-text-secondary">{t(lang, "days")}</p>
          </div>
        </div>

        {/* Daily reminder: one slim rotating strip */}
        <div class="w-full bg-amber-950 border border-amber-900 rounded-xl px-4 py-2.5 mb-5">
          <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
            <p class="text-amber-400/70 text-[10px] font-bold uppercase tracking-widest shrink-0">
              {lang === "id" ? "Renungan" : "Reminder"}
            </p>
            <p
              class="text-amber-100 text-base sm:text-lg font-black leading-relaxed shrink-0"
              style="font-family: 'Amiri', 'Traditional Arabic', serif; direction: rtl;"
            >
              {fastabiqEntry.verseArabic}
            </p>
            <p class="text-amber-200/80 text-[11px] sm:text-xs italic min-w-0 flex-1">
              "{lang === "en" ? fastabiqEntry.verseEn : fastabiqEntry.verseId}" — {fastabiqEntry.verseRef}
            </p>
          </div>
        </div>

        {/* Recent logs */}
        <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden mb-5">
          <div class="px-4 sm:px-6 py-3.5 border-b border-border-light bg-slate-50/50 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-text-main font-bold">{t(lang, "recentActivity")}</h2>
            <div class="flex items-center gap-4">
              <a href="/tilawah" class="text-xs font-semibold text-primary hover:underline">{t(lang, "allTilawah")}</a>
              <a href="/murojaah" class="text-xs font-semibold text-primary hover:underline">{t(lang, "allMurojaah")}</a>
            </div>
          </div>
          <div class="divide-y divide-border-light">
            {recentLogs.length === 0 ? (
              <div class="px-6 py-8 text-center">
                <p class="text-text-secondary text-sm">{t(lang, "noActivityYet")}</p>
                <div class="flex items-center justify-center gap-3 mt-3">
                  <a href="/tilawah" class="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors">
                    {t(lang, "logTilawah")}
                  </a>
                  <a href="/murojaah" class="px-3 py-1.5 text-xs font-semibold text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors">
                    {t(lang, "logMurojaah")}
                  </a>
                </div>
              </div>
            ) : (
              recentLogs.map((log) => {
                const surahName = log.end_surah
                  ? SURAHS.find((s) => s.number === log.end_surah)?.name
                  : null;
                const isTilawah = log.type === "tilawah";
                return (
                  <div class="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <span
                        class={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${isTilawah ? "bg-primary/10 text-primary" : "bg-amber-50 text-amber-600"}`}
                      >
                        {isTilawah ? "Tilawah" : "Murojaah"}
                      </span>
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-text-main">
                          {formatLogAmount(log.juz_amount, log.log_unit, log.log_amount, lang)}
                          {log.repetition_count ? ` · ${log.repetition_count}x` : ""}
                        </p>
                        {surahName && (
                          <p class="text-xs text-text-secondary truncate">
                            {t(lang, "endedAt")} Juz {log.end_juz} · {surahName} : {log.end_ayah}
                          </p>
                        )}
                      </div>
                    </div>
                    <span class="text-xs text-text-secondary whitespace-nowrap shrink-0">{log.date_wib}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity heatmap (collapsible) */}
        <details class="w-full bg-white border border-border-light rounded-xl overflow-hidden group">
          <summary class="px-6 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between">
            <h2 class="text-text-main font-bold flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">grid_on</span>
              {t(lang, "ninetyDayActivity")}
            </h2>
            <span class="material-symbols-outlined text-text-secondary transition-transform group-open:rotate-180">expand_more</span>
          </summary>
          <div class="px-6 pb-6">
            <div class="flex gap-1.5">
              {/* Day-of-week label column (Mon / Wed / Fri) */}
              <div class="shrink-0 flex flex-col" style="padding-top:16px; gap:2px;">
                {(["", "Mon", "", "Wed", "", "Fri", ""] as string[]).map((lbl) => (
                  <div style="height:12px; width:26px; font-size:9px; color:#94a3b8; line-height:12px; text-align:right; padding-right:4px;">{lbl}</div>
                ))}
              </div>
              {/* Scrollable area: month labels + grid */}
              <div class="overflow-x-auto min-w-0 flex-1 pb-1">
                {(() => {
                  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  const numCols = Math.ceil(heatmap.length / 7);
                  const labels = Array.from({ length: numCols }, (_, i) => {
                    const cell = heatmap[i * 7];
                    if (!cell || cell.state === "filler") return "";
                    const prevCell = i > 0 ? heatmap[(i - 1) * 7] : null;
                    const prevMonth = prevCell && prevCell.state !== "filler" ? prevCell.date.slice(0, 7) : null;
                    if (cell.date.slice(0, 7) !== prevMonth) {
                      return MONTHS[new Date(cell.date + "T00:00:00Z").getUTCMonth()]!;
                    }
                    return "";
                  });
                  return (
                    <div style={`display:grid; grid-template-columns: repeat(${numCols}, 12px); gap:2px; margin-bottom:4px; height:12px;`}>
                      {labels.map((label) => (
                        <div style="font-size:9px; color:#94a3b8; line-height:12px; overflow:visible; white-space:nowrap;">{label}</div>
                      ))}
                    </div>
                  );
                })()}
                {/* Heatmap grid */}
                <div style="display:grid; grid-template-rows: repeat(7, 12px); grid-auto-flow: column; gap:2px;">
                  {heatmap.map((cell) => (
                    cell.state === "filler" ? (
                      <div style="width:12px; height:12px;" />
                    ) : (
                      <div
                        data-hdate={cell.date}
                        data-hcount={String(cell.count)}
                        data-hstate={cell.state}
                        style={`width:12px; height:12px; border-radius:2px;${cell.state === "frozen" ? "background:#bae6fd;border:1px solid #7dd3fc;" : ""}`}
                        class={
                          cell.state === "met"
                            ? "bg-emerald-500"
                            : cell.state === "logged"
                              ? "bg-primary/40"
                              : cell.state === "frozen"
                                ? ""
                                : "bg-slate-100 border border-slate-200"
                        }
                      />
                    )
                  ))}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-4 mt-3 text-xs text-text-secondary flex-wrap">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-sm bg-emerald-500" />
                <span>{t(lang, "targetMetLabel")}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-sm bg-primary/40" />
                <span>{t(lang, "partialLabel")}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div style="width:12px;height:12px;border-radius:2px;background:#bae6fd;border:1px solid #7dd3fc;" />
                <span>{t(lang, "frozenLabel")}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200" />
                <span>{t(lang, "noLogLabel")}</span>
              </div>
            </div>
          </div>
        </details>

        {/* Heatmap tooltip (shared, positioned on hover via JS) */}
        <div
          id="heatmap-tip"
          style="display:none; position:fixed; background:#1e293b; color:#f1f5f9; font-size:11px; font-weight:500; padding:5px 9px; border-radius:5px; pointer-events:none; z-index:50; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.25);"
        />
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=document.getElementById('heatmap-tip');if(!t)return;var M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],D=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];function pos(e){var x=e.clientX+12,y=e.clientY-36;if(x+t.offsetWidth>window.innerWidth-8)x=e.clientX-t.offsetWidth-12;if(y<8)y=e.clientY+12;t.style.left=x+'px';t.style.top=y+'px';}document.querySelectorAll('[data-hdate]').forEach(function(el){el.addEventListener('mouseenter',function(e){var d=el.getAttribute('data-hdate'),c=parseFloat(el.getAttribute('data-hcount')||'0'),s=el.getAttribute('data-hstate')||'',dt=new Date(d+'T00:00:00Z'),lbl=D[dt.getUTCDay()]+', '+dt.getUTCDate()+' '+M[dt.getUTCMonth()]+' '+dt.getUTCFullYear();var act=s==='frozen'?'Streak frozen':(c>0?c+' juz':'No activity');t.textContent=act+' \u00b7 '+lbl;t.style.display='block';pos(e);});el.addEventListener('mousemove',pos);el.addEventListener('mouseleave',function(){t.style.display='none';});});})();` }} />

      </main>
    </Layout>
  );
};
