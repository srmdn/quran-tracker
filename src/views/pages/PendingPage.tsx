import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import type { User } from "../../types.ts";
import { APP_NAME } from "../../config.ts";
import { t } from "../../lib/i18n.ts";
import type { Lang } from "../../lib/i18n.ts";

export const PendingPage: FC<{ user: User; lang: Lang }> = ({ user, lang }) => {
  return (
    <Layout title={`${t(lang, "awaitingApproval")} - ${APP_NAME}`}>
      <div class="flex-1 flex items-center justify-center px-4">
        <div class="w-full max-w-md text-center">
          <div class="bg-white border border-border-light rounded-2xl p-8 shadow-lg">
            <div class="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span class="material-symbols-outlined text-amber-500 text-3xl">hourglass_top</span>
            </div>
            <h1 class="text-text-main text-2xl font-black tracking-tight mb-2">
              {t(lang, "awaitingApproval")}
            </h1>
            <p class="text-text-secondary text-sm mb-6">
              Assalamu'alaikum, <strong class="text-text-main">{user.name}</strong>! {t(lang, "awaitingApprovalDesc1")}
            </p>
            <div class="bg-slate-50 rounded-lg p-4 text-left text-sm space-y-2">
              <div class="flex justify-between">
                <span class="text-text-secondary">Email</span>
                <span class="text-text-main font-medium">{user.email}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">{t(lang, "statusLabel")}</span>
                <span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">
                  {t(lang, "pendingStatus")}
                </span>
              </div>
            </div>
            <div class="mt-6 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700 space-y-1">
              <p>{t(lang, "awaitingApprovalContact")}</p>
              <p class="text-xs text-blue-500">{t(lang, "awaitingApprovalWaitTime")}</p>
            </div>
            <form method="POST" action="/auth/logout" class="mt-6">
              <button
                type="submit"
                class="text-text-secondary hover:text-red-500 transition-colors text-sm font-medium"
              >
                {t(lang, "signOut")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};
