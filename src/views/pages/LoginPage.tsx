import type { FC } from "hono/jsx";
import { PublicLayout } from "../PublicLayout.tsx";
import { CsrfInput } from "../components/CsrfInput.tsx";
import { APP_NAME } from "../../config.ts";
import { t } from "../../lib/i18n.ts";
import type { Lang } from "../../lib/i18n.ts";

export const LoginPage: FC<{ error?: string; lang: Lang }> = ({ error, lang }) => {
  return (
    <PublicLayout title={`${t(lang, "marketingLogin")} | ${APP_NAME}`} lang={lang}>
      <a class="skip-link" href="#main">
        {lang === "id" ? "Lewati ke konten" : "Skip to content"}
      </a>
      <div class="auth-page">
        <aside class="auth-art">
          <a class="brand" href="/landing" aria-label={APP_NAME}>
            <img src="/public/logo-128.png" alt="" width="34" height="34" />
            <span>{APP_NAME}</span>
          </a>
          <div class="auth-quote">
            <p class="arabic" lang="ar" dir="rtl">
              وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ
            </p>
            <p>“{t(lang, "loginQuoteTranslation")}”</p>
            <cite>{t(lang, "loginQuoteRef")}</cite>
          </div>
          <p class="small" style="color: rgba(247, 241, 229, 0.6)">
            {t(lang, "loginBrandNote")}
          </p>
        </aside>

        <main class="auth-panel" id="main">
          <div class="auth-card">
            <p class="eyebrow">{t(lang, "loginEyebrow")}</p>
            <h1>{t(lang, "loginTitle")}</h1>
            <p>{t(lang, "loginSubtitle")}</p>

            {error && (
              <div class="auth-error" role="alert">
                {error}
              </div>
            )}

            <a class="btn btn-secondary" href="/auth/google" style="width: 100%; margin-top: 24px">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09A6.9 6.9 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              {t(lang, "signInWithGoogle")}
            </a>

            <div class="auth-divider">{t(lang, "orSignInWithEmail")}</div>

            <form method="post" action="/auth/email/login">
              <CsrfInput />
              <div class="field">
                <label for="email">{t(lang, "emailLabel")}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t(lang, "emailPlaceholder")}
                  autocomplete="email"
                  required
                />
              </div>
              <div class="field">
                <label for="password">{t(lang, "passwordLabel")}</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t(lang, "passwordPlaceholder")}
                  autocomplete="current-password"
                  required
                />
              </div>
              <div class="auth-meta">
                <label style="display: flex; align-items: center; gap: 7px; font-size: 11px">
                  <input type="checkbox" name="remember" value="1" />
                  {t(lang, "loginRemember")}
                </label>
                <span class="small muted">{t(lang, "loginForgotContact")}</span>
              </div>
              <button class="btn btn-primary" type="submit" style="width: 100%; margin-top: 16px">
                {t(lang, "signInWithEmail")}
              </button>
            </form>

            <p class="auth-footer">{t(lang, "newMemberNote")}</p>
            <div class="auth-footer" style="margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap">
              <a href="/landing" style="color: var(--primary); font-weight: 700">
                {t(lang, "backToHome")}
              </a>
              <span aria-hidden="true">·</span>
              <a href="/enroll" style="color: var(--primary); font-weight: 700">
                {t(lang, "marketingEnroll")}
              </a>
            </div>
          </div>
        </main>
      </div>
    </PublicLayout>
  );
};
