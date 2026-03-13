import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { t, type Lang } from "../../lib/i18n.ts";
import { APP_NAME } from "../../config.ts";
import type { MonthlyActivityRow } from "../../lib/activity-calc.ts";

type LeaderboardResult = {
  year: number;
  month: number;
  total: number;
  rows: MonthlyActivityRow[];
};

export const LandingPage: FC<{
  lang: Lang;
  leaderboard: LeaderboardResult;
  year: number;
  month: number;
  totalMembers: number;
  totalTilawahJuz: number;
  totalMurojaahJuz: number;
}> = ({ lang, leaderboard, year, month, totalMembers, totalTilawahJuz, totalMurojaahJuz }) => {
  const monthLabel = `${year}-${String(month).padStart(2, "0")}`;
  const topThree = leaderboard.rows.slice(0, 3);
  const rest = leaderboard.rows.slice(3);

  return (
    <Layout title={`${APP_NAME} — ${t(lang, "landingTagline")}`}>
      {/* Minimal nav */}
      <nav class="w-full border-b border-border-light bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="size-8">
              <img src="/public/logo.png" alt="Logo" class="w-full h-full object-contain" />
            </div>
            <span class="font-black text-text-main text-base">{APP_NAME}</span>
          </div>
          <div class="flex items-center gap-3">
            <form method="post" action="/lang" class="inline">
              <input type="hidden" name="locale" value={lang === "en" ? "id" : "en"} />
              <button
                type="submit"
                class="text-xs font-bold px-2 py-1 rounded-lg border border-border-light bg-slate-50 text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
              >
                {t(lang, "switchLang")}
              </button>
            </form>
            <a
              href="/login"
              class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors"
            >
              {t(lang, "signIn")}
            </a>
          </div>
        </div>
      </nav>

      <main class="flex-1 w-full">
        {/* Hero */}
        <section class="w-full bg-gradient-to-b from-primary/5 to-white border-b border-border-light">
          <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <div class="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
              {t(lang, "landingBadge")}
            </div>
            <h1 class="text-4xl md:text-5xl font-black text-text-main leading-tight tracking-[-0.033em] mb-4">
              {t(lang, "landingHeroTitle")}
            </h1>
            <p class="text-text-secondary text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              {t(lang, "landingHeroDesc")}
            </p>
            <a
              href="/login"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-dark transition-colors shadow-sm"
            >
              {t(lang, "landingCta")}
              <span class="material-symbols-outlined text-base">arrow_forward</span>
            </a>
          </div>
        </section>

        {/* Stats */}
        <section class="w-full bg-white border-b border-border-light">
          <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div class="grid grid-cols-3 gap-4 md:gap-8 text-center">
              <div>
                <p class="text-3xl md:text-4xl font-black text-primary">{totalMembers}</p>
                <p class="text-text-secondary text-sm mt-1">{t(lang, "landingStatMembers")}</p>
              </div>
              <div>
                <p class="text-3xl md:text-4xl font-black text-primary">{totalTilawahJuz}</p>
                <p class="text-text-secondary text-sm mt-1">{t(lang, "landingStatTilawah")}</p>
              </div>
              <div>
                <p class="text-3xl md:text-4xl font-black text-primary">{totalMurojaahJuz}</p>
                <p class="text-text-secondary text-sm mt-1">{t(lang, "landingStatMurojaah")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section class="w-full bg-slate-50/50">
          <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
              <div>
                <h2 class="text-2xl font-black text-text-main">{t(lang, "leaderboard")}</h2>
                <p class="text-text-secondary text-sm">{t(lang, "monthlyRankings")} · {monthLabel}</p>
              </div>
              <p class="text-xs text-text-secondary">Score = Tilawah×10 + Murojaah×7 + Khatam×300</p>
            </div>

            {/* Top 3 */}
            {topThree.length > 0 && (
              <div class="grid md:grid-cols-3 gap-4 mb-4">
                {topThree.map((row) => (
                  <div
                    class={`bg-white border rounded-xl p-5 ${row.rank === 1 ? "border-yellow-300 shadow-sm" : "border-border-light"}`}
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class={`text-xs uppercase font-bold ${row.rank === 1 ? "text-yellow-600" : row.rank === 2 ? "text-slate-500" : "text-amber-700"}`}>
                        {row.rank === 1 ? "🥇 1st" : row.rank === 2 ? "🥈 2nd" : "🥉 3rd"}
                      </span>
                    </div>
                    <p class="text-lg font-black text-text-main mb-1">{row.name}</p>
                    <p class="text-xl font-black text-primary mb-1">{row.score} {t(lang, "ptsLabel")}</p>
                    <p class="text-xs text-text-secondary">
                      Tilawah {row.tilawah_juz} · Murojaah {row.murojaah_juz} · Khatam {row.khatam_count}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Rest of table */}
            {rest.length > 0 && (
              <div class="bg-white border border-border-light rounded-xl overflow-hidden">
                <table class="min-w-full text-sm">
                  <thead class="bg-slate-50 text-text-secondary border-b border-border-light">
                    <tr>
                      <th class="px-4 py-3 text-left font-semibold">#</th>
                      <th class="px-4 py-3 text-left font-semibold">{t(lang, "nameCol")}</th>
                      <th class="px-4 py-3 text-right font-semibold">Tilawah</th>
                      <th class="px-4 py-3 text-right font-semibold">Murojaah</th>
                      <th class="px-4 py-3 text-right font-semibold">Khatam</th>
                      <th class="px-4 py-3 text-right font-semibold">{t(lang, "scoreCol")}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border-light">
                    {rest.map((row) => (
                      <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-4 py-3 font-bold text-text-secondary">#{row.rank}</td>
                        <td class="px-4 py-3 text-text-main font-semibold">{row.name}</td>
                        <td class="px-4 py-3 text-right text-text-main">{row.tilawah_juz}</td>
                        <td class="px-4 py-3 text-right text-text-main">{row.murojaah_juz}</td>
                        <td class="px-4 py-3 text-right text-text-main">{row.khatam_count}</td>
                        <td class="px-4 py-3 text-right font-black text-primary">{row.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {leaderboard.rows.length === 0 && (
              <div class="bg-white border border-border-light rounded-xl px-6 py-10 text-center text-text-secondary text-sm">
                {t(lang, "noActivityYet")}
              </div>
            )}
          </div>
        </section>

        {/* How it works */}
        <section class="w-full bg-white border-t border-border-light">
          <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 class="text-2xl font-black text-text-main mb-2">{t(lang, "landingHowTitle")}</h2>
            <p class="text-text-secondary text-sm mb-8">{t(lang, "landingHowDesc")}</p>
            <div class="grid md:grid-cols-3 gap-6">
              <div class="flex flex-col gap-3">
                <div class="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg border border-primary/20">
                  1
                </div>
                <h3 class="font-bold text-text-main">{t(lang, "landingStep1Title")}</h3>
                <p class="text-text-secondary text-sm leading-relaxed">{t(lang, "landingStep1Desc")}</p>
              </div>
              <div class="flex flex-col gap-3">
                <div class="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg border border-primary/20">
                  2
                </div>
                <h3 class="font-bold text-text-main">{t(lang, "landingStep2Title")}</h3>
                <p class="text-text-secondary text-sm leading-relaxed">{t(lang, "landingStep2Desc")}</p>
              </div>
              <div class="flex flex-col gap-3">
                <div class="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg border border-primary/20">
                  3
                </div>
                <h3 class="font-bold text-text-main">{t(lang, "landingStep3Title")}</h3>
                <p class="text-text-secondary text-sm leading-relaxed">{t(lang, "landingStep3Desc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA footer */}
        <section class="w-full bg-primary/5 border-t border-primary/20">
          <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <h2 class="text-2xl font-black text-text-main mb-3">{t(lang, "landingJoinTitle")}</h2>
            <p class="text-text-secondary text-sm mb-6 max-w-md mx-auto">{t(lang, "landingJoinDesc")}</p>
            <a
              href="/login"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-dark transition-colors shadow-sm"
            >
              {t(lang, "landingCta")}
              <span class="material-symbols-outlined text-base">arrow_forward</span>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer class="w-full border-t border-border-light bg-white">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between gap-4">
          <p class="text-xs text-text-secondary">© {new Date().getFullYear()} Markaz Talaqqi</p>
          <a href="/login" class="text-xs text-text-secondary hover:text-primary transition-colors">
            {t(lang, "signIn")}
          </a>
        </div>
      </footer>
    </Layout>
  );
};
