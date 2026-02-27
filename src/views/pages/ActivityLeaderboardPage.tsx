import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import type { MonthlyActivityRow } from "../../lib/activity-calc.ts";
import { APP_NAME } from "../../config.ts";

export const ActivityLeaderboardPage: FC<{
  user: User;
  year: number;
  month: number;
  rows: MonthlyActivityRow[];
  total: number;
}> = ({ user, year, month, rows, total }) => {
  const topThree = rows.slice(0, 3);

  return (
    <Layout title={`Monthly Activity Leaderboard - ${APP_NAME}`}>
      <Header user={user} currentPath="/activity/leaderboard" />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
        <div class="w-full flex flex-col md:flex-row justify-between items-start gap-3 mb-8">
          <div>
            <h1 class="text-text-main text-3xl font-black">Monthly Activity Leaderboard</h1>
            <p class="text-text-secondary text-sm">
              Period: {year}-{String(month).padStart(2, "0")} (WIB)
            </p>
          </div>
          <a
            href="/activity"
            class="px-4 py-2 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-main hover:bg-slate-50"
          >
            Back to Activity Tracker
          </a>
        </div>

        <div class="w-full grid md:grid-cols-3 gap-4 mb-8">
          {topThree.map((row) => (
            <div class="bg-white border border-border-light rounded-xl p-5">
              <p class="text-xs uppercase font-bold text-text-secondary mb-1">Rank #{row.rank}</p>
              <p class="text-lg font-black text-text-main mb-2">{row.name}</p>
              <p class="text-sm text-text-secondary">Score: <span class="font-bold text-primary">{row.score}</span></p>
              <p class="text-xs text-text-secondary mt-1">
                Tilawah {row.tilawah_juz} • Murojaah {row.murojaah_juz} • Khatam {row.khatam_count}
              </p>
            </div>
          ))}
        </div>

        <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-border-light bg-slate-50/50">
            <h2 class="text-text-main text-lg font-bold">Rankings ({total})</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-text-secondary">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold">Rank</th>
                  <th class="px-4 py-3 text-left font-semibold">Name</th>
                  <th class="px-4 py-3 text-left font-semibold">Role</th>
                  <th class="px-4 py-3 text-right font-semibold">Tilawah</th>
                  <th class="px-4 py-3 text-right font-semibold">Murojaah</th>
                  <th class="px-4 py-3 text-right font-semibold">Khatam</th>
                  <th class="px-4 py-3 text-right font-semibold">Score</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-light">
                {rows.map((row) => (
                  <tr class={row.id === user.id ? "bg-primary-light/30" : ""}>
                    <td class="px-4 py-3 font-bold text-text-main">#{row.rank}</td>
                    <td class="px-4 py-3 text-text-main font-semibold">
                      {row.name}
                      {row.id === user.id ? <span class="ml-2 text-xs text-primary font-bold">(You)</span> : null}
                    </td>
                    <td class="px-4 py-3 text-text-secondary">{row.role}</td>
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
