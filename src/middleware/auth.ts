import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { getSessionUser } from "../lib/session.ts";
import { isAdminRole, isPendingRole } from "../lib/roles.ts";
import { getUserTarget } from "../lib/targets.ts";
import type { Env } from "../types.ts";

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const sessionId = getCookie(c, "session");
  if (!sessionId) {
    return c.redirect("/login");
  }

  const user = getSessionUser(sessionId);
  if (!user) {
    return c.redirect("/login");
  }

  c.set("user", user);
  await next();
});

export const memberMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get("user");
  if (isPendingRole(user.role)) {
    return c.redirect("/pending");
  }
  await next();
});

export const adminMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get("user");
  if (!isAdminRole(user.role)) {
    return c.redirect("/leaderboard");
  }
  await next();
});

export const targetMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get("user");
  const target = getUserTarget(user.id);
  if (!target) {
    return c.redirect("/setup");
  }
  await next();
});
