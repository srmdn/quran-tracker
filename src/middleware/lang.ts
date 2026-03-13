import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { getLang } from "../lib/i18n.ts";
import type { Env } from "../types.ts";

export const langMiddleware = createMiddleware<Env>(async (c, next) => {
  const langCookie = getCookie(c, "lang");
  c.set("lang", getLang(langCookie));
  await next();
});
