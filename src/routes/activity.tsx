import { Hono } from "hono";
import { authMiddleware, memberMiddleware, targetMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import {
  getMonthlyActivityLeaderboard,
} from "../lib/activity-calc.ts";
import { getWibYearMonth, getWibDateYmd } from "../lib/wib-date.ts";
import { isStreakActive } from "../lib/streak.ts";
import { ActivityLeaderboardPage } from "../views/pages/ActivityLeaderboardPage.tsx";
import type { Env } from "../types.ts";

const activity = new Hono<Env>();

activity.use("*", authMiddleware, memberMiddleware, targetMiddleware);

activity.get("/", (c) => c.redirect("/tilawah", 301));

function prevMonthOf(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}
function nextMonthOf(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

activity.get("/leaderboard", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");

  const { year: currentYear, month: currentMonth } = getWibYearMonth();

  // Parse ?year= and ?month= query params; default to current WIB month
  let viewYear = currentYear;
  let viewMonth = currentMonth;
  const qYear = parseInt(c.req.query("year") || "", 10);
  const qMonth = parseInt(c.req.query("month") || "", 10);
  if (Number.isInteger(qYear) && Number.isInteger(qMonth) && qMonth >= 1 && qMonth <= 12 && qYear >= 2025) {
    // Don't allow future months
    if (qYear < currentYear || (qYear === currentYear && qMonth <= currentMonth)) {
      viewYear = qYear;
      viewMonth = qMonth;
    }
  }

  const isCurrentMonth = viewYear === currentYear && viewMonth === currentMonth;

  // Determine earliest available snapshot month
  const earliest = db
    .prepare("SELECT MIN(period_year * 100 + period_month) AS v FROM monthly_leaderboard_snapshots")
    .get() as { v: number | null };
  const earliestEncoded = earliest.v; // e.g. 202602

  // Build prev/next nav
  const prevM = prevMonthOf(viewYear, viewMonth);
  const prevEncoded = prevM.year * 100 + prevM.month;
  const hasPrev = earliestEncoded !== null && prevEncoded >= earliestEncoded;

  const nextM = nextMonthOf(viewYear, viewMonth);
  const nextEncoded = nextM.year * 100 + nextM.month;
  const currentEncoded = currentYear * 100 + currentMonth;
  const hasNext = !isCurrentMonth && nextEncoded <= currentEncoded;

  type EnrichedRow = {
    id: number;
    name: string;
    avatar_url: string | null;
    role: string;
    tilawah_juz: number;
    murojaah_juz: number;
    khatam_count: number;
    score: number;
    rank: number;
    current_streak: number;
    streak_active: boolean;
  };

  let enrichedRows: EnrichedRow[];
  let total: number;

  if (isCurrentMonth) {
    const data = getMonthlyActivityLeaderboard({ year: viewYear, month: viewMonth, page: 1, perPage: 1000 });

    // Enrich rows with current streak from user_streaks
    const todayWib = getWibDateYmd();
    const streakMap = new Map<number, { current_streak: number; streak_active: boolean }>();
    const streakRows = db
      .prepare("SELECT user_id, current_streak, last_active_date FROM user_streaks")
      .all() as Array<{ user_id: number; current_streak: number; last_active_date: string | null }>;
    for (const s of streakRows) {
      streakMap.set(s.user_id, {
        current_streak: s.current_streak,
        streak_active: isStreakActive(s.last_active_date, todayWib),
      });
    }

    enrichedRows = data.rows.map((r) => ({
      ...r,
      current_streak: streakMap.get(r.id)?.current_streak ?? 0,
      streak_active: streakMap.get(r.id)?.streak_active ?? false,
    }));
    total = data.total;
  } else {
    // Read from snapshot
    const snapshotRows = db
      .prepare(
        `SELECT s.user_id AS id, s.user_name_snapshot AS name, s.role_snapshot AS role,
                s.tilawah_juz, s.murojaah_juz, s.khatam_count, s.score, s.rank,
                u.avatar_url
         FROM monthly_leaderboard_snapshots s
         LEFT JOIN users u ON u.id = s.user_id
         WHERE s.period_year = ? AND s.period_month = ?
         ORDER BY s.rank ASC`
      )
      .all(viewYear, viewMonth) as Array<{
        id: number; name: string; role: string;
        tilawah_juz: number; murojaah_juz: number; khatam_count: number;
        score: number; rank: number; avatar_url: string | null;
      }>;

    enrichedRows = snapshotRows.map((r) => ({
      ...r,
      current_streak: 0,
      streak_active: false,
    }));
    total = enrichedRows.length;
  }

  return c.html(
    <ActivityLeaderboardPage
      user={user}
      lang={lang}
      year={viewYear}
      month={viewMonth}
      rows={enrichedRows}
      total={total}
      isCurrentMonth={isCurrentMonth}
      prevMonth={hasPrev ? prevM : null}
      nextMonth={hasNext ? nextM : null}
    />
  );
});

export { activity as activityRoutes };
