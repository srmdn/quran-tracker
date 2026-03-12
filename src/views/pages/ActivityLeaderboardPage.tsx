import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import type { MonthlyActivityRow } from "../../lib/activity-calc.ts";
import { APP_NAME } from "../../config.ts";

type EnrichedRow = MonthlyActivityRow & { current_streak: number };

export const ActivityLeaderboardPage: FC<{
  user: User;
  year: number;
  month: number;
  rows: EnrichedRow[];
  total: number;
}> = ({ user, year, month, rows, total }) => {
  const topThree = rows.slice(0, 3);
  const monthLabel = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <Layout title={`Leaderboard - ${APP_NAME}`}>
      <Header user={user} currentPath="/activity/leaderboard" />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        <div class="w-full flex flex-col md:flex-row justify-between items-start gap-3 mb-8">
          <div>
            <h1 class="text-text-main text-3xl font-black">Leaderboard</h1>
            <p class="text-text-secondary text-sm">
              Monthly rankings · {monthLabel} (WIB) · Score = Tilawah×10 + Murojaah×7 + Khatam×300
            </p>
          </div>
          <a
            href="/dashboard"
            class="px-4 py-2 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-main hover:bg-slate-50"
          >
            ← Dashboard
          </a>
        </div>

        {/* Top 3 podium */}
        {topThree.length > 0 && (
          <div class="w-full grid md:grid-cols-3 gap-4 mb-8">
            {topThree.map((row) => (
              <div
                class={`bg-white border rounded-xl p-5 ${row.rank === 1 ? "border-yellow-300 shadow-sm" : "border-border-light"} ${row.id === user.id ? "ring-2 ring-primary/30" : ""}`}
              >
                <div class="flex items-center justify-between mb-2">
                  <span class={`text-xs uppercase font-bold ${row.rank === 1 ? "text-yellow-600" : row.rank === 2 ? "text-slate-500" : "text-amber-700"}`}>
                    {row.rank === 1 ? "🥇 1st" : row.rank === 2 ? "🥈 2nd" : "🥉 3rd"}
                  </span>
                  {row.current_streak > 0 && (
                    <span class="text-xs font-bold text-orange-500">🔥 {row.current_streak}</span>
                  )}
                </div>
                <p class="text-lg font-black text-text-main mb-1">
                  {row.name}
                  {row.id === user.id ? <span class="text-sm font-normal text-primary ml-1">(You)</span> : null}
                </p>
                <p class="text-xl font-black text-primary mb-1">{row.score} pts</p>
                <p class="text-xs text-text-secondary">
                  Tilawah {row.tilawah_juz} · Murojaah {row.murojaah_juz} · Khatam {row.khatam_count}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Full table */}
        <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-border-light bg-slate-50/50">
            <h2 class="text-text-main text-lg font-bold">All Rankings ({total})</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-text-secondary">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold">#</th>
                  <th class="px-4 py-3 text-left font-semibold">Name</th>
                  <th class="px-4 py-3 text-right font-semibold">Streak</th>
                  <th class="px-4 py-3 text-right font-semibold">Tilawah</th>
                  <th class="px-4 py-3 text-right font-semibold">Murojaah</th>
                  <th class="px-4 py-3 text-right font-semibold">Khatam</th>
                  <th class="px-4 py-3 text-right font-semibold">Score</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-light">
                {rows.map((row) => (
                  <tr class={`${row.id === user.id ? "bg-primary-light/30" : ""} hover:bg-slate-50 transition-colors`}>
                    <td class="px-4 py-3 font-bold text-text-secondary">
                      {row.rank <= 3 ? (
                        <span>{row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : "🥉"}</span>
                      ) : (
                        <span class="text-text-main">#{row.rank}</span>
                      )}
                    </td>
                    <td class="px-4 py-3 text-text-main font-semibold">
                      {row.name}
                      {row.id === user.id ? <span class="ml-1.5 text-xs text-primary font-bold">(You)</span> : null}
                    </td>
                    <td class="px-4 py-3 text-right">
                      {row.current_streak > 0 ? (
                        <span class="text-orange-500 font-bold">🔥 {row.current_streak}</span>
                      ) : (
                        <span class="text-text-secondary">—</span>
                      )}
                    </td>
                    <td class="px-4 py-3 text-right text-text-main">{row.tilawah_juz}</td>
                    <td class="px-4 py-3 text-right text-text-main">{row.murojaah_juz}</td>
                    <td class="px-4 py-3 text-right text-text-main">{row.khatam_count}</td>
                    <td class="px-4 py-3 text-right font-black text-primary">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </Layout>
  );
};
