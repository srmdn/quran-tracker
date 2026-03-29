import { Hono } from "hono";
import { authMiddleware, memberMiddleware } from "../middleware/auth.ts";
import { getUserTarget, upsertUserTarget } from "../lib/targets.ts";
import { SetupPage } from "../views/pages/SetupPage.tsx";
import { t } from "../lib/i18n.ts";
import type { Env } from "../types.ts";

const setup = new Hono<Env>();

setup.use("*", authMiddleware, memberMiddleware);

setup.get("/", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const existing = getUserTarget(user.id);
  const error = c.req.query("error");
  return c.html(<SetupPage user={user} lang={lang} existing={existing} error={error} />);
});

setup.post("/", async (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const body = await c.req.parseBody();

  const tilawahRaw = (body.tilawah_juz_daily as string) || "";
  const murojaahRaw = (body.murojaah_juz_daily as string) || "";
  const numericPattern = /^\d+(\.\d{1,2})?$/;

  const tilawah = numericPattern.test(tilawahRaw) ? parseFloat(tilawahRaw) : NaN;
  const murojaah = numericPattern.test(murojaahRaw) ? parseFloat(murojaahRaw) : NaN;

  if (!Number.isFinite(tilawah) || tilawah <= 0 || tilawah > 30) {
    const msg = encodeURIComponent(t(lang, "dailyTilawahTargetError"));
    return c.redirect(`/setup?error=${msg}`);
  }
  if (!Number.isFinite(murojaah) || murojaah <= 0 || murojaah > 30) {
    const msg = encodeURIComponent(t(lang, "dailyMurojaahTargetError"));
    return c.redirect(`/setup?error=${msg}`);
  }

  upsertUserTarget(user.id, tilawah, murojaah);
  return c.redirect("/dashboard");
});

export { setup as setupRoutes };
