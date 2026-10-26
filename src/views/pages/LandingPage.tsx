import type { FC } from "hono/jsx";
import { PublicLayout } from "../PublicLayout.tsx";
import { PublicHeader } from "../components/PublicHeader.tsx";
import { Icon } from "../components/Icon.tsx";
import { t, type Lang } from "../../lib/i18n.ts";
import { APP_NAME, PUBLIC_BASE_URL, ORG_NAME } from "../../config.ts";
import type { FastabiqEntry } from "../../lib/fastabiq-verses.ts";

export const LandingPage: FC<{
  lang: Lang; totalMembers: number; totalTilawahJuz: number;
  totalMurojaahJuz: number; totalKhatam: number; fastabiqEntry: FastabiqEntry;
}> = ({ lang, totalMembers, totalTilawahJuz, totalMurojaahJuz, totalKhatam, fastabiqEntry }) => {
  const number = new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US",{maximumFractionDigits:1});
  return <PublicLayout visual title={`${APP_NAME} | ${t(lang,"visualPublicTitle")}`} description={t(lang,"visualPublicLead")} url={`${PUBLIC_BASE_URL}/landing`} lang={lang}>
    <PublicHeader lang={lang} landing />
    <main id="main">
      <section class="public-hero"><div class="container public-hero-grid">
        <div class="public-hero-copy"><p class="eyebrow">{ORG_NAME}</p><h1>{t(lang,"visualPublicTitle")} <span>{t(lang,"visualPublicTitleEnd")}</span></h1><p class="public-hero-lead">{t(lang,"visualPublicLead")}</p><div class="hero-actions"><a class="btn btn-primary" href="/login">{t(lang,"marketingCtaButton")}<Icon name="arrow" /></a><a class="btn btn-secondary" href="#cara-kerja">{t(lang,"marketingHowCta")}</a></div><p class="public-hero-note">{t(lang,"marketingHeroNote")}</p></div>
        <div class="public-preview" aria-label={t(lang,"visualPublicPreview")}>
          <div class="public-preview-top"><span class="preview-brand"><Icon name="book" />{APP_NAME}</span><span class="preview-caption">{t(lang,"visualPublicPreview")}</span></div>
          <div class="preview-content"><p class="eyebrow">{t(lang,"memberNavToday")}</p><h2>{t(lang,"visualPublicPreviewTitle")}</h2><div class="preview-reading"><span class="preview-icon"><Icon name="book" size={22}/></span><div><span>Tilawah</span><strong>2 <small>{t(lang,"visualPublicPages")}</small></strong></div><span class="preview-done"><Icon name="check" />{t(lang,"visualPublicSaved")}</span></div><div class="preview-track"><span /></div><div class="preview-position"><span>{t(lang,"visualPublicStart")}<strong>Al-Baqarah · 1</strong></span><Icon name="arrow" size={16}/><span>{t(lang,"visualPublicEnd")}<strong>Al-Baqarah · 16</strong></span></div><div class="preview-next"><Icon name="book" size={16}/><p>{t(lang,"visualPublicNext")}<strong>Al-Baqarah · 17</strong></p></div></div>
        </div>
      </div></section>
      <section class="public-stats" aria-label={t(lang,"visualPublicStats")}><div class="container">{([
        {value:totalMembers,label:"marketingMembers"},{value:totalTilawahJuz,label:"marketingTilawah"},
        {value:totalMurojaahJuz,label:"marketingMurojaah"},{value:totalKhatam,label:"marketingKhatam"},
      ] as const).map(item=><div><strong>{number.format(item.value)}</strong><span>{t(lang,item.label)}</span></div>)}</div></section>
      <section class="public-section" id="cara-kerja"><div class="container"><div class="public-section-head"><p class="eyebrow">{t(lang,"marketingHowEyebrow")}</p><h2>{t(lang,"visualPublicHow")}</h2></div><div class="public-steps">{([
        {title:"marketingStep1Title",body:"visualPublicStep1",icon:"target"},
        {title:"marketingStep2Title",body:"visualPublicStep2",icon:"edit"},
        {title:"visualPublicStep3Title",body:"visualPublicStep3",icon:"chart"},
      ] as const).map((step,i)=><article><span class="public-step-index">0{i+1}</span><Icon name={step.icon} size={22}/><h3>{t(lang,step.title)}</h3><p>{t(lang,step.body)}</p></article>)}</div></div></section>
      <section class="public-section public-community" id="untuk-siapa"><div class="container"><div><p class="eyebrow">{t(lang,"marketingWhoEyebrow")}</p><h2>{t(lang,"visualPublicWho")}</h2><p>{t(lang,"visualPublicWhoLead")}</p></div><blockquote class="public-verse"><p class="arabic" lang="ar" dir="rtl">{fastabiqEntry.verseArabic}</p><p>{lang==="en"?fastabiqEntry.verseEn:fastabiqEntry.verseId}</p><cite>{fastabiqEntry.verseRef}</cite></blockquote></div></section>
      <section class="public-section" id="manfaat"><div class="container"><div class="public-section-head"><p class="eyebrow">{t(lang,"marketingBenefitEyebrow")}</p><h2>{t(lang,"visualPublicFeatures")}</h2></div><div class="public-features">{([
        {icon:"book",title:"visualPublicPositionTitle",body:"visualPublicPositionBody"},
        {icon:"calendar",title:"visualPublicHistoryTitle",body:"visualPublicHistoryBody"},
        {icon:"users",title:"marketingBenefit3Title",body:"visualPublicCommunityBody"},
      ] as const).map(feature=><article><span class="preview-icon"><Icon name={feature.icon} size={22}/></span><h3>{t(lang,feature.title)}</h3><p>{t(lang,feature.body)}</p></article>)}</div></div></section>
      <section class="public-reflection"><div class="container"><p class="arabic" lang="ar" dir="rtl">{fastabiqEntry.hadithArabic}</p><blockquote>{lang==="en"?fastabiqEntry.hadithEn:fastabiqEntry.hadithId}<cite>{fastabiqEntry.hadithRef}</cite></blockquote></div></section>
      <section class="public-cta"><div class="container"><div><h2>{t(lang,"visualPublicCta")}</h2><p>{t(lang,"marketingHeroNote")}</p></div><a class="btn btn-primary" href="/login">{t(lang,"marketingCtaButton")}<Icon name="arrow"/></a></div></section>
    </main>
    <footer class="public-footer"><div class="container"><a class="brand" href="/landing"><img src="/public/logo-128.png" alt="" width="28" height="28"/><span>{APP_NAME}<small>{ORG_NAME}</small></span></a><div><a href="/login">{t(lang,"marketingLogin")}</a><a href="#main">{t(lang,"marketingTop")}</a></div></div></footer>
  </PublicLayout>;
};
