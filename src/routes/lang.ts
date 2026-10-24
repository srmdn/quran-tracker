import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { PUBLIC_BASE_URL } from "../config.ts";
import { safeRedirectTarget } from "../lib/redirect.ts";
import type { Env } from "../types.ts";

const lang = new Hono<Env>();

lang.post("/", async (c) => {
  const body = await c.req.parseBody();
  const locale = body.locale as string;
  const validLocale = locale === "en" ? "en" : "id";

  setCookie(c, "lang", validLocale, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "Lax",
    path: "/",
  });

  return c.redirect(safeRedirectTarget(c.req.header("Referer"), PUBLIC_BASE_URL));
});

export { lang as langRoutes };
