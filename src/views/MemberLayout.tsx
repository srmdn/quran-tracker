import type { Child, FC } from "hono/jsx";
import { APP_NAME } from "../config.ts";
import { isAdminRole } from "../lib/roles.ts";
import { t, type Lang } from "../lib/i18n.ts";
import type { User } from "../types.ts";
import { Icon } from "./components/Icon.tsx";

const nav = [
  { href: "/dashboard", labelKey: "memberNavToday", icon: "calendar" },
  { href: "/tilawah", labelKey: "memberNavTilawah", icon: "book" },
  { href: "/murojaah", labelKey: "memberNavMurojaah", icon: "repeat" },
  { href: "/activity/leaderboard", labelKey: "memberNavCommunity", icon: "users" },
  { href: "/profile", labelKey: "memberNavProfile", icon: "user" },
] as const;

function isActive(currentPath: string, href: string): boolean {
  if (href === "/dashboard") return currentPath === "/dashboard";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const MemberLayout: FC<{
  title: string;
  description?: string;
  user: User;
  lang: Lang;
  currentPath: string;
  showTargetButton?: boolean;
  children: Child;
}> = ({
  title,
  description = "Qur'an Tracker member area.",
  user,
  lang,
  currentPath,
  showTargetButton = false,
  children,
}) => {
  const resolvedTitle = `${title} | ${APP_NAME}`;
  return (
    <html lang={lang}>
      <head>
        <meta charset="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <title>{resolvedTitle}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="noindex" />
        <meta name="theme-color" content="#1f5c8b" />
        <link rel="icon" type="image/png" href="/public/favicon-32.png" />
        <link rel="apple-touch-icon" href="/public/icon-192.png" />
        <link rel="manifest" href="/public/manifest.json" />
        <link rel="stylesheet" href="/public/redesign.css" />
      </head>
      <body class="app-body" data-page={currentPath}>
        <a class="skip-link" href="#main">{t(lang, "memberSkip")}</a>
        <header class="topbar">
          <div class="container topbar-inner">
            <a class="brand" href="/dashboard" aria-label={`${APP_NAME}, ${t(lang, "memberNavToday")}`}>
              <img src="/public/logo-128.png" alt="" width="34" height="34" />
              <span>{APP_NAME}</span>
            </a>
            <nav class="topnav" aria-label={t(lang, "memberNavToday")}>
              {nav.map((item) => (
                <a href={item.href} aria-current={isActive(currentPath, item.href) ? "page" : undefined}>
                  {t(lang, item.labelKey)}
                </a>
              ))}
            </nav>
            <div class="topbar-actions">
              {showTargetButton && (
                <button
                  class="btn btn-secondary btn-sm"
                  type="button"
                  data-target-open
                  aria-label={t(lang, "memberSetTarget")}
                >
                  <Icon name="target" size={15} />
                  <span class="target-label">{t(lang, "setTargets")}</span>
                </button>
              )}
              <form method="get" action="/lang" class="lang-form">
                <input type="hidden" name="locale" value={lang === "en" ? "id" : "en"} />
                <button
                  class="btn btn-secondary btn-sm"
                  type="submit"
                  title={t(lang, "memberLanguage")}
                  aria-label={t(lang, "memberLanguage")}
                >
                  {lang === "en" ? "ID" : "EN"}
                </button>
              </form>
              {isAdminRole(user.role) && (
                <a
                  class="btn btn-secondary btn-sm"
                  href="/admin"
                  title={t(lang, "memberAdmin")}
                  aria-label={t(lang, "memberAdmin")}
                >
                  <Icon name="shield" size={16} />
                </a>
              )}
              <a class="avatar-link" href="/profile" title={user.name} aria-label={user.name}>
                {user.avatar_url ? (
                  <img class="avatar-img" src={user.avatar_url} alt="" />
                ) : (
                  <span class="avatar" aria-hidden="true">{initials(user.name)}</span>
                )}
              </a>
            </div>
          </div>
        </header>
        <main class="page" id="main">
          <div class="container">{children}</div>
        </main>
        <nav class="bottom-nav" aria-label={t(lang, "memberNavToday")}>
          {nav.map((item) => (
            <a href={item.href} aria-current={isActive(currentPath, item.href) ? "page" : undefined}>
              <Icon name={item.icon} size={20} />
              <span>{t(lang, item.labelKey)}</span>
            </a>
          ))}
        </nav>
        <script src="/public/member.js" defer></script>
      </body>
    </html>
  );
};
