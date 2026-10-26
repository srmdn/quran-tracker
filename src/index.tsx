import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { serveStatic } from "hono/bun";
import { initializeDatabase } from "./db/schema.ts";
import { getSessionUser, cleanExpiredSessions, warnIfNoUsers } from "./lib/session.ts";
import { authRoutes } from "./routes/auth.ts";
import { activityRoutes } from "./routes/activity.tsx";
import { adminRoutes } from "./routes/admin.tsx";
import { dashboardRoutes } from "./routes/dashboard.tsx";
import { tilawahRoutes } from "./routes/tilawah.tsx";
import { murojaahRoutes } from "./routes/murojaah.tsx";
import { landingRoutes } from "./routes/landing.tsx";
import { profileRoutes } from "./routes/profile.tsx";
import { LoginPage } from "./views/pages/LoginPage.tsx";
import { PendingPage } from "./views/pages/PendingPage.tsx";
import { SuspendedPage } from "./views/pages/SuspendedPage.tsx";
import { PublicHeader } from "./views/components/PublicHeader.tsx";
import { PublicLayout } from "./views/PublicLayout.tsx";
import { authMiddleware } from "./middleware/auth.ts";
import { csrfMiddleware } from "./middleware/csrf.ts";
import { langMiddleware } from "./middleware/lang.ts";
import { isPendingRole } from "./lib/roles.ts";
import { t } from "./lib/i18n.ts";
import type { Env } from "./types.ts";
import { APP_NAME } from "./config.ts";

// Initialize database tables
initializeDatabase();

// Clean expired sessions on startup
cleanExpiredSessions();

// Warn if the instance has no administrator yet
warnIfNoUsers();

const app = new Hono<Env>();

// Static files (no middleware needed)
app.use("/public/*", serveStatic({ root: "./" }));

// Language and CSRF middleware on all non-static routes
app.use("*", langMiddleware);
app.use("*", csrfMiddleware);

// Root route - redirect logged-in users, show landing page to guests
app.get("/", (c) => {
  const sessionId = getCookie(c, "session");
  if (sessionId) {
    const user = getSessionUser(sessionId);
    if (user) {
      if (isPendingRole(user.role)) return c.redirect("/pending");
      return c.redirect("/dashboard");
    }
  }
  return c.redirect("/landing");
});

// Login page
app.get("/login", (c) => {
  const sessionId = getCookie(c, "session");
  if (sessionId) {
    const user = getSessionUser(sessionId);
    if (user && !isPendingRole(user.role)) return c.redirect("/activity/leaderboard");
  }
  const lang = c.get("lang");
  const error = c.req.query("error");
  return c.html(<LoginPage error={error} lang={lang} />);
});

// Pending page
app.get("/pending", authMiddleware, (c) => {
  const user = c.get("user");
  if (!isPendingRole(user.role)) return c.redirect("/dashboard");
  const lang = c.get("lang");
  return c.html(<PendingPage user={user} lang={lang} />);
});

// Suspended page
app.get("/suspended", authMiddleware, (c) => {
  const user = c.get("user");
  if (!user.suspended_at) return c.redirect("/dashboard");
  const lang = c.get("lang");
  return c.html(<SuspendedPage user={user} lang={lang} />);
});

// Mount routes
app.route("/landing", landingRoutes);
app.route("/auth", authRoutes);
app.route("/tilawah", tilawahRoutes);
app.route("/murojaah", murojaahRoutes);
app.get("/leaderboard", (c) => c.redirect("/activity/leaderboard", 301));
app.get("/progress", (c) => c.redirect("/dashboard/progress", 301));
app.route("/activity", activityRoutes);
app.route("/admin", adminRoutes);
app.route("/dashboard", dashboardRoutes);
app.route("/profile", profileRoutes);

// 404
app.notFound((c) => {
  const lang = c.get("lang");
  return c.html(
    <PublicLayout visual title={`${t(lang, "notFoundTitle")} | ${APP_NAME}`} lang={lang}>
      <PublicHeader lang={lang}/>
      <main class="status-page" id="main">
        <div class="status-card">
          <div class="status-icon">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M15.5 8.5l-2 5-5 2 2-5z" />
            </svg>
          </div>
          <h1>{t(lang, "notFoundTitle")}</h1>
          <p>{t(lang, "notFoundDesc")}</p>
          <div class="status-actions">
            <a class="btn btn-primary" href="/landing">
              {t(lang, "backToHome")}
            </a>
            <a class="btn btn-secondary" href="/login">
              {t(lang, "marketingLogin")}
            </a>
          </div>
        </div>
      </main>
    </PublicLayout>,
    404
  );
});

const port = parseInt(process.env.PORT || "3000", 10);
const server = Bun.serve({
  port,
  hostname: process.env.HOST || "127.0.0.1",
  fetch: app.fetch,
});

console.log(`${APP_NAME} running at ${server.url}`);
