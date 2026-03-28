import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { SURAHS } from "../../data/quran-meta.ts";
import { APP_NAME } from "../../config.ts";
import type { UserTarget } from "../../lib/targets.ts";
import { t, type Lang } from "../../lib/i18n.ts";

type LogEntry = {
  id: number;
  date_wib: string;
  juz_amount: number;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
  created_at: string;
};

function fmtWibTime(utcStr: string): string {
  return new Date(utcStr.replace(" ", "T") + "Z").toLocaleString("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export const TilawahPage: FC<{
  user: User;
  lang: Lang;
  success?: string;
  error?: string;
  todayWib: string;
  todayTotal: number;
  target: UserTarget;
  lastLog: LogEntry | null;
  recentLogs: LogEntry[];
  allTimeJuz: number;
  thisMonthJuz: number;
  totalKhatam: number;
  page: number;
  totalLogs: number;
  perPage: number;
}> = ({ user, lang, success, error, todayWib, todayTotal, target, lastLog, recentLogs, allTimeJuz, thisMonthJuz, totalKhatam, page, totalLogs, perPage }) => {
  const totalPages = Math.max(1, Math.ceil(totalLogs / perPage));
  const todayPercent = Math.min(100, Math.round((todayTotal / target.tilawah_juz_daily) * 100));
  const lastSurahName = lastLog?.end_surah ? SURAHS.find((s) => s.number === lastLog.end_surah)?.name : null;

  return (
    <Layout title={`Tilawah - ${APP_NAME}`}>
      <Header user={user} currentPath="/tilawah" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">

        <div class="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 class="text-text-main text-3xl font-black leading-tight tracking-[-0.033em]">Tilawah</h1>
            <p class="text-text-secondary text-sm">{t(lang, "tilawahSubtitle")}</p>
          </div>
          <a href="/murojaah" class="px-4 py-2.5 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-main hover:bg-slate-50">
            {t(lang, "switchToMurojaah")}
          </a>
        </div>

        {success && (
          <div class="w-full bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-4 border border-emerald-200">{success}</div>
        )}
        {error && (
          <div class="w-full bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200">{error}</div>
        )}

        {/* Today progress */}
        <div class="w-full bg-white border border-border-light rounded-xl p-6 mb-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-text-main font-bold">{t(lang, "todayProgress")}</h2>
            <span class="text-sm font-semibold text-text-secondary">{todayTotal}/{target.tilawah_juz_daily} {t(lang, "juz")}</span>
          </div>
          <div class="w-full h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden mb-1">
            <div class={`h-full rounded-full ${todayPercent >= 100 ? "bg-emerald-500" : "bg-primary"}`} style={`width: ${todayPercent}%`} />
          </div>
          <p class="text-xs text-text-secondary">{todayPercent >= 100 ? t(lang, "dailyTargetMet") : `${target.tilawah_juz_daily - todayTotal > 0 ? (target.tilawah_juz_daily - todayTotal).toFixed(1) : 0} ${t(lang, "juzRemainingTarget")}`}</p>
        </div>

        {/* Last position */}
        {lastLog && lastLog.end_surah && (
          <div class="w-full bg-primary-light border border-primary/20 rounded-xl p-5 mb-6">
            <p class="text-xs font-bold text-primary uppercase mb-1">{t(lang, "lastRecordedPosition")}</p>
            <p class="text-text-main font-bold">
              Juz {lastLog.end_juz} &bull; {lastSurahName} &bull; Ayah {lastLog.end_ayah}
            </p>
            <p class="text-xs text-text-secondary mt-1">{t(lang, "loggedOn")} {lastLog.date_wib}</p>
          </div>
        )}

        <div class="w-full grid md:grid-cols-2 gap-6 mb-8">
          {/* Log form */}
          <div class="bg-white border border-border-light rounded-xl p-6">
            <h3 class="text-text-main text-lg font-bold mb-4">{t(lang, "logTilawah")}</h3>
            <form method="post" action="/tilawah" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">{t(lang, "dateWib")}</label>
                <input type="date" name="date_wib" value={todayWib}
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">{t(lang, "juzAmount")}</label>
                <input type="number" name="juz_amount" min="0.01" max="30" step="0.01" placeholder="e.g. 1.5"
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required />
              </div>
              <div class="border-t border-border-light pt-4">
                <p class="text-xs font-bold text-text-secondary mb-3">{t(lang, "endingPosition")}</p>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-semibold text-text-secondary mb-1">Surah</label>
                    <select name="end_surah" id="til-surah-sel"
                      data-last={String(lastLog?.end_surah ?? "")}
                      class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required>
                      <option value="">Select surah...</option>
                      {SURAHS.map((s) => (
                        <option value={String(s.number)}>
                          {s.number}. {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-text-secondary mb-1">Ayah</label>
                    <input type="number" name="end_ayah" id="til-ayah-inp" min="1" step="1" placeholder="e.g. 25"
                      class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required />
                    <p id="til-ayah-hint" class="text-xs text-text-secondary mt-1"></p>
                  </div>
                </div>
              </div>
              <button type="submit"
                class="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors">
                {t(lang, "saveTilawah")}
              </button>
            </form>
            <script dangerouslySetInnerHTML={{ __html: `(function(){var AC=${JSON.stringify(Object.fromEntries(SURAHS.map(s => [s.number, s.totalAyahs])))};var sel=document.getElementById('til-surah-sel');var hint=document.getElementById('til-ayah-hint');function upd(){var v=parseInt(sel.value,10);hint.textContent=v&&AC[v]?'max: '+AC[v]:'';}sel.addEventListener('change',upd);var last=sel.getAttribute('data-last');if(last){sel.value=last;upd();}})();` }} />
          </div>

          {/* Stats */}
          <div class="flex flex-col gap-4">
            <div class="bg-white border border-border-light rounded-xl p-5">
              <p class="text-xs text-text-secondary mb-1">{t(lang, "thisMonthTilawahStat")}</p>
              <p class="text-3xl font-black text-text-main">{thisMonthJuz.toFixed(1)} <span class="text-base font-medium text-text-secondary">{t(lang, "juz")}</span></p>
            </div>
            <div class="bg-white border border-border-light rounded-xl p-5">
              <p class="text-xs text-text-secondary mb-1">{t(lang, "allTimeTilawahStat")}</p>
              <p class="text-3xl font-black text-text-main">{allTimeJuz} <span class="text-base font-medium text-text-secondary">{t(lang, "juz")}</span></p>
            </div>
            <div class="bg-white border border-border-light rounded-xl p-5">
              <p class="text-xs text-text-secondary mb-1">Total Khatam</p>
              <p class="text-3xl font-black text-primary">{totalKhatam}</p>
              <p class="text-xs text-text-secondary mt-1">{t(lang, "verifiedCompletions")}</p>
            </div>
            <a href="/activity/leaderboard"
              class="bg-white border border-border-light rounded-xl p-5 hover:bg-slate-50 transition-colors text-center">
              <p class="text-sm font-bold text-primary">{t(lang, "viewLeaderboard")}</p>
            </a>
          </div>
        </div>

        {/* Recent logs */}
        <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-border-light bg-slate-50/50 flex items-center justify-between">
            <h3 class="text-text-main text-lg font-bold">{t(lang, "tilawahLogs")}</h3>
            <span class="text-xs text-text-secondary">{totalLogs} {t(lang, "entries")}</span>
          </div>
          <div class="divide-y divide-border-light">
            {recentLogs.length === 0 ? (
              <div class="px-6 py-10 text-center text-text-secondary text-sm">{t(lang, "noTilawahYet")}</div>
            ) : (() => {
                const cutoff = new Date(todayWib);
                cutoff.setDate(cutoff.getDate() - 6);
                const cutoffStr = cutoff.toISOString().slice(0, 10);
                return recentLogs.map((log) => {
                  const surahName = log.end_surah ? SURAHS.find((s) => s.number === log.end_surah)?.name : null;
                  const canDelete = log.date_wib >= cutoffStr;
                  return (
                    <div class="px-6 py-4 flex items-center justify-between gap-4">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-text-main">{log.juz_amount} {t(lang, "juz")}</p>
                        {surahName ? (
                          <p class="text-xs text-text-secondary">
                            {t(lang, "endedAt")} Juz {log.end_juz} &bull; {surahName} : {log.end_ayah}
                          </p>
                        ) : (
                          <p class="text-xs text-text-secondary">{t(lang, "noPositionRecorded")}</p>
                        )}
                      </div>
                      <div class="flex items-center gap-3 flex-shrink-0">
                        <div class="text-right">
                          <span class="text-xs text-text-secondary block">{log.date_wib}</span>
                          <span class="text-xs text-text-secondary/60">{fmtWibTime(log.created_at)} WIB</span>
                        </div>
                        {canDelete && (
                          <form method="POST" action={`/tilawah/logs/${log.id}/delete`}
                            onsubmit="return confirm('Delete this entry?')">
                            <button type="submit" title={t(lang, "delete")}
                              class="text-slate-400 hover:text-red-500 transition-colors">
                              <span class="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                });
              })()
            }
          </div>
          {totalPages > 1 && (
            <div class="px-6 py-4 border-t border-border-light bg-slate-50/50 flex items-center justify-between gap-4">
              <span class="text-xs text-text-secondary">{t(lang, "page")} {page} {t(lang, "of")} {totalPages}</span>
              <div class="flex items-center gap-2">
                {page > 1 && (
                  <a href={`/tilawah?page=${page - 1}`}
                    class="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors">
                    {t(lang, "prev")}
                  </a>
                )}
                {page < totalPages && (
                  <a href={`/tilawah?page=${page + 1}`}
                    class="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors">
                    {t(lang, "next")}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};
