import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { APP_NAME } from "../../config.ts";
import { t, type Lang } from "../../lib/i18n.ts";

export const ProfilePage: FC<{
  user: User;
  lang: Lang;
  success?: string;
  error?: string;
}> = ({ user, lang, success, error }) => {
  const isEmailUser = !!user.password_hash;
  const joined = user.created_at.slice(0, 10);

  return (
    <Layout title={`${t(lang, "profileTitle")} - ${APP_NAME}`}>
      <Header user={user} currentPath="/profile" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">

        <div class="w-full flex flex-col justify-between items-start gap-2 mb-8">
          <h1 class="text-text-main text-3xl font-black">{t(lang, "profileTitle")}</h1>
          <p class="text-text-secondary text-sm">{t(lang, "profileSubtitle")}</p>
        </div>

        {success && (
          <div class="w-full bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-4 border border-emerald-200">{success}</div>
        )}
        {error && (
          <div class="w-full bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200">{error}</div>
        )}

        {/* Avatar + account info */}
        <div class="w-full bg-white border border-border-light rounded-xl p-6 mb-4">
          <div class="flex items-center gap-4 mb-5">
            {user.avatar_url ? (
              <div
                class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-16 ring-2 ring-border-light flex-shrink-0"
                style={`background-image: url("${user.avatar_url}");`}
              />
            ) : (
              <div class="size-16 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary text-xl font-bold border border-slate-200 flex-shrink-0">
                {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
            )}
            <div>
              <p class="text-text-main font-black text-xl">{user.name}</p>
              <p class="text-text-secondary text-sm">{user.email}</p>
              <span class={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${isEmailUser ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-600"}`}>
                {isEmailUser ? t(lang, "authMethodEmail") : t(lang, "authMethodGoogle")}
              </span>
            </div>
          </div>

          <h3 class="text-xs font-bold text-text-secondary uppercase mb-3">{t(lang, "accountInfo")}</h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-xs text-text-secondary">{t(lang, "emailLabel")}</p>
              <p class="font-medium text-text-main">{user.email}</p>
            </div>
            <div>
              <p class="text-xs text-text-secondary">{t(lang, "roleLabel")}</p>
              <p class="font-medium text-text-main capitalize">{user.role.replace("_", " ")}</p>
            </div>
            <div>
              <p class="text-xs text-text-secondary">{t(lang, "joinedLabel")}</p>
              <p class="font-medium text-text-main">{joined}</p>
            </div>
          </div>
        </div>

        {/* Export log history */}
        <div class="w-full bg-white border border-border-light rounded-xl p-6 mb-4">
          <h3 class="text-text-main font-bold mb-1">Export Log History</h3>
          <p class="text-xs text-text-secondary mb-4">Download your full tilawah and murojaah log history as a CSV file.</p>
          <a
            href="/profile/export.csv"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
          >
            <span class="material-symbols-outlined text-base" style="font-size:1rem;">download</span>
            Download CSV
          </a>
        </div>

        {/* Display name */}
        <div class="w-full bg-white border border-border-light rounded-xl p-6 mb-4">
          <h3 class="text-text-main font-bold mb-1">{t(lang, "displayName")}</h3>
          <p class="text-xs text-text-secondary mb-4">{t(lang, "displayNameHint")}</p>
          <form method="post" action="/profile/name" class="flex gap-2 items-end">
            <div class="flex-1">
              <input
                type="text"
                name="name"
                value={user.name}
                maxlength="100"
                required
                class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
              />
            </div>
            <button type="submit"
              class="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors flex-shrink-0">
              {t(lang, "saveDisplayName")}
            </button>
          </form>
        </div>

        {/* Avatar URL (for non-Google users or users who want to override) */}
        {!user.avatar_url && (
          <div class="w-full bg-white border border-border-light rounded-xl p-6 mb-4">
            <h3 class="text-text-main font-bold mb-1">{t(lang, "customAvatarUrl")}</h3>
            <p class="text-xs text-text-secondary mb-4">{t(lang, "customAvatarHint")}</p>
            <form method="post" action="/profile/avatar" class="space-y-3">
              <input
                type="url"
                name="avatar_url"
                placeholder="https://..."
                maxlength="500"
                class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
              />
              <button type="submit"
                class="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors">
                {t(lang, "saveAvatar")}
              </button>
            </form>
          </div>
        )}

        {/* Password change (email users only) */}
        {isEmailUser && (
          <div class="w-full bg-white border border-border-light rounded-xl p-6 mb-4">
            <h3 class="text-text-main font-bold mb-4">{t(lang, "changePassword")}</h3>
            <form method="post" action="/profile/password" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">{t(lang, "currentPassword")}</label>
                <input type="password" name="current_password" required
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">{t(lang, "newPassword")}</label>
                <input type="password" name="new_password" required minlength="8"
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">{t(lang, "confirmNewPassword")}</label>
                <input type="password" name="confirm_password" required minlength="8"
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" />
              </div>
              <button type="submit"
                class="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors">
                {t(lang, "savePassword")}
              </button>
            </form>
          </div>
        )}
      </main>
    </Layout>
  );
};
