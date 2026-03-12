import { Hono } from "hono";
import { authMiddleware, memberMiddleware } from "../middleware/auth.ts";
import { getUserTarget, upsertUserTarget } from "../lib/targets.ts";
import { SetupPage } from "../views/pages/SetupPage.tsx";
import type { Env } from "../types.ts";

const setup = new Hono<Env>();

setup.use("*", authMiddleware, memberMiddleware);

setup.get("/", (c) => {
  const user = c.get("user");
  const existing = getUserTarget(user.id);
  const error = c.req.query("error");
  return c.html(<SetupPage user={user} existing={existing} error={error} />);
});

setup.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();

  const tilawah = parseFloat((body.tilawah_juz_daily as string) || "");
  const murojaah = parseFloat((body.murojaah_juz_daily as string) || "");

  if (!Number.isFinite(tilawah) || tilawah <= 0 || tilawah > 30) {
    return c.redirect("/setup?error=Tilawah+target+must+be+between+0.5+and+30+juz.");
  }
  if (!Number.isFinite(murojaah) || murojaah <= 0 || murojaah > 30) {
    return c.redirect("/setup?error=Murojaah+target+must+be+between+0.5+and+30+juz.");
  }

  upsertUserTarget(user.id, tilawah, murojaah);
  return c.redirect("/dashboard");
});

export { setup as setupRoutes };
