import type { Child, FC } from "hono/jsx";
import { APP_NAME, ORG_NAME } from "../config.ts";
import { isAdminRole } from "../lib/roles.ts";
import { t, type Lang } from "../lib/i18n.ts";
import type { User } from "../types.ts";
import { Icon } from "./components/Icon.tsx";

const nav = [
  { href: "/dashboard", labelKey: "memberNavToday", icon: "calendar" },
  { href: "/tilawah", labelKey: "visualNavLog", icon: "plus" },
  { href: "/dashboard/progress", labelKey: "visualNavProgress", icon: "chart" },
  { href: "/activity/leaderboard", labelKey: "memberNavCommunity", icon: "users" },
] as const;
function active(path: string, href: string) {
  if (href === "/dashboard") return path === href;
  if (href === "/tilawah") return path.startsWith("/tilawah") || path.startsWith("/murojaah");
  if (href === "/dashboard/progress") return path === href || path === "/dashboard/history";
  return path === href;
}
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}
export const MemberLayout: FC<{
  title: string; description?: string; user: User; lang: Lang; currentPath: string;
  showTargetButton?: boolean; adminPage?: boolean; children: Child;
}> = ({ title, description, user, lang, currentPath, showTargetButton = false, adminPage = false, children }) => {
  const items = nav.map(item => (
    <a href={item.href === "/tilawah" && currentPath.startsWith("/murojaah") ? "/murojaah" : item.href}
      aria-current={active(currentPath, item.href) ? "page" : undefined}>
      <Icon name={item.icon} size={20} /><span>{t(lang, item.labelKey)}</span>
    </a>
  ));
  const brand = <a class="brand" href="/dashboard"><img src="/public/logo-128.png" alt="" width="34" height="34" /><span>{APP_NAME}<small>{ORG_NAME}</small></span></a>;
  const avatar = <a class="avatar-link" href="/profile" aria-current={currentPath === "/profile" ? "page" : undefined} aria-label={`${t(lang, "profileLink")}: ${user.name}`}>
    {user.avatar_url ? <img class="avatar-img" src={user.avatar_url} alt="" /> : <span class="avatar" aria-hidden="true">{initials(user.name)}</span>}
  </a>;
  return <html lang="id">
    <head>
      <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <title>{title} | {APP_NAME}</title><meta name="description" content={description || t(lang, "visualDashboardLead")} />
      <meta name="robots" content="noindex" /><meta name="theme-color" content="#2859db" />
      <link rel="icon" type="image/png" href="/public/favicon-32.png" /><link rel="apple-touch-icon" href="/public/icon-192.png" />
      <link rel="manifest" href="/public/manifest.json" />
      {adminPage && <link rel="stylesheet" href="/public/tailwind.css" />}
      <link rel="stylesheet" href="/public/redesign.css" />
      <link rel="stylesheet" href="/public/member-visual.css" />
      {adminPage && <link rel="stylesheet" href="/public/admin-visual.css" />}
    </head>
    <body class="app-body visual-app" data-page={currentPath}>
      <a class="skip-link" href="#main">{t(lang, "memberSkip")}</a>
      <aside class="app-sidebar" aria-label={t(lang, "visualPersonalSpace")}>
        {brand}<p class="sidebar-label">{t(lang, "visualPersonalSpace")}</p>
        <nav class="side-nav" aria-label={t(lang, "visualMainNav")}>{items}</nav>
        <div class="sidebar-account">{avatar}<div><strong>{user.name}</strong><a href="/profile" aria-current={currentPath === "/profile" ? "page" : undefined}>{t(lang, "profileLink")}</a></div>
          {isAdminRole(user.role) && <a class="admin-link" href="/admin" aria-current={adminPage ? "page" : undefined} aria-label={t(lang, "memberAdmin")}><Icon name="shield" /></a>}
        </div>
      </aside>
      <header class="app-header">
        <div class="mobile-brand">{brand}</div><div class="desktop-context">{ORG_NAME}<span>/</span><strong>{title}</strong></div>
        <div class="header-actions">
          {showTargetButton && <button class="btn btn-secondary btn-sm" type="button" data-target-open aria-label={t(lang, "memberSetTarget")}><Icon name="target" size={16} /><span class="target-label">{t(lang, "setTargets")}</span></button>}
          {isAdminRole(user.role) && <a class="admin-mobile" href="/admin" aria-current={adminPage ? "page" : undefined} aria-label={t(lang, "memberAdmin")}><Icon name="shield" size={18} /></a>}
          <span class="mobile-avatar">{avatar}</span>
        </div>
      </header>
      <nav class="tablet-nav" aria-label={t(lang, "visualMainNav")}>{items}</nav>
      <main class="page" id="main"><div class="container">{children}</div></main>
      <nav class="bottom-nav" aria-label={t(lang, "visualMainNav")}>{items}</nav>
      <script src="/public/member.js" defer></script>
    </body>
  </html>;
};
