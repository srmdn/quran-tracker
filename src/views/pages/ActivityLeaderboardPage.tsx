import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import type { MonthlyActivityRow } from "../../lib/activity-calc.ts";
import { APP_NAME } from "../../config.ts";
import { t, type Lang } from "../../lib/i18n.ts";

type EnrichedRow = MonthlyActivityRow & { current_streak: number };

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function Avatar({ name, url, cls }: { name: string; url: string | null; cls: string }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  if (url) return <img src={url} alt={name} class={`${cls} rounded-full object-cover`} />;
  return <div class={`${cls} rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0`}>{initials}</div>;
}

export const ActivityLeaderboardPage: FC<{
  user: User;
  lang: Lang;
  year: number;
  month: number;
  rows: EnrichedRow[];
  total: number;
  isCurrentMonth: boolean;
  prevMonth: { year: number; month: number } | null;
  nextMonth: { year: number; month: number } | null;
}> = ({ user, lang, year, month, rows, total, isCurrentMonth, prevMonth, nextMonth }) => {
  const topThree = rows.slice(0, 3);
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;
  const myRow = rows.find((r) => r.id === user.id);

  // Reorder top 3 for podium display: [2nd, 1st, 3rd]
  const podiumOrder =
    topThree.length === 3
      ? [topThree[1], topThree[0], topThree[2]]
      : topThree.length === 2
      ? [topThree[1], topThree[0]]
      : topThree;

  function podiumCardClass(rank: number) {
    if (rank === 1) return "bg-gradient-to-b from-yellow-50 to-white border-2 border-yellow-300 shadow-md ring-2 ring-yellow-100";
    if (rank === 2) return "bg-gradient-to-b from-slate-50 to-white border border-slate-300";
    return "bg-gradient-to-b from-amber-50 to-white border border-amber-200";
  }

  function podiumMedalStyle(rank: number) {
    if (rank === 1) return "w-10 h-10 rounded-full bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center text-lg";
    if (rank === 2) return "w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-base";
    return "w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-base";
  }

  function podiumScoreClass(rank: number) {
    if (rank === 1) return "text-2xl font-black text-yellow-600";
    if (rank === 2) return "text-xl font-black text-slate-500";
    return "text-xl font-black text-amber-700";
  }

  return (
    <Layout title={`Leaderboard - ${APP_NAME}`}>
      <Header user={user} currentPath="/activity/leaderboard" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        <div class="w-full flex flex-col md:flex-row justify-between items-start gap-3 mb-8">
          <div>
            <h1 class="text-text-main text-3xl font-black">{t(lang, "leaderboard")}</h1>
            <p class="text-text-secondary text-sm">
              {t(lang, "monthlyRankings")} · {monthLabel}
              {isCurrentMonth ? <span class="ml-2 px-1.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded">Live</span> : <span class="ml-2 px-1.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-500 rounded">Archived</span>}
            </p>
            <details class="mt-1.5">
              <summary class="text-xs text-primary cursor-pointer hover:underline select-none inline-flex items-center gap-1">
                <span class="material-symbols-outlined text-sm leading-none">info</span>
                {t(lang, "scoreFormulaLabel")}
              </summary>
              <div class="mt-2 text-xs text-text-secondary bg-slate-50 border border-border-light rounded-lg px-4 py-3 max-w-xs">
                <p class="font-bold text-text-main mb-2">Score = Tilawah×10 + Murojaah×7 + Khatam×300</p>
                <ul class="space-y-1">
                  <li>Tilawah: 10 {t(lang, "scoreFormulaPts")} juz</li>
                  <li>Murojaah: 7 {t(lang, "scoreFormulaPts")} juz</li>
                  <li>Khatam: 300 {t(lang, "scoreFormulaPts")} completion</li>
                </ul>
              </div>
            </details>
          </div>
          <div class="flex flex-col items-end gap-2">
            {myRow && isCurrentMonth && (
              <a href="#my-rank" class="px-3 py-1.5 text-xs font-bold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors">
                ↑ My rank (#{myRow.rank})
              </a>
            )}
            <a
              href="/dashboard"
              class="px-4 py-2 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-main hover:bg-slate-50"
            >
              {t(lang, "backToDashboard")}
            </a>
          </div>
        </div>

        {/* Month navigation */}
        <div class="w-full flex items-center justify-between mb-6">
          <div>
            {prevMonth ? (
              <a href={`/activity/leaderboard?year=${prevMonth.year}&month=${prevMonth.month}`}
                class="px-3 py-1.5 text-sm font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors inline-flex items-center gap-1">
                <span class="material-symbols-outlined text-base leading-none">chevron_left</span>
                {MONTH_NAMES[prevMonth.month]}
              </a>
            ) : <div />}
          </div>
          <p class="text-sm font-bold text-text-main">{monthLabel}</p>
          <div>
            {nextMonth ? (
              <a href={`/activity/leaderboard?year=${nextMonth.year}&month=${nextMonth.month}`}
                class="px-3 py-1.5 text-sm font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors inline-flex items-center gap-1">
                {MONTH_NAMES[nextMonth.month]}
                <span class="material-symbols-outlined text-base leading-none">chevron_right</span>
              </a>
            ) : <div />}
          </div>
        </div>

        {/* Top 3 podium */}
        {topThree.length > 0 && (
          <div class="w-full mb-8">
            {/* Desktop: podium order [2nd, 1st, 3rd] */}
            <div class="hidden md:grid md:grid-cols-3 gap-4 items-end">
              {podiumOrder.map((row) => (
                <div class={`rounded-xl p-5 ${podiumCardClass(row.rank)} ${row.rank === 1 ? "md:-mt-4" : ""} ${row.id === user.id ? "ring-2 ring-primary/30" : ""}`}>
                  <div class="flex items-center justify-between mb-3">
                    <div class="relative inline-block">
                      <Avatar name={row.name} url={row.avatar_url} cls={row.rank === 1 ? "w-14 h-14" : "w-12 h-12"} />
                      <span class={`absolute -bottom-1 -right-1 ${podiumMedalStyle(row.rank)}`}>
                        {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : "🥉"}
                      </span>
                    </div>
                    {row.current_streak > 0 && (
                      <span class="text-xs font-bold text-orange-500">🔥 {row.current_streak}</span>
                    )}
                  </div>
                  <p class={`font-black text-text-main mb-0.5 ${row.rank === 1 ? "text-xl" : "text-lg"}`}>
                    {row.name}
                    {row.id === user.id ? <span class="text-sm font-normal text-primary ml-1">{t(lang, "youLabel")}</span> : null}
                  </p>
                  <p class={podiumScoreClass(row.rank)}>{row.score} <span class="text-sm font-medium">{t(lang, "ptsLabel")}</span></p>
                  <p class="text-xs text-text-secondary mt-1">
                    T {row.tilawah_juz} · M {row.murojaah_juz} · K {row.khatam_count}
                  </p>
                </div>
              ))}
            </div>
            {/* Mobile: rank order [1st, 2nd, 3rd] */}
            <div class="md:hidden grid grid-cols-1 gap-3">
              {topThree.map((row) => (
                <div class={`rounded-xl p-4 ${podiumCardClass(row.rank)} ${row.id === user.id ? "ring-2 ring-primary/30" : ""}`}>
                  <div class="flex items-center gap-3">
                    <div class="relative inline-block shrink-0">
                      <Avatar name={row.name} url={row.avatar_url} cls="w-10 h-10" />
                      <span class={`absolute -bottom-1 -right-1 ${podiumMedalStyle(row.rank)}`}>
                        {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : "🥉"}
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-black text-text-main truncate">
                        {row.name}
                        {row.id === user.id ? <span class="text-xs font-normal text-primary ml-1">{t(lang, "youLabel")}</span> : null}
                      </p>
                      <p class="text-xs text-text-secondary">T {row.tilawah_juz} · M {row.murojaah_juz} · K {row.khatam_count}</p>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <p class={podiumScoreClass(row.rank)}>{row.score}</p>
                      <p class="text-xs text-text-secondary">{t(lang, "ptsLabel")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for past month */}
        {!isCurrentMonth && rows.length === 0 && (
          <div class="w-full bg-white border border-border-light rounded-xl p-10 text-center text-text-secondary text-sm mb-6">
            No snapshot available for {monthLabel}.
          </div>
        )}

        {/* Full table */}
        {rows.length > 0 && (
          <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden">
            <div class="px-6 py-4 border-b border-border-light bg-slate-50/50">
              <h2 class="text-text-main text-lg font-bold">{t(lang, "allRankings")} ({total})</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-slate-50 text-text-secondary">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold">#</th>
                    <th class="px-4 py-3 text-left font-semibold">{t(lang, "nameCol")}</th>
                    {isCurrentMonth && <th class="px-4 py-3 text-right font-semibold">{t(lang, "streakCol")}</th>}
                    <th class="px-4 py-3 text-right font-semibold">Tilawah</th>
                    <th class="px-4 py-3 text-right font-semibold">Murojaah</th>
                    <th class="px-4 py-3 text-right font-semibold">Khatam</th>
                    <th class="px-4 py-3 text-right font-semibold">{t(lang, "scoreCol")}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-light">
                  {rows.map((row) => (
                    <tr id={row.id === user.id && isCurrentMonth ? "my-rank" : undefined} class={`${row.id === user.id ? "bg-primary-light/30" : ""} hover:bg-slate-50 transition-colors`}>
                      <td class="px-4 py-3 font-bold text-text-secondary">
                        {row.rank <= 3 ? (
                          <span>{row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : "🥉"}</span>
                        ) : (
                          <span class="text-text-main">#{row.rank}</span>
                        )}
                      </td>
                      <td class="px-4 py-3 text-text-main font-semibold">
                        <div class="flex items-center gap-2.5">
                          <Avatar name={row.name} url={row.avatar_url} cls="w-7 h-7" />
                          <span>
                            {row.name}
                            {row.id === user.id ? <span class="ml-1.5 text-xs text-primary font-bold">{t(lang, "youLabel")}</span> : null}
                          </span>
                        </div>
                      </td>
                      {isCurrentMonth && (
                        <td class="px-4 py-3 text-right">
                          {row.current_streak > 0 ? (
                            <span class="text-orange-500 font-bold">🔥 {row.current_streak}</span>
                          ) : (
                            <span class="text-text-secondary">—</span>
                          )}
                        </td>
                      )}
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
        )}
      </main>
    </Layout>
  );
};
