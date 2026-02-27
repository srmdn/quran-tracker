import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { APP_NAME } from "../../config.ts";

type ActivityTotals = {
  tilawahJuz: number;
  murojaahJuz: number;
  totalJuz: number;
  totalKhatam: number;
  progressToNextKhatam: number;
};

type ActivityLogItem = {
  type: "tilawah" | "murojaah";
  date_wib: string;
  juz_amount: number;
  repetition_count: number | null;
  created_at: string;
};

export const ActivityPage: FC<{
  user: User;
  success?: string;
  error?: string;
  todayWib: string;
  allTime: ActivityTotals;
  currentMonth: ActivityTotals;
  currentMonthRank: number | null;
  currentMonthScore: number | null;
  recentLogs: ActivityLogItem[];
}> = ({
  user,
  success,
  error,
  todayWib,
  allTime,
  currentMonth,
  currentMonthRank,
  currentMonthScore,
  recentLogs,
}) => {
  const nextKhatamPercent = Math.min(
    100,
    Math.round((allTime.progressToNextKhatam / 30) * 100)
  );

  return (
    <Layout title={`Activity Tracker - ${APP_NAME}`}>
      <Header user={user} currentPath="/activity" />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
        <div class="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 class="text-text-main text-3xl font-black leading-tight tracking-[-0.033em]">
              Tilawah &amp; Murojaah Activity
            </h1>
            <p class="text-text-secondary text-base">
              Log your daily Quran activities. Rules are validated server-side (WIB).
            </p>
          </div>
          <a
            href="/activity/leaderboard"
            class="px-4 py-2.5 rounded-lg border border-border-light bg-white text-text-main font-semibold text-sm hover:bg-slate-50"
          >
            View Monthly Activity Leaderboard
          </a>
        </div>

        {success && (
          <div class="w-full bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-4 border border-emerald-200">
            {success}
          </div>
        )}
        {error && (
          <div class="w-full bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200">
            {error}
          </div>
        )}

        <div class="w-full grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs">All-time Tilawah</p>
            <p class="text-2xl font-black text-text-main">{allTime.tilawahJuz}</p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs">All-time Murojaah</p>
            <p class="text-2xl font-black text-text-main">{allTime.murojaahJuz}</p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs">Total Khatam</p>
            <p class="text-2xl font-black text-primary">{allTime.totalKhatam}</p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs">This Month Score</p>
            <p class="text-2xl font-black text-primary">{currentMonthScore ?? 0}</p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs">This Month Rank</p>
            <p class="text-2xl font-black text-text-main">{currentMonthRank ? `#${currentMonthRank}` : "-"}</p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs">Month Tilawah</p>
            <p class="text-2xl font-black text-text-main">{currentMonth.tilawahJuz}</p>
          </div>
        </div>

        <div class="w-full bg-white border border-border-light rounded-xl p-6 mb-8">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-text-main text-lg font-bold">Progress to Next Khatam</h2>
            <span class="text-sm font-semibold text-text-secondary">
              {allTime.progressToNextKhatam}/30 juz
            </span>
          </div>
          <div class="w-full h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
            <div class="h-full bg-primary" style={`width: ${nextKhatamPercent}%`} />
          </div>
        </div>

        <div class="w-full grid md:grid-cols-2 gap-6 mb-8">
          <div class="bg-white border border-border-light rounded-xl p-6">
            <h3 class="text-text-main text-lg font-bold mb-4">Log Tilawah</h3>
            <form method="post" action="/activity/tilawah" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">Date (WIB)</label>
                <input
                  type="date"
                  name="date_wib"
                  value={todayWib}
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">Juz Amount (max 3/day)</label>
                <input
                  type="number"
                  name="juz_amount"
                  min="0.01"
                  max="3"
                  step="0.01"
                  placeholder="e.g. 1.5"
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                class="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark"
              >
                Save Tilawah
              </button>
            </form>
          </div>

          <div class="bg-white border border-border-light rounded-xl p-6">
            <h3 class="text-text-main text-lg font-bold mb-4">Log Murojaah</h3>
            <form method="post" action="/activity/murojaah" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">Date (WIB)</label>
                <input
                  type="date"
                  name="date_wib"
                  value={todayWib}
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">Juz Amount (max 5/day)</label>
                <input
                  type="number"
                  name="juz_amount"
                  min="0.01"
                  max="5"
                  step="0.01"
                  placeholder="e.g. 2.0"
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">Repetition Count (optional)</label>
                <input
                  type="number"
                  name="repetition_count"
                  min="1"
                  step="1"
                  placeholder="e.g. 3"
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
                />
              </div>
              <button
                type="submit"
                class="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark"
              >
                Save Murojaah
              </button>
            </form>
          </div>
        </div>

        <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-border-light bg-slate-50/50">
            <h3 class="text-text-main text-lg font-bold">Recent Activity Logs</h3>
          </div>
          <div class="divide-y divide-border-light">
            {recentLogs.length === 0 ? (
              <div class="px-6 py-10 text-center text-text-secondary text-sm">
                No activity logs yet.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div class="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p class="text-sm font-semibold text-text-main">
                      {log.type === "tilawah" ? "Tilawah" : "Murojaah"} - {log.juz_amount} juz
                    </p>
                    <p class="text-xs text-text-secondary">
                      Date (WIB): {log.date_wib}
                      {log.repetition_count ? ` - Repetition ${log.repetition_count}x` : ""}
                    </p>
                  </div>
                  <span class="text-xs text-text-secondary">{log.created_at.replace("T", " ").slice(0, 16)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};
