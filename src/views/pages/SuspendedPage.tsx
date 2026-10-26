import type { FC } from "hono/jsx";
import { PublicHeader } from "../components/PublicHeader.tsx";
import { PublicLayout } from "../PublicLayout.tsx";
import { CsrfInput } from "../components/CsrfInput.tsx";
import { APP_NAME } from "../../config.ts";
import { t } from "../../lib/i18n.ts";
import type { Lang } from "../../lib/i18n.ts";
import type { User } from "../../types.ts";

export const SuspendedPage: FC<{ user: User; lang: Lang }> = ({ user, lang }) => {
  return (
    <PublicLayout visual title={`${t(lang, "suspendedTitle")} | ${APP_NAME}`} lang={lang}>
      <PublicHeader lang={lang} showLogin={false}/>

      <main class="status-page" id="main">
        <div class="status-card">
          <div class="status-icon">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h1>{t(lang, "suspendedTitle")}</h1>
          <p>{t(lang, "suspendedDesc")}</p>
          <span class="status-badge danger">{t(lang, "suspendedStatus")}</span>
          <div class="status-meta">
            <span>
              <strong>{user.name}</strong>
            </span>
            <span>{user.email}</span>
          </div>
          <div class="status-actions">
            <a class="btn btn-secondary" href="/landing">
              {t(lang, "backToHome")}
            </a>
            <form method="post" action="/auth/logout">
              <CsrfInput />
              <button class="btn btn-primary" type="submit">
                {t(lang, "logout")}
              </button>
            </form>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
};
