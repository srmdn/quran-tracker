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
  const monthLabel = new Date(year, month - 1).toLocaleString(lang === "id" ? "id-ID" : "en-US", {
    month: "long",
    year: "numeric",
  });
  const topThree = leaderboard.rows.slice(0, 3);
  const rest = leaderboard.rows.slice(3);

  return (
    <Layout
      title={`${APP_NAME} — ${t(lang, "landingTagline")}`}
      description={t(lang, "landingAboutMarkaz")}
    >
      {/* ── Navbar ── */}
      <header class="sticky top-0 z-20 w-full bg-white/90 backdrop-blur border-b border-border-light">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <a href="/landing" class="flex items-center gap-2.5 shrink-0">
            <img src="/public/logo.png" alt="Logo" class="size-8 object-contain" />
            <span class="font-black text-text-main text-base leading-none">{APP_NAME}</span>
          </a>
          <div class="flex items-center gap-2 sm:gap-3">
            <form method="post" action="/lang">
              <input type="hidden" name="locale" value={lang === "en" ? "id" : "en"} />
              <button
                type="submit"
                class="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-border-light bg-slate-50 text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
              >
                {t(lang, "switchLang")}
              </button>
            </form>
            <a
              href="/login"
              class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm whitespace-nowrap"
            >
              {t(lang, "signIn")}
            </a>
          </div>
        </div>
      </header>

      <main class="flex-1 w-full">

        {/* ── Hero ── */}
        <section class="relative w-full overflow-hidden bg-gradient-to-br from-primary/8 via-white to-primary/4 border-b border-border-light">
          <div class="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-primary/6 blur-3xl" />
          <div class="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-primary/5 blur-2xl" />

          <div class="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
            <div class="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div class="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
                <span class="material-symbols-outlined" style="font-size:14px">mosque</span>
                {t(lang, "landingBadge")}
              </div>

              {/* Headline */}
              <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-text-main leading-[1.1] tracking-[-0.03em] mb-4">
                {t(lang, "landingHeroTitle")}
              </h1>

              {/* About one-liner */}
              <p class="text-text-secondary text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-3">
                {t(lang, "landingAboutMarkaz")}
              </p>

              {/* Hero sub */}
              <p class="text-text-secondary text-sm max-w-lg mx-auto mb-8">
                {t(lang, "landingHeroDesc")}
              </p>

              {/* CTA buttons */}
              <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                <a
                  href="/login"
                  class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-dark transition-colors shadow-md"
                >
                  {t(lang, "landingCta")}
                  <span class="material-symbols-outlined" style="font-size:18px">arrow_forward</span>
                </a>
                <a
                  href="#leaderboard"
                  class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-border-light bg-white text-text-main font-bold text-base hover:bg-slate-50 transition-colors"
                >
                  <span class="material-symbols-outlined" style="font-size:18px">leaderboard</span>
                  {t(lang, "leaderboard")}
                </a>
              </div>

              {/* Join note */}
              <p class="text-xs text-text-secondary/80 flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined" style="font-size:14px">info</span>
                {t(lang, "landingJoinNote")}
              </p>
            </div>
          </div>
        </section>

        {/* ── Fastabiqul Khoirot ── */}
        <section class="w-full bg-primary border-b border-primary-dark">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              {/* Quran verse */}
              <div class="flex-1 text-center lg:text-left">
                <p class="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">QS. Al-Baqarah: 148</p>
                <p
                  class="text-white text-2xl sm:text-3xl font-black leading-relaxed mb-3"
                  style="font-family: 'Amiri', 'Traditional Arabic', serif; direction: rtl;"
                >
                  فَاسْتَبِقُوا الْخَيْرَاتِ
                </p>
                <p class="text-white/80 text-base sm:text-lg font-semibold italic">
                  "{t(lang, "fastabiqQuranTranslation")}"
                </p>
              </div>

              {/* Divider */}
              <div class="hidden lg:block w-px h-24 bg-white/20" />
              <div class="lg:hidden w-16 h-px bg-white/20" />

              {/* Hadith */}
              <div class="flex-1 text-center lg:text-left">
                <p class="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Hadith</p>
                <p
                  class="text-white text-xl sm:text-2xl font-black leading-relaxed mb-3"
                  style="font-family: 'Amiri', 'Traditional Arabic', serif; direction: rtl;"
                >
                  خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
                </p>
                <p class="text-white/80 text-sm sm:text-base font-semibold italic mb-1">
                  "{t(lang, "fastabiqHadithTranslation")}"
                </p>
                <p class="text-white/50 text-xs">{t(lang, "fastabiqHadithRef")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section class="w-full bg-white border-b border-border-light">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div class="flex flex-col items-center lg:items-start gap-4 bg-slate-50 rounded-2xl border border-border-light p-6 text-center lg:text-left">
                <div class="shrink-0 size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined" style="font-size:22px">group</span>
                </div>
                <div>
                  <p class="text-3xl font-black text-text-main">{totalMembers}</p>
                  <p class="text-text-secondary text-sm mt-0.5">{t(lang, "landingStatMembers")}</p>
                </div>
              </div>
              <div class="flex flex-col items-center lg:items-start gap-4 bg-slate-50 rounded-2xl border border-border-light p-6 text-center lg:text-left">
                <div class="shrink-0 size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined" style="font-size:22px">menu_book</span>
                </div>
                <div>
                  <p class="text-3xl font-black text-text-main">{totalTilawahJuz}</p>
                  <p class="text-text-secondary text-sm mt-0.5">{t(lang, "landingStatTilawah")}</p>
                </div>
              </div>
              <div class="flex flex-col items-center lg:items-start gap-4 bg-slate-50 rounded-2xl border border-border-light p-6 text-center lg:text-left">
                <div class="shrink-0 size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined" style="font-size:22px">refresh</span>
                </div>
                <div>
                  <p class="text-3xl font-black text-text-main">{totalMurojaahJuz}</p>
                  <p class="text-text-secondary text-sm mt-0.5">{t(lang, "landingStatMurojaah")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Leaderboard ── */}
        <section id="leaderboard" class="w-full bg-slate-50/70 border-b border-border-light">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            {/* Section header */}
            <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-8 text-center lg:text-left">
              <div>
                <div class="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <h2 class="text-2xl sm:text-3xl font-black text-text-main">{t(lang, "leaderboard")}</h2>
                  <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    {t(lang, "landingLiveData")}
                  </span>
                </div>
                <p class="text-text-secondary text-sm">{t(lang, "monthlyRankings")} · {monthLabel}</p>
              </div>
              {/* Score formula — collapsible on mobile */}
              <details class="self-center lg:self-auto">
                <summary class="cursor-pointer text-xs font-semibold text-primary hover:text-primary-dark list-none flex items-center justify-center lg:justify-start gap-1">
                  <span class="material-symbols-outlined" style="font-size:14px">info</span>
                  {t(lang, "landingScoreInfo")}
                </summary>
                <div class="mt-2 text-xs text-text-secondary bg-white border border-border-light rounded-lg px-3 py-2 whitespace-nowrap">
                  Tilawah × 10 + Murojaah × 7 + Khatam × 300
                </div>
              </details>
            </div>

            {leaderboard.rows.length === 0 ? (
              <div class="bg-white border border-border-light rounded-2xl px-6 py-14 text-center text-text-secondary text-sm">
                {t(lang, "noActivityYet")}
              </div>
            ) : (
              <>
                {/* Top 3 podium */}
                {topThree.length > 0 && (
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {topThree.map((row) => {
                      const medal = row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : "🥉";
                      const rankLabel = row.rank === 1 ? "1st" : row.rank === 2 ? "2nd" : "3rd";
                      const highlight = row.rank === 1;
                      return (
                        <div class={`relative bg-white rounded-2xl border p-5 ${highlight ? "border-yellow-300 shadow-md ring-1 ring-yellow-200/60" : "border-border-light shadow-sm"}`}>
                          {highlight && (
                            <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-black px-3 py-0.5 bg-yellow-400 text-white rounded-full shadow-sm">
                              #1
                            </div>
                          )}
                          <div class="flex items-start justify-between mb-3">
                            <span class="text-2xl">{medal}</span>
                            <span class={`text-xs font-bold uppercase tracking-wide ${row.rank === 1 ? "text-yellow-600" : row.rank === 2 ? "text-slate-500" : "text-amber-700"}`}>
                              {rankLabel}
                            </span>
                          </div>
                          <p class="text-lg font-black text-text-main leading-tight mb-1">{row.name}</p>
                          <p class="text-2xl font-black text-primary mb-3">
                            {row.score} <span class="text-sm font-bold text-text-secondary">{t(lang, "ptsLabel")}</span>
                          </p>
                          <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary border-t border-border-light pt-3">
                            <span>Tilawah <strong class="text-text-main">{row.tilawah_juz}</strong></span>
                            <span>Murojaah <strong class="text-text-main">{row.murojaah_juz}</strong></span>
                            <span>Khatam <strong class="text-text-main">{row.khatam_count}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Ranks 4–10 */}
                {rest.length > 0 && (
                  <div class="bg-white border border-border-light rounded-2xl overflow-hidden shadow-sm">
                    {/* Desktop table */}
                    <div class="hidden sm:block overflow-x-auto">
                      <table class="min-w-full text-sm">
                        <thead class="bg-slate-50 border-b border-border-light text-text-secondary">
                          <tr>
                            <th class="px-5 py-3 text-left font-semibold w-12">#</th>
                            <th class="px-5 py-3 text-left font-semibold">{t(lang, "nameCol")}</th>
                            <th class="px-5 py-3 text-right font-semibold">Tilawah</th>
                            <th class="px-5 py-3 text-right font-semibold">Murojaah</th>
                            <th class="px-5 py-3 text-right font-semibold">Khatam</th>
                            <th class="px-5 py-3 text-right font-semibold">{t(lang, "scoreCol")}</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-border-light">
                          {rest.map((row) => (
                            <tr class="hover:bg-slate-50/70 transition-colors">
                              <td class="px-5 py-3.5 font-bold text-text-secondary">#{row.rank}</td>
                              <td class="px-5 py-3.5 font-semibold text-text-main">{row.name}</td>
                              <td class="px-5 py-3.5 text-right text-text-main">{row.tilawah_juz}</td>
                              <td class="px-5 py-3.5 text-right text-text-main">{row.murojaah_juz}</td>
                              <td class="px-5 py-3.5 text-right text-text-main">{row.khatam_count}</td>
                              <td class="px-5 py-3.5 text-right font-black text-primary">{row.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile card list */}
                    <div class="sm:hidden divide-y divide-border-light">
                      {rest.map((row) => (
                        <div class="flex items-center justify-between px-4 py-3.5 gap-3">
                          <div class="flex items-center gap-3 min-w-0">
                            <span class="shrink-0 text-sm font-black text-text-secondary w-7">#{row.rank}</span>
                            <p class="font-semibold text-text-main text-sm truncate">{row.name}</p>
                          </div>
                          <div class="shrink-0 text-right">
                            <p class="font-black text-primary text-sm">{row.score} <span class="text-xs font-bold text-text-secondary">{t(lang, "ptsLabel")}</span></p>
                            <p class="text-xs text-text-secondary">{row.tilawah_juz} · {row.murojaah_juz} · {row.khatam_count}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section class="w-full bg-white border-b border-border-light">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div class="max-w-2xl mb-10 mx-auto lg:mx-0 text-center lg:text-left">
              <h2 class="text-2xl sm:text-3xl font-black text-text-main mb-2">{t(lang, "landingHowTitle")}</h2>
              <p class="text-text-secondary text-sm sm:text-base">{t(lang, "landingHowDesc")}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "edit_note", step: "1", title: t(lang, "landingStep1Title"), desc: t(lang, "landingStep1Desc") },
                { icon: "local_fire_department", step: "2", title: t(lang, "landingStep2Title"), desc: t(lang, "landingStep2Desc") },
                { icon: "emoji_events", step: "3", title: t(lang, "landingStep3Title"), desc: t(lang, "landingStep3Desc") },
              ].map((item) => (
                <div class="relative flex flex-col gap-4 p-6 bg-slate-50 rounded-2xl border border-border-light hover:border-primary/30 hover:shadow-sm transition-all">
                  <div class="flex items-center gap-3">
                    <div class="size-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                      <span class="material-symbols-outlined" style="font-size:20px">{item.icon}</span>
                    </div>
                    <span class="text-xs font-black text-text-secondary uppercase tracking-widest">Step {item.step}</span>
                  </div>
                  <h3 class="font-black text-text-main text-base">{item.title}</h3>
                  <p class="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section class="w-full bg-primary">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <h2 class="text-2xl sm:text-3xl font-black text-white mb-3">{t(lang, "landingJoinTitle")}</h2>
            <p class="text-white/75 text-sm sm:text-base mb-2 max-w-md mx-auto">{t(lang, "landingJoinDesc")}</p>
            <p class="text-white/50 text-xs mb-8 flex items-center justify-center gap-1">
              <span class="material-symbols-outlined" style="font-size:13px">info</span>
              {t(lang, "landingJoinNote")}
            </p>
            <a
              href="/login"
              class="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-primary font-bold text-base hover:bg-primary-light transition-colors shadow-md"
            >
              {t(lang, "landingCta")}
              <span class="material-symbols-outlined" style="font-size:18px">arrow_forward</span>
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer class="w-full border-t border-border-light bg-white">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <img src="/public/logo.png" alt="Logo" class="size-5 object-contain opacity-60" />
            <p class="text-xs text-text-secondary">© {new Date().getFullYear()} Markaz Talaqqi</p>
          </div>
          <a href="/login" class="text-xs font-semibold text-text-secondary hover:text-primary transition-colors">
            {t(lang, "signIn")} →
          </a>
        </div>
      </footer>
    </Layout>
  );
};
