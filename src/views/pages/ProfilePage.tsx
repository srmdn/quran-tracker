import type { FC } from "hono/jsx";
import { MemberLayout } from "../MemberLayout.tsx";
import { CsrfInput } from "../components/CsrfInput.tsx";
import { Icon } from "../components/Icon.tsx";
import type { User } from "../../types.ts";
import { t, type Lang, type TranslationKey } from "../../lib/i18n.ts";
import { passwordMinimum } from "../../lib/validation.ts";

const roleLabels: Record<User["role"], TranslationKey> = {
  pending: "visualRolePending",
  member: "visualRoleMember",
  santri: "visualRoleSantri",
  alumni: "visualRoleAlumni",
  asatidz: "visualRoleAsatidz",
  admin: "visualRoleAdmin",
  super_admin: "visualRoleSuperAdmin",
};

export const ProfilePage: FC<{
  user: User;
  lang: Lang;
  success?: string;
  error?: string;
}> = ({ user, lang, success, error }) => {
  const isEmailUser = !!user.password_hash;
  const isGoogleUser = !user.google_id.startsWith("manual:");
  const authMethod = isEmailUser && isGoogleUser
    ? t(lang, "visualProfileCombinedAuth")
    : isEmailUser
      ? t(lang, "authMethodEmail")
      : isGoogleUser
        ? t(lang, "authMethodGoogle")
        : t(lang, "visualProfilePendingAuth");
  const minimumPassword = passwordMinimum(user.role);
  const joined = new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${user.created_at.slice(0, 10)}T00:00:00Z`));
  const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2)
    .map(part => part[0]).join("").toUpperCase();

  return (
    <MemberLayout title={t(lang, "profileTitle")} description={t(lang, "profileSubtitle")}
      user={user} lang={lang} currentPath="/profile">
      <div class="page-head">
        <div>
          <p class="eyebrow">{t(lang, "visualProfileEyebrow")}</p>
          <h1>{t(lang, "profileTitle")}</h1>
          <p>{t(lang, "profileSubtitle")}</p>
        </div>
      </div>

      {success && <div class="alert alert-success" role="status">{success}</div>}
      {error && <div class="alert alert-error" role="alert">{error}</div>}

      <div class="profile-layout">
        <aside class="profile-rail" aria-label={t(lang, "accountInfo")}>
          <section class="card profile-identity" aria-labelledby="profile-identity-title">
            <div class="profile-identity-top">
              {user.avatar_url ? (
                <img class="profile-picture" src={user.avatar_url} alt="" width="64" height="64" />
              ) : (
                <span class="profile-picture profile-initials" aria-hidden="true">{initials}</span>
              )}
              <h2 id="profile-identity-title">{user.name}</h2>
              <p>{user.email}</p>
              <span class="profile-role">{t(lang, roleLabels[user.role])}</span>
            </div>
            <dl class="profile-facts">
              <div><dt>{t(lang, "authMethod")}</dt><dd>{authMethod}</dd></div>
              <div><dt>{t(lang, "joinedLabel")}</dt><dd>{joined}</dd></div>
            </dl>
          </section>

          <section class="card profile-export" aria-labelledby="profile-export-title">
            <div class="profile-section-head">
              <span class="profile-section-icon"><Icon name="download" size={19} /></span>
              <h2 id="profile-export-title">{t(lang, "visualProfileExportTitle")}</h2>
            </div>
            <p class="profile-description">{t(lang, "visualProfileExportHint")}</p>
            <a class="btn btn-secondary" href="/profile/export.csv">
              <Icon name="download" size={16} />{t(lang, "visualProfileDownload")}
            </a>
          </section>

          <section class="profile-session" aria-label={t(lang, "logout")}>
            <form method="post" action="/auth/logout">
              <CsrfInput />
              <button class="btn btn-secondary profile-logout" type="submit">
                <Icon name="logout" size={17} />{t(lang, "logout")}
              </button>
            </form>
          </section>
        </aside>

        <div class="profile-settings">
          <section class="card profile-setting" aria-labelledby="profile-name-title">
            <div class="profile-section-head">
              <span class="profile-section-icon"><Icon name="user" size={19} /></span>
              <h2 id="profile-name-title">{t(lang, "displayName")}</h2>
            </div>
            <p class="profile-description">{t(lang, "displayNameHint")}</p>
            <form method="post" action="/profile/name" class="profile-name-form">
              <CsrfInput />
              <div class="field">
                <label for="profile-name">{t(lang, "displayName")}</label>
                <input id="profile-name" type="text" name="name" value={user.name}
                  maxlength={100} required autocomplete="name" />
              </div>
              <button class="btn btn-primary" type="submit">{t(lang, "saveDisplayName")}</button>
            </form>
          </section>

          <section class="card profile-setting" aria-labelledby="profile-photo-title">
            <div class="profile-section-head">
              <span class="profile-section-icon"><Icon name="edit" size={19} /></span>
              <h2 id="profile-photo-title">{t(lang, "customAvatarUrl")}</h2>
            </div>
            <p class="profile-description" id="profile-avatar-hint">{t(lang, "customAvatarHint")}</p>
            <form method="post" action="/profile/avatar" class="profile-form">
              <CsrfInput />
              <div class="field">
                <label for="profile-avatar">{t(lang, "customAvatarUrl")}</label>
                <input id="profile-avatar" type="url" name="avatar_url" value={user.avatar_url ?? ""}
                  placeholder="https://..." maxlength={500} aria-describedby="profile-avatar-hint" />
              </div>
              <button class="btn btn-primary" type="submit">{t(lang, "saveAvatar")}</button>
            </form>
          </section>

          {isEmailUser ? (
            <section class="card profile-setting profile-security" aria-labelledby="profile-security-title">
              <div class="profile-section-head">
                <span class="profile-section-icon"><Icon name="shield" size={19} /></span>
                <h2 id="profile-security-title">{t(lang, "changePassword")}</h2>
              </div>
              <p class="profile-description" id="profile-password-hint">
                {t(lang, "visualProfilePasswordHint").replace("{count}", String(minimumPassword))}
              </p>
              <form method="post" action="/profile/password" class="profile-form">
                <CsrfInput />
                <div class="field">
                  <label for="profile-current-password">{t(lang, "currentPassword")}</label>
                  <input id="profile-current-password" type="password" name="current_password"
                    required autocomplete="current-password" />
                </div>
                <div class="profile-password-pair">
                  <div class="field">
                    <label for="profile-new-password">{t(lang, "newPassword")}</label>
                    <input id="profile-new-password" type="password" name="new_password"
                      required minlength={minimumPassword} autocomplete="new-password"
                      aria-describedby="profile-password-hint" />
                  </div>
                  <div class="field">
                    <label for="profile-confirm-password">{t(lang, "confirmNewPassword")}</label>
                    <input id="profile-confirm-password" type="password" name="confirm_password"
                      required minlength={minimumPassword} autocomplete="new-password" />
                  </div>
                </div>
                <button class="btn btn-primary" type="submit">{t(lang, "savePassword")}</button>
              </form>
            </section>
          ) : isGoogleUser ? (
            <section class="card profile-setting" aria-labelledby="profile-security-title">
              <div class="profile-section-head">
                <span class="profile-section-icon"><Icon name="shield" size={19} /></span>
                <h2 id="profile-security-title">{t(lang, "visualProfileGoogleTitle")}</h2>
              </div>
              <p class="profile-description">{t(lang, "visualProfileGoogleHint")}</p>
            </section>
          ) : null}
        </div>
      </div>
    </MemberLayout>
  );
};
