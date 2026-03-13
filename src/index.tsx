import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { serveStatic } from "hono/bun";
import { initializeDatabase } from "./db/schema.ts";
import { getSessionUser, cleanExpiredSessions } from "./lib/session.ts";
import { authRoutes } from "./routes/auth.ts";
import { activityRoutes } from "./routes/activity.tsx";
import { adminRoutes } from "./routes/admin.tsx";
import { dashboardRoutes } from "./routes/dashboard.tsx";
import { setupRoutes } from "./routes/setup.tsx";
import { tilawahRoutes } from "./routes/tilawah.tsx";
import { murojaahRoutes } from "./routes/murojaah.tsx";
import { langRoutes } from "./routes/lang.ts";
import { LoginPage } from "./views/pages/LoginPage.tsx";
import { PendingPage } from "./views/pages/PendingPage.tsx";
import { Layout } from "./views/Layout.tsx";
import { authMiddleware } from "./middleware/auth.ts";
import { langMiddleware } from "./middleware/lang.ts";
import { isPendingRole } from "./lib/roles.ts";
import type { Env } from "./types.ts";
import { APP_NAME } from "./config.ts";

// Initialize database tables
initializeDatabase();

// Clean expired sessions on startup
cleanExpiredSessions();

const app = new Hono<Env>();

// Static files (no middleware needed)
app.use("/public/*", serveStatic({ root: "./" }));

// Language middleware on all non-static routes
app.use("*", langMiddleware);

// Root route - redirect based on auth state
app.get("/", (c) => {
  const sessionId = getCookie(c, "session");
  if (sessionId) {
    const user = getSessionUser(sessionId);
    if (user) {
      if (isPendingRole(user.role)) return c.redirect("/pending");
      return c.redirect("/activity/leaderboard");
    }
  }
  return c.redirect("/login");
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

// Mount routes
app.route("/lang", langRoutes);
app.route("/auth", authRoutes);
app.route("/setup", setupRoutes);
app.route("/tilawah", tilawahRoutes);
app.route("/murojaah", murojaahRoutes);
app.get("/leaderboard", (c) => c.redirect("/activity/leaderboard", 301));
app.get("/progress", (c) => c.redirect("/dashboard", 301));
app.route("/activity", activityRoutes);
app.route("/admin", adminRoutes);
app.route("/dashboard", dashboardRoutes);

// 404
app.notFound((c) => {
  return c.html(
    <Layout title={`Not Found - ${APP_NAME}`}>
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-6xl font-black text-text-secondary mb-4">404</h1>
          <p class="text-text-secondary mb-6">Page not found</p>
          <a href="/" class="text-primary font-bold hover:underline">
            Go Home
          </a>
        </div>
      </div>
    </Layout>,
    404
  );
});

const port = parseInt(process.env.PORT || "3000", 10);
const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`${APP_NAME} running at ${server.url}`);
