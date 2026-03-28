import { Hono } from "hono";
import { authMiddleware, memberMiddleware, targetMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import {
  getCurrentMonthActivityLeaderboard,
} from "../lib/activity-calc.ts";
import { getWibYearMonth } from "../lib/wib-date.ts";
import { ActivityLeaderboardPage } from "../views/pages/ActivityLeaderboardPage.tsx";
import type { Env } from "../types.ts";

const activity = new Hono<Env>();

activity.use("*", authMiddleware, memberMiddleware, targetMiddleware);

activity.get("/", (c) => c.redirect("/tilawah", 301));

activity.get("/leaderboard", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const data = getCurrentMonthActivityLeaderboard({ page: 1, perPage: 1000 });

  // Enrich rows with current streak from user_streaks
  const streakMap = new Map<number, number>();
  const streakRows = db
    .prepare("SELECT user_id, current_streak FROM user_streaks")
    .all() as Array<{ user_id: number; current_streak: number }>;
  for (const s of streakRows) streakMap.set(s.user_id, s.current_streak);

  const enrichedRows = data.rows.map((r) => ({
    ...r,
    current_streak: streakMap.get(r.id) ?? 0,
  }));

  return c.html(
    <ActivityLeaderboardPage
      user={user}
      lang={lang}
      year={data.year}
      month={data.month}
      rows={enrichedRows}
      total={data.total}
    />
  );
});

export { activity as activityRoutes };
