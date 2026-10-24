import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import { timingSafeEqual } from "node:crypto";
import { PUBLIC_BASE_URL } from "../config.ts";
import { requestContext } from "../lib/request-context.ts";
import type { Env } from "../types.ts";

const SECURE = PUBLIC_BASE_URL.startsWith("https://");
const COOKIE_NAME = SECURE ? "__Host-csrf" : "csrf";
const FIELD_NAME = "_csrf";
const HEADER_NAME = "x-csrf-token";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function createToken(): string {
  return `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
}

function tokensMatch(expected: string, supplied: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function isTrustedOrigin(c: Context<Env>): boolean {
  const expected = new URL(PUBLIC_BASE_URL).origin;
  const origin = c.req.header("Origin");
  const referer = c.req.header("Referer");

  if (origin && origin !== expected) return false;
  if (referer) {
    try {
      if (new URL(referer).origin !== expected) return false;
    } catch {
      return false;
    }
  }
  return true;
}

export const csrfMiddleware = createMiddleware<Env>(async (c, next) => {
  let token = getCookie(c, COOKIE_NAME) ?? "";

  if (!token || token.length < 32) {
    token = createToken();
    setCookie(c, COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      secure: SECURE,
      sameSite: "Lax",
      maxAge: MAX_AGE_SECONDS,
    });
  }

  c.header("Cache-Control", "no-store");

  if (c.req.method !== "GET" && c.req.method !== "HEAD" && c.req.method !== "OPTIONS") {
    let supplied = c.req.header(HEADER_NAME) ?? "";

    if (!supplied) {
      const body = await c.req.parseBody();
      const field = body[FIELD_NAME];
      supplied = typeof field === "string" ? field : "";
    }

    if (!supplied || !tokensMatch(token, supplied) || !isTrustedOrigin(c)) {
      return c.text("Invalid or missing CSRF token.", 403);
    }
  }

  return requestContext.run({ csrfToken: token }, async () => {
    await next();
  });
});
