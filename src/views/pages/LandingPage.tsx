import type { FC } from "hono/jsx";
import { PublicLayout } from "../PublicLayout.tsx";
import { CsrfInput } from "../components/CsrfInput.tsx";
import { t, type Lang } from "../../lib/i18n.ts";
import { APP_NAME, PUBLIC_BASE_URL } from "../../config.ts";
import type { FastabiqEntry } from "../../lib/fastabiq-verses.ts";

export const LandingPage: FC<{
  lang: Lang;
  totalMembers: number;
  totalTilawahJuz: number;
  totalMurojaahJuz: number;
  totalKhatam: number;
  fastabiqEntry: FastabiqEntry;
}> = ({ lang, totalMembers, totalTilawahJuz, totalMurojaahJuz, totalKhatam, fastabiqEntry }) => {
  const languageTarget = lang === "en" ? "id" : "en";
  const number = new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US", {
    maximumFractionDigits: 1,
  });

  return (
    <PublicLayout
      title={`${APP_NAME} | ${t(lang, "marketingHeroTitle")}`}
      description={t(lang, "marketingHeroLead")}
      url={`${PUBLIC_BASE_URL}/landing`}
      lang={lang}
    >
      <a class="skip-link" href="#main">
        {lang === "id" ? "Lewati ke konten" : "Skip to content"}
      </a>

      <header class="marketing-header">
        <div class="container">
          <a class="brand" href="/landing" aria-label={APP_NAME}>
            <img src="/public/logo-128.png" alt="" width="34" height="34" />
            <span>{APP_NAME}</span>
          </a>
          <nav class="marketing-nav" aria-label={lang === "id" ? "Navigasi halaman" : "Page navigation"}>
            <a href="#untuk-siapa">{t(lang, "marketingWhoEyebrow")}</a>
            <a href="#cara-kerja">{t(lang, "marketingHowEyebrow")}</a>
            <a href="#manfaat">{t(lang, "marketingBenefitEyebrow")}</a>
            <a href="/enroll">{t(lang, "marketingEnroll")}</a>
          </nav>
          <div style="display: flex; align-items: center; gap: 8px">
            <form method="post" action="/lang">
              <CsrfInput />
              <input type="hidden" name="locale" value={languageTarget} />
              <button class="btn btn-secondary btn-sm" type="submit" title={t(lang, "switchLang")}>
                {t(lang, "switchLang")}
              </button>
            </form>
            <a class="btn btn-primary btn-sm" href="/login">
              {t(lang, "marketingLogin")}
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        <section class="hero">
          <div class="container">
            <div class="hero-copy reveal">
              <p class="eyebrow">Markaz Talaqqi</p>
              <h1>{t(lang, "marketingHeroTitle")}</h1>
              <p class="hero-lead">{t(lang, "marketingHeroLead")}</p>
              <div class="hero-actions">
                <a class="btn btn-primary" href="/login">
                  {t(lang, "marketingStart")}
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
                <a class="btn btn-secondary" href="#cara-kerja">
                  {t(lang, "marketingHowCta")}
                </a>
              </div>
              <p class="hero-note">
                {t(lang, "marketingHeroNote")} <a href="/enroll">{t(lang, "marketingEnroll")}</a>
              </p>
            </div>

            <div class="hero-art reveal reveal-delay-1">
              <div class="arch">
                <div class="arch-content">
                  <p class="arabic" lang="ar" dir="rtl">
                    {fastabiqEntry.verseArabic}
                  </p>
                  <p class="arch-translation">
                    {lang === "en" ? fastabiqEntry.verseEn : fastabiqEntry.verseId}
                  </p>
                  <p class="arch-ref">{fastabiqEntry.verseRef}</p>
                </div>
              </div>
              <div class="seal" aria-hidden="true">
                <strong>12</strong>
                <span>{t(lang, "marketingSealLabel")}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="stats-strip" aria-label={lang === "id" ? "Statistik komunitas" : "Community statistics"}>
          <div class="container">
            <div class="stat-strip-item">
              <strong class="tabular">{number.format(totalMembers)}</strong>
              <span>{t(lang, "marketingMembers")}</span>
            </div>
            <div class="stat-strip-item">
              <strong class="tabular">{number.format(totalTilawahJuz)}</strong>
              <span>{t(lang, "marketingTilawah")}</span>
            </div>
            <div class="stat-strip-item">
              <strong class="tabular">{number.format(totalMurojaahJuz)}</strong>
              <span>{t(lang, "marketingMurojaah")}</span>
            </div>
            <div class="stat-strip-item">
              <strong class="tabular">{number.format(totalKhatam)}</strong>
              <span>{t(lang, "marketingKhatam")}</span>
            </div>
          </div>
        </section>

        <section class="section" id="untuk-siapa">
          <div class="container">
            <div class="section-head">
              <div>
                <p class="eyebrow">{t(lang, "marketingWhoEyebrow")}</p>
                <h2>{t(lang, "marketingWhoTitle")}</h2>
              </div>
              <p>{t(lang, "marketingWhoBody")}</p>
            </div>
            <div class="card-grid">
              <article class="feature-card">
                <div class="feature-icon">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H20v16H5.5A2.5 2.5 0 0 0 3 21.5z" />
                    <path d="M3 5.5v16M7 7h9M7 11h7" />
                  </svg>
                </div>
                <h3>{t(lang, "marketingSantriTitle")}</h3>
                <p>{t(lang, "marketingSantriBody")}</p>
              </article>
              <article class="feature-card">
                <div class="feature-icon">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3>{t(lang, "marketingAlumniTitle")}</h3>
                <p>{t(lang, "marketingAlumniBody")}</p>
              </article>
              <article class="feature-card">
                <div class="feature-icon">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                  </svg>
                </div>
                <h3>{t(lang, "marketingAsatidzTitle")}</h3>
                <p>{t(lang, "marketingAsatidzBody")}</p>
              </article>
            </div>
          </div>
        </section>

        <section class="section" id="cara-kerja">
          <div class="container">
            <div class="section-head">
              <div>
                <p class="eyebrow">{t(lang, "marketingHowEyebrow")}</p>
                <h2>{t(lang, "marketingHowTitle")}</h2>
              </div>
              <p>{t(lang, "marketingHowBody")}</p>
            </div>
            <div class="steps">
              <div class="step">
                <div class="step-number">1</div>
                <h3>{t(lang, "marketingStep1Title")}</h3>
                <p>{t(lang, "marketingStep1Body")}</p>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <h3>{t(lang, "marketingStep2Title")}</h3>
                <p>{t(lang, "marketingStep2Body")}</p>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <h3>{t(lang, "marketingStep3Title")}</h3>
                <p>{t(lang, "marketingStep3Body")}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="quote-band">
          <div class="container">
            <p class="arabic" lang="ar" dir="rtl">
              {fastabiqEntry.hadithArabic}
            </p>
            <blockquote>
              “{lang === "en" ? fastabiqEntry.hadithEn : fastabiqEntry.hadithId}”
              <cite>
                {t(lang, "marketingQuoteLabel")} · {fastabiqEntry.hadithRef}
              </cite>
            </blockquote>
          </div>
        </section>

        <section class="section" id="manfaat">
          <div class="container">
            <div class="section-head">
              <div>
                <p class="eyebrow">{t(lang, "marketingBenefitEyebrow")}</p>
                <h2>{t(lang, "marketingBenefitTitle")}</h2>
              </div>
              <p>{t(lang, "marketingBenefitBody")}</p>
            </div>
            <div class="card-grid">
              <article class="feature-card">
                <div class="feature-icon">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 22c4 0 7-2.7 7-6.5 0-3-1.8-5.2-3.5-7.1C14 6.6 13 4.6 13 2c-2.5 1.5-4 3.8-4 6.5 0 1.4.5 2.6 1.2 3.6C8.4 11.2 7 9.5 7 7c-1.3 1.8-2 3.8-2 6 0 4.4 3 9 7 9z" />
                  </svg>
                </div>
                <h3>{t(lang, "marketingBenefit1Title")}</h3>
                <p>{t(lang, "marketingBenefit1Body")}</p>
              </article>
              <article class="feature-card">
                <div class="feature-icon">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 19V5M4 19h16" />
                    <path d="M8 16v-5M13 16V7M18 16v-8" />
                  </svg>
                </div>
                <h3>{t(lang, "marketingBenefit2Title")}</h3>
                <p>{t(lang, "marketingBenefit2Body")}</p>
              </article>
              <article class="feature-card">
                <div class="feature-icon">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 21h8M12 17v4" />
                    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
                    <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
                  </svg>
                </div>
                <h3>{t(lang, "marketingBenefit3Title")}</h3>
                <p>{t(lang, "marketingBenefit3Body")}</p>
              </article>
            </div>
          </div>
        </section>

        <section class="cta-band">
          <div class="container">
            <p class="eyebrow" style="color: var(--gold-soft); justify-content: center">
              {t(lang, "marketingCtaEyebrow")}
            </p>
            <h2>{t(lang, "marketingCtaTitle")}</h2>
            <p>{t(lang, "marketingCtaBody")}</p>
            <a class="btn" href="/login">
              {t(lang, "marketingCtaButton")}
            </a>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="container">
          <div>
            <strong>{APP_NAME}</strong>
            <span> · {t(lang, "marketingFooterNote")}</span>
          </div>
          <div class="footer-links">
            <a href="/enroll">{t(lang, "marketingEnroll")}</a>
            <a href="/login">{t(lang, "marketingLogin")}</a>
            <a href="#main">{t(lang, "marketingTop")}</a>
          </div>
        </div>
      </footer>
    </PublicLayout>
  );
};
