import { describe, expect, test } from "bun:test";
import { Hono } from "hono";

process.env.APP_URL = "http://localhost:3000";
const { csrfMiddleware } = await import("../src/middleware/csrf.ts");

function cookieValue(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/(?:^|;\s*)(?:__Host-)?csrf=([^;]+)/);
  return match?.[1] ?? "";
}

function appWithCsrf() {
  const app = new Hono();
  app.use("*", csrfMiddleware);
  app.get("/form", (c) => c.text("form"));
  app.post("/submit", (c) => c.text("ok"));
  return app;
}

async function getToken(app: Hono): Promise<string> {
  const response = await app.request("/form");
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const token = cookieValue(response);
  expect(token.length).toBeGreaterThan(31);
  return token;
}

describe("CSRF middleware", () => {
  test("accepts a matching token with a trusted origin", async () => {
    const app = appWithCsrf();
    const token = await getToken(app);
    const response = await app.request("/submit", {
      method: "POST",
      headers: {
        cookie: `csrf=${token}`,
        origin: "http://localhost:3000",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: `_csrf=${token}`,
    });
    expect(response.status).toBe(200);
  });

  test("rejects a missing token", async () => {
    const app = appWithCsrf();
    const token = await getToken(app);
    const response = await app.request("/submit", {
      method: "POST",
      headers: {
        cookie: `csrf=${token}`,
        origin: "http://localhost:3000",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "",
    });
    expect(response.status).toBe(403);
  });

  test("rejects a mismatched token", async () => {
    const app = appWithCsrf();
    const token = await getToken(app);
    const response = await app.request("/submit", {
      method: "POST",
      headers: {
        cookie: `csrf=${token}`,
        origin: "http://localhost:3000",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "_csrf=wrong-token-value-that-is-long-enough",
    });
    expect(response.status).toBe(403);
  });

  test("rejects an untrusted origin", async () => {
    const app = appWithCsrf();
    const token = await getToken(app);
    const response = await app.request("/submit", {
      method: "POST",
      headers: {
        cookie: `csrf=${token}`,
        origin: "https://evil.example",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: `_csrf=${token}`,
    });
    expect(response.status).toBe(403);
  });

  test("accepts a matching token when the browser omits origin and referer", async () => {
    const app = appWithCsrf();
    const token = await getToken(app);
    const response = await app.request("/submit", {
      method: "POST",
      headers: {
        cookie: `csrf=${token}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: `_csrf=${token}`,
    });
    expect(response.status).toBe(200);
  });
});
