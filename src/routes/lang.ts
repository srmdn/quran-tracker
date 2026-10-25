import type { Context } from "hono";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { PUBLIC_BASE_URL } from "../config.ts";
import { safeRedirectTarget } from "../lib/redirect.ts";
import type { Env } from "../types.ts";

const lang = new Hono<Env>();

function setLocaleCookie(c: Context<Env>, value: string | undefined): void {
  const locale = value === "en" ? "en" : "id";
  setCookie(c, "lang", locale, {
    httpOnly: false,
    secure: PUBLIC_BASE_URL.startsWith("https://"),
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "Lax",
    path: "/",
  });
}

// A language preference is not a sensitive action. A GET form avoids putting
// a CSRF token inside the cached landing page.
lang.get("/", (c) => {
  setLocaleCookie(c, c.req.query("locale"));
  return c.redirect(safeRedirectTarget(c.req.header("Referer"), PUBLIC_BASE_URL));
});

lang.post("/", async (c) => {
  const body = await c.req.parseBody();
  setLocaleCookie(c, body.locale as string);
  return c.redirect(safeRedirectTarget(c.req.header("Referer"), PUBLIC_BASE_URL));
});

export { lang as langRoutes };
