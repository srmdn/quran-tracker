import type { FC } from "hono/jsx";
import { PublicHeader } from "../components/PublicHeader.tsx";
import { PublicLayout } from "../PublicLayout.tsx";
import { CsrfInput } from "../components/CsrfInput.tsx";
import { APP_NAME } from "../../config.ts";
import { t } from "../../lib/i18n.ts";
import type { Lang } from "../../lib/i18n.ts";
import type { User } from "../../types.ts";

export const PendingPage: FC<{ user: User; lang: Lang }> = ({ user, lang }) => {
  return (
    <PublicLayout visual title={`${t(lang, "awaitingApproval")} | ${APP_NAME}`} lang={lang}>
      <PublicHeader lang={lang} showLogin={false}/>

      <main class="status-page" id="main">
        <div class="status-card">
          <div class="status-icon">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <h1>{t(lang, "awaitingApproval")}</h1>
          <p>{t(lang, "awaitingApprovalDesc1")}</p>
          <span class="status-badge">{t(lang, "pendingStatus")}</span>
          <div class="status-meta">
            <span>
              <strong>{user.name}</strong>
            </span>
            <span>{user.email}</span>
            <span>{t(lang, "awaitingApprovalContact")}</span>
            <span>{t(lang, "awaitingApprovalWaitTime")}</span>
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
