import { Hono } from "hono";
import { db } from "../db/connection.ts";
import { getWibYearMonth } from "../lib/wib-date.ts";
import { getCurrentMonthActivityLeaderboard } from "../lib/activity-calc.ts";
import { getLang } from "../lib/i18n.ts";
import { getCookie } from "hono/cookie";
import { LandingPage } from "../views/pages/LandingPage.tsx";
import type { Env } from "../types.ts";

const landing = new Hono<Env>();

landing.get("/", (c) => {
  const lang = c.get("lang");

  const leaderboard = getCurrentMonthActivityLeaderboard({ perPage: 20 });

  const totalMembers = (
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM users WHERE role IN ('santri','alumni','asatidz','member','admin','super_admin')`
      )
      .get() as { count: number }
  ).count;

  const totalTilawah = (
    db.prepare(`SELECT COALESCE(SUM(juz_amount), 0) AS total FROM tilawah_logs`).get() as {
      total: number;
    }
  ).total;

  const totalMurojaah = (
    db.prepare(`SELECT COALESCE(SUM(juz_amount), 0) AS total FROM murojaah_logs`).get() as {
      total: number;
    }
  ).total;

  const { year, month } = getWibYearMonth();

  return c.html(
    <LandingPage
      lang={lang}
      leaderboard={leaderboard}
      year={year}
      month={month}
      totalMembers={totalMembers}
      totalTilawahJuz={Math.round(totalTilawah * 10) / 10}
      totalMurojaahJuz={Math.round(totalMurojaah * 10) / 10}
    />
  );
});

export { landing as landingRoutes };
