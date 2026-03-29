import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { db } from "../db/connection.ts";
import { upsertUser, createSession, deleteSession } from "../lib/session.ts";
import { GOOGLE_REDIRECT_URI } from "../config.ts";
import { isPendingRole } from "../lib/roles.ts";
import { sendWelcomeEmail, sendNewMemberAlertToAdmins } from "../lib/welcome-email.ts";
import { consumeRateLimit, resetRateLimit } from "../lib/rate-limit.ts";
import type { User } from "../types.ts";

const auth = new Hono();

auth.get("/google", (c) => {
  const state = crypto.randomUUID();
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    maxAge: 300,
    sameSite: "Lax",
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    // prompt: "consent",
  });

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

auth.post("/email/login", async (c) => {
  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const rlKey = `login:${ip}`;
  const rl = consumeRateLimit(rlKey, { max: 4, windowMs: 30 * 60 * 1000 });
  if (!rl.allowed) {
    return c.redirect("/login?error=Too many failed login attempts. Please try again in 30 minutes.");
  }

  const body = await c.req.parseBody();
  const email = ((body.email as string) || "").trim().toLowerCase();
  const password = (body.password as string) || "";

  if (!email || !password) {
    return c.redirect("/login?error=Email and password are required.");
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User | null;

  const valid = user?.password_hash
    ? await Bun.password.verify(password, user.password_hash)
    : false;

  if (!valid) {
    const warning = rl.remaining === 0
      ? " Warning: next failed attempt will lock you out for 30 minutes."
      : "";
    return c.redirect(`/login?error=${encodeURIComponent("Invalid email or password." + warning)}`);
  }

  resetRateLimit(rlKey);
  const sessionId = createSession(user!.id);
  setCookie(c, "session", sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  if (isPendingRole(user!.role)) return c.redirect("/pending");
  return c.redirect("/dashboard");
});

auth.get("/google/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const savedState = getCookie(c, "oauth_state");
  deleteCookie(c, "oauth_state", { path: "/" });

  if (!code || state !== savedState) {
    return c.redirect("/login?error=invalid_state");
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return c.redirect("/login?error=token_exchange_failed");
  }

  const tokens = (await tokenRes.json()) as { access_token: string };

  // Get user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return c.redirect("/login?error=user_info_failed");
  }

  const googleUser = (await userRes.json()) as {
    id: string;
    email: string;
    name: string;
    picture: string;
  };

  // Upsert user in DB
  const { user, isNew } = upsertUser({
    googleId: googleUser.id,
    email: googleUser.email,
    name: googleUser.name,
    avatarUrl: googleUser.picture,
  });

  // Create session
  const sessionId = createSession(user.id);

  setCookie(c, "session", sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  if (isNew) {
    // Fire-and-forget — don't block the redirect
    sendWelcomeEmail(user).catch(() => {});
    sendNewMemberAlertToAdmins(user).catch(() => {});
  }

  if (isPendingRole(user.role)) return c.redirect("/pending");
  return c.redirect("/dashboard");
});

auth.post("/logout", (c) => {
  const sessionId = getCookie(c, "session");
  if (sessionId) deleteSession(sessionId);
  deleteCookie(c, "session", { path: "/" });
  return c.redirect("/login");
});

export { auth as authRoutes };
