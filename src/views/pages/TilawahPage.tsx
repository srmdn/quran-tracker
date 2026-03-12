import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { SURAHS } from "../../data/quran-meta.ts";
import { APP_NAME } from "../../config.ts";
import type { UserTarget } from "../../lib/targets.ts";

type LogEntry = {
  id: number;
  date_wib: string;
  juz_amount: number;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
  created_at: string;
};

export const TilawahPage: FC<{
  user: User;
  success?: string;
  error?: string;
  todayWib: string;
  todayTotal: number;
  target: UserTarget;
  lastLog: LogEntry | null;
  recentLogs: LogEntry[];
  allTimeJuz: number;
  totalKhatam: number;
}> = ({ user, success, error, todayWib, todayTotal, target, lastLog, recentLogs, allTimeJuz, totalKhatam }) => {
  const todayPercent = Math.min(100, Math.round((todayTotal / target.tilawah_juz_daily) * 100));
  const lastSurahName = lastLog?.end_surah ? SURAHS.find((s) => s.number === lastLog.end_surah)?.name : null;

  return (
    <Layout title={`Tilawah - ${APP_NAME}`}>
      <Header user={user} currentPath="/tilawah" />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">

        <div class="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 class="text-text-main text-3xl font-black leading-tight tracking-[-0.033em]">Tilawah</h1>
            <p class="text-text-secondary text-sm">Log your Quran recitation (WIB).</p>
          </div>
          <a href="/murojaah" class="px-4 py-2.5 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-main hover:bg-slate-50">
            Switch to Murojaah →
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
            <h2 class="text-text-main font-bold">Today's Progress</h2>
            <span class="text-sm font-semibold text-text-secondary">{todayTotal}/{target.tilawah_juz_daily} juz</span>
          </div>
          <div class="w-full h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden mb-1">
            <div class={`h-full rounded-full ${todayPercent >= 100 ? "bg-emerald-500" : "bg-primary"}`} style={`width: ${todayPercent}%`} />
          </div>
          <p class="text-xs text-text-secondary">{todayPercent >= 100 ? "✓ Daily target met!" : `${target.tilawah_juz_daily - todayTotal > 0 ? (target.tilawah_juz_daily - todayTotal).toFixed(1) : 0} juz remaining to meet today's target`}</p>
        </div>

        {/* Last position */}
        {lastLog && lastLog.end_surah && (
          <div class="w-full bg-primary-light border border-primary/20 rounded-xl p-5 mb-6">
            <p class="text-xs font-bold text-primary uppercase mb-1">Last Recorded Position</p>
            <p class="text-text-main font-bold">
              Juz {lastLog.end_juz} &bull; {lastSurahName} &bull; Ayah {lastLog.end_ayah}
            </p>
            <p class="text-xs text-text-secondary mt-1">Logged on {lastLog.date_wib}</p>
          </div>
        )}

        <div class="w-full grid md:grid-cols-2 gap-6 mb-8">
          {/* Log form */}
          <div class="bg-white border border-border-light rounded-xl p-6">
            <h3 class="text-text-main text-lg font-bold mb-4">Log Tilawah</h3>
            <form method="post" action="/tilawah" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">Date (WIB)</label>
                <input type="date" name="date_wib" value={todayWib}
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">Juz Amount</label>
                <input type="number" name="juz_amount" min="0.01" max="30" step="0.01" placeholder="e.g. 1.5"
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required />
              </div>
              <div class="border-t border-border-light pt-4">
                <p class="text-xs font-bold text-text-secondary mb-3">Ending Position</p>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-semibold text-text-secondary mb-1">Surah</label>
                    <select name="end_surah" class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required>
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
                    <input type="number" name="end_ayah" min="1" step="1" placeholder="e.g. 25"
                      class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required />
                  </div>
                </div>
              </div>
              <button type="submit"
                class="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors">
                Save Tilawah
              </button>
            </form>
          </div>

          {/* Stats */}
          <div class="flex flex-col gap-4">
            <div class="bg-white border border-border-light rounded-xl p-5">
              <p class="text-xs text-text-secondary mb-1">All-time Tilawah</p>
              <p class="text-3xl font-black text-text-main">{allTimeJuz} <span class="text-base font-medium text-text-secondary">juz</span></p>
            </div>
            <div class="bg-white border border-border-light rounded-xl p-5">
              <p class="text-xs text-text-secondary mb-1">Total Khatam</p>
              <p class="text-3xl font-black text-primary">{totalKhatam}</p>
              <p class="text-xs text-text-secondary mt-1">Verified completions (reached An-Nas)</p>
            </div>
            <a href="/activity/leaderboard"
              class="bg-white border border-border-light rounded-xl p-5 hover:bg-slate-50 transition-colors text-center">
              <p class="text-sm font-bold text-primary">View Leaderboard →</p>
            </a>
          </div>
        </div>

        {/* Recent logs */}
        <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-border-light bg-slate-50/50">
            <h3 class="text-text-main text-lg font-bold">Recent Tilawah Logs</h3>
          </div>
          <div class="divide-y divide-border-light">
            {recentLogs.length === 0 ? (
              <div class="px-6 py-10 text-center text-text-secondary text-sm">No tilawah logged yet.</div>
            ) : (
              recentLogs.map((log) => {
                const surahName = log.end_surah ? SURAHS.find((s) => s.number === log.end_surah)?.name : null;
                return (
                  <div class="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p class="text-sm font-semibold text-text-main">{log.juz_amount} juz</p>
                      {surahName ? (
                        <p class="text-xs text-text-secondary">
                          Ended at Juz {log.end_juz} &bull; {surahName} : {log.end_ayah}
                        </p>
                      ) : (
                        <p class="text-xs text-text-secondary">No position recorded</p>
                      )}
                    </div>
                    <span class="text-xs text-text-secondary">{log.date_wib}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};
