import { Hono } from "hono";
import { setCookie } from "hono/cookie";
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

  const referer = c.req.header("Referer") || "/";
  return c.redirect(referer);
});

export { lang as langRoutes };
