import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { t, type Lang } from "../../lib/i18n.ts";
import { APP_NAME, PUBLIC_BASE_URL } from "../../config.ts";
import type { FastabiqEntry } from "../../lib/fastabiq-verses.ts";

export const LandingPage: FC<{
  lang: Lang;
  totalMembers: number;
  totalTilawahJuz: number;
  totalMurojaahJuz: number;
  fastabiqEntry: FastabiqEntry;
}> = ({ lang, totalMembers, totalTilawahJuz, totalMurojaahJuz, fastabiqEntry }) => {

  return (
    <Layout
      title={`${APP_NAME} | ${t(lang, "landingTagline")}`}
      description={t(lang, "landingAboutMarkaz")}
      url={`${PUBLIC_BASE_URL}/landing`}
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
                  href="#who-can-join"
                  class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-border-light bg-white text-text-main font-bold text-base hover:bg-slate-50 transition-colors"
                >
                  <span class="material-symbols-outlined" style="font-size:18px">group</span>
                  {t(lang, "landingWhoCanJoinTitle")}
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
                <p class="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">{fastabiqEntry.verseRef}</p>
                <p
                  class="text-white text-2xl sm:text-3xl font-black leading-relaxed mb-3"
                  style="font-family: 'Amiri', 'Traditional Arabic', serif; direction: rtl;"
                >
                  {fastabiqEntry.verseArabic}
                </p>
                <p class="text-white/80 text-base sm:text-lg font-semibold italic">
                  "{lang === "en" ? fastabiqEntry.verseEn : fastabiqEntry.verseId}"
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
                  {fastabiqEntry.hadithArabic}
                </p>
                <p class="text-white/80 text-sm sm:text-base font-semibold italic mb-1">
                  "{lang === "en" ? fastabiqEntry.hadithEn : fastabiqEntry.hadithId}"
                </p>
                <p class="text-white/50 text-xs">{fastabiqEntry.hadithRef}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section class="w-full bg-slate-50/70 border-b border-border-light">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div class="max-w-2xl mb-10 mx-auto lg:mx-0 text-center lg:text-left">
              <h2 class="text-2xl sm:text-3xl font-black text-text-main mb-2">{t(lang, "landingStatTitle")}</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div class="flex flex-col items-center lg:items-start gap-4 bg-slate-50 rounded-2xl border border-border-light p-6 text-center lg:text-left">
                <div class="shrink-0 size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined" style="font-size:22px">group</span>
                </div>
                <div>
                  <p class="text-3xl font-black text-text-main" data-countup={String(totalMembers)} data-countup-decimals="0">{totalMembers}</p>
                  <p class="text-text-secondary text-sm mt-0.5">{t(lang, "landingStatMembers")}</p>
                </div>
              </div>
              <div class="flex flex-col items-center lg:items-start gap-4 bg-slate-50 rounded-2xl border border-border-light p-6 text-center lg:text-left">
                <div class="shrink-0 size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined" style="font-size:22px">menu_book</span>
                </div>
                <div>
                  <p class="text-3xl font-black text-text-main" data-countup={String(totalTilawahJuz)} data-countup-decimals="1">{totalTilawahJuz}</p>
                  <p class="text-text-secondary text-sm mt-0.5">{t(lang, "landingStatTilawah")}</p>
                </div>
              </div>
              <div class="flex flex-col items-center lg:items-start gap-4 bg-slate-50 rounded-2xl border border-border-light p-6 text-center lg:text-left">
                <div class="shrink-0 size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined" style="font-size:22px">refresh</span>
                </div>
                <div>
                  <p class="text-3xl font-black text-text-main" data-countup={String(totalMurojaahJuz)} data-countup-decimals="1">{totalMurojaahJuz}</p>
                  <p class="text-text-secondary text-sm mt-0.5">{t(lang, "landingStatMurojaah")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── About the Program ── */}
        <section class="w-full bg-white border-b border-border-light">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div class="max-w-2xl mb-10 mx-auto lg:mx-0 text-center lg:text-left">
              <h2 class="text-2xl sm:text-3xl font-black text-text-main mb-2">{t(lang, "landingAboutTitle")}</h2>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: About Markaz */}
              <div class="flex flex-col gap-4 p-6 bg-slate-50 rounded-2xl border border-border-light">
                <div class="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <span class="material-symbols-outlined" style="font-size:22px">mosque</span>
                </div>
                <div>
                  <h3 class="font-black text-text-main text-base mb-2">{t(lang, "landingAboutProgramTitle")}</h3>
                  <p class="text-text-secondary text-sm leading-relaxed">{t(lang, "landingAboutProgramDesc")}</p>
                </div>
              </div>
              {/* Right: two stacked info cards */}
              <div class="flex flex-col gap-4">
                <div class="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-border-light">
                  <div class="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <span class="material-symbols-outlined" style="font-size:20px">emoji_events</span>
                  </div>
                  <div>
                    <h3 class="font-black text-text-main text-sm mb-1">{t(lang, "landingAboutScoringTitle")}</h3>
                    <p class="text-text-secondary text-sm leading-relaxed">{t(lang, "landingAboutScoringDesc")}</p>
                  </div>
                </div>
                <div class="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-border-light">
                  <div class="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <span class="material-symbols-outlined" style="font-size:20px">menu_book</span>
                  </div>
                  <div>
                    <h3 class="font-black text-text-main text-sm mb-1">{t(lang, "landingAboutInputTitle")}</h3>
                    <p class="text-text-secondary text-sm leading-relaxed">{t(lang, "landingAboutInputDesc")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Who Can Join ── */}
        <section id="who-can-join" class="w-full bg-slate-50/70 border-b border-border-light">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div class="max-w-2xl mb-10 mx-auto lg:mx-0 text-center lg:text-left">
              <h2 class="text-2xl sm:text-3xl font-black text-text-main mb-2">{t(lang, "landingWhoCanJoinTitle")}</h2>
              <p class="text-text-secondary text-sm sm:text-base">{t(lang, "landingWhoCanJoinDesc")}</p>
            </div>

            {/* Eligibility cards */}
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: "school", title: t(lang, "landingEligibilitySantriTitle"), desc: t(lang, "landingEligibilitySantriDesc") },
                { icon: "history_edu", title: t(lang, "landingEligibilityAlumniTitle"), desc: t(lang, "landingEligibilityAlumniDesc") },
                { icon: "supervisor_account", title: t(lang, "landingEligibilityAsatidzTitle"), desc: t(lang, "landingEligibilityAsatidzDesc") },
              ].map((item) => (
                <div class="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-border-light shadow-sm">
                  <div class="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <span class="material-symbols-outlined" style="font-size:22px">{item.icon}</span>
                  </div>
                  <div>
                    <h3 class="font-black text-text-main text-base mb-1">{item.title}</h3>
                    <p class="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* How to join steps */}
            <div class="bg-white rounded-2xl border border-border-light p-6 sm:p-8">
              <h3 class="font-black text-text-main text-base mb-6">{t(lang, "landingHowToJoinTitle")}</h3>
              <div class="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {[
                  { step: "1", icon: "person_add", text: t(lang, "landingHowToJoinStep1") },
                  { step: "2", icon: "schedule", text: t(lang, "landingHowToJoinStep2") },
                  { step: "3", icon: "login", text: t(lang, "landingHowToJoinStep3") },
                ].map((item) => (
                  <div class="flex sm:flex-col items-center gap-4 sm:gap-3 flex-1 sm:text-center">
                    <div class="shrink-0 size-14 rounded-2xl bg-primary text-white flex flex-col items-center justify-center shadow-sm gap-0.5">
                      <span class="text-2xl font-black leading-none">{item.step}</span>
                      <span class="material-symbols-outlined text-white/70" style="font-size:13px">{item.icon}</span>
                    </div>
                    <p class="text-text-main text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
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
              ].map((item, idx) => (
                <div class="relative flex flex-col gap-4 p-6 bg-slate-50 rounded-2xl border border-border-light hover:border-primary/30 hover:shadow-sm transition-all">
                  <div class="flex items-center gap-3">
                    <div class="size-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                      <span class="material-symbols-outlined" style="font-size:20px">{item.icon}</span>
                    </div>
                    <span class="text-xs font-black text-text-secondary uppercase tracking-widest">Step {item.step}</span>
                  </div>
                  <h3 class="font-black text-text-main text-base">{item.title}</h3>
                  <p class="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
                  {idx < 2 && (
                    <div
                      class="hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-primary text-white items-center justify-center shadow-md border-2 border-white"
                      style="right: -18px"
                    >
                      <span class="material-symbols-outlined" style="font-size:16px">arrow_forward</span>
                    </div>
                  )}
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
              {t(lang, "landingCtaJoinNote")}
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
      <script dangerouslySetInnerHTML={{ __html: `
(function() {
  function animateCountUp(el) {
    var target = parseFloat(el.dataset.countup);
    var decimals = parseInt(el.dataset.countupDecimals || '0', 10);
    var duration = 1800;
    var start = performance.now();
    function step(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = target * eased;
      el.textContent = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString();
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateCountUp(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-countup]').forEach(function(el) {
    observer.observe(el);
  });
})();
      `}} />
    </Layout>
  );
};
