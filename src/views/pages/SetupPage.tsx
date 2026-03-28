import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import type { User } from "../../types.ts";
import type { UserTarget } from "../../lib/targets.ts";
import { APP_NAME, ORG_NAME } from "../../config.ts";
import { t } from "../../lib/i18n.ts";
import type { Lang } from "../../lib/i18n.ts";

export const SetupPage: FC<{
  user: User;
  existing: UserTarget | null;
  error?: string;
  lang: Lang;
}> = ({ user, existing, error, lang }) => {
  return (
    <Layout title={`${existing ? t(lang, "updateDailyTarget") : t(lang, "setDailyTarget")} - ${APP_NAME}`}>
      <div class="flex-1 flex items-center justify-center px-4 py-12">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <div class="size-16 mx-auto mb-4">
              <img src="/public/logo.png" alt="Logo" class="w-full h-full object-contain" />
            </div>
            <h1 class="text-text-main text-2xl font-black tracking-tight mb-2">
              {existing ? t(lang, "updateDailyTarget") : t(lang, "setDailyTarget")}
            </h1>
            <p class="text-text-secondary text-sm">
              {existing
                ? t(lang, "updateDailyTargetDesc")
                : `${t(lang, "setDailyTargetDesc")} (${ORG_NAME})`}
            </p>
          </div>

          <div class="bg-white border border-border-light rounded-2xl p-8 shadow-sm">
            {error && (
              <div class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 border border-red-200">
                {error}
              </div>
            )}

            <form method="post" action="/setup" class="space-y-6">
              <div>
                <label class="block text-sm font-bold text-text-main mb-1">
                  {t(lang, "dailyTilawahTarget")}
                </label>
                <p class="text-xs text-text-secondary mb-2">{t(lang, "howManyJuzRead")}</p>
                <div class="relative">
                  <input
                    type="number"
                    name="tilawah_juz_daily"
                    min="0.5"
                    max="30"
                    step="0.5"
                    value={existing ? String(existing.tilawah_juz_daily) : "1"}
                    class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm pr-14"
                    required
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary font-medium">{t(lang, "juzPerDay")}</span>
                </div>
                <p class="text-xs text-text-secondary/70 mt-1.5">{t(lang, "setupTargetHint")}</p>
              </div>

              <div>
                <label class="block text-sm font-bold text-text-main mb-1">
                  {t(lang, "dailyMurojaahTarget")}
                </label>
                <p class="text-xs text-text-secondary mb-2">{t(lang, "howManyJuzRevise")}</p>
                <div class="relative">
                  <input
                    type="number"
                    name="murojaah_juz_daily"
                    min="0.5"
                    max="30"
                    step="0.5"
                    value={existing ? String(existing.murojaah_juz_daily) : "1"}
                    class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm pr-14"
                    required
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary font-medium">{t(lang, "juzPerDay")}</span>
                </div>
                <p class="text-xs text-text-secondary/70 mt-1.5">{t(lang, "setupTargetHint")}</p>
              </div>

              <button
                type="submit"
                class="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-sm"
              >
                {existing ? t(lang, "saveChanges") : t(lang, "startTracking")}
              </button>
            </form>
          </div>

          <div class="flex items-center justify-center gap-1.5 mt-6 text-xs text-text-secondary">
            <span>{t(lang, "signedInAs")} {user.name}</span>
            <span>&bull;</span>
            <form method="post" action="/auth/logout">
              <button type="submit" class="text-xs text-text-secondary bg-transparent border-0 p-0 cursor-pointer hover:underline">
                {t(lang, "signOut")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};
