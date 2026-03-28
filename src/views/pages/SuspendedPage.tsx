import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import type { User } from "../../types.ts";
import { APP_NAME } from "../../config.ts";
import { t, type Lang } from "../../lib/i18n.ts";

export const SuspendedPage: FC<{ user: User; lang: Lang }> = ({ user, lang }) => {
  return (
    <Layout title={`${t(lang, "suspendedTitle")} - ${APP_NAME}`}>
      <div class="flex-1 flex items-center justify-center px-4">
        <div class="w-full max-w-md text-center">
          <div class="bg-white border border-border-light rounded-2xl p-8 shadow-lg">
            <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span class="material-symbols-outlined text-red-500 text-3xl">block</span>
            </div>
            <h1 class="text-text-main text-2xl font-black tracking-tight mb-2">
              {t(lang, "suspendedTitle")}
            </h1>
            <p class="text-text-secondary text-sm mb-6">
              {t(lang, "suspendedDesc")}
            </p>
            <div class="bg-slate-50 rounded-lg p-4 text-left text-sm space-y-2">
              <div class="flex justify-between">
                <span class="text-text-secondary">Email</span>
                <span class="text-text-main font-medium">{user.email}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">{t(lang, "statusLabel")}</span>
                <span class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">
                  {t(lang, "suspendedStatus")}
                </span>
              </div>
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
