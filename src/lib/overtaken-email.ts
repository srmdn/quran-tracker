import { db } from "../db/connection.ts";
import { ACTIVE_MEMBER_ROLES } from "./roles.ts";
import { ORG_NAME, PRODUCT_NAME, PUBLIC_BASE_URL } from "../config.ts";
import { sendTrackedEmail } from "./email-log.ts";
import { escapeHtml, ctaButton, baseEmailHtml } from "./email-base.ts";
import type { User } from "../types.ts";
import { TILAWAH_POINT_PER_JUZ, MUROJAAH_POINT_PER_JUZ, KHATAM_BONUS_POINT } from "./activity-calc.ts";

export function getUserMonthScore(userId: number, from: string, to: string): number {
  const row = db
    .prepare(
      `SELECT ROUND(
        COALESCE((SELECT SUM(juz_amount) FROM tilawah_logs WHERE user_id = ? AND date_wib BETWEEN ? AND ?), 0) * ? +
        COALESCE((SELECT SUM(juz_amount) FROM murojaah_logs WHERE user_id = ? AND date_wib BETWEEN ? AND ?), 0) * ? +
        COALESCE((SELECT COUNT(*) FROM khatam_events WHERE user_id = ? AND type = 'tilawah' AND date_wib BETWEEN ? AND ?), 0) * ?
      ) AS score`
    )
    .get(
      userId, from, to, TILAWAH_POINT_PER_JUZ,
      userId, from, to, MUROJAAH_POINT_PER_JUZ,
      userId, from, to, KHATAM_BONUS_POINT
    ) as { score: number };
  return row.score ?? 0;
}

async function sendOvertakenEmail(
  recipient: { id: number; email: string; name: string },
  overtakenByName: string
): Promise<void> {
  const firstName = recipient.name.split(" ")[0]!;
  const ctaUrl = `${PUBLIC_BASE_URL}/activity/leaderboard`;
  const subject = `${PRODUCT_NAME} | You've been overtaken on the leaderboard`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `${overtakenByName} just passed you on this month's leaderboard.`,
    ``,
    `Don't give up — keep logging your tilawah and murojaah to reclaim your position!`,
    ``,
    `View leaderboard: ${ctaUrl}`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;">
      <strong>${escapeHtml(overtakenByName)}</strong> just passed you on this month's leaderboard.
    </p>
    <p style="margin:0 0 16px;color:#475569;">
      Don't give up — keep logging your tilawah and murojaah to reclaim your position!
    </p>
    ${ctaButton(ctaUrl, "View Leaderboard")}
  `;

  const html = baseEmailHtml({ subtitle: "You've been overtaken", bodyHtml });
  await sendTrackedEmail({ to: recipient.email, subject, text, html, emailType: "overtaken", userId: recipient.id });
}

export async function notifyOvertakenUsers(
  loggingUser: User,
  scoreBefore: number,
  from: string,
  to: string
): Promise<void> {
  const scoreAfter = getUserMonthScore(loggingUser.id, from, to);
  if (scoreAfter <= scoreBefore) return;

  const rolesSql = ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");

  // CTE computes each other active user's current score, then filters to the overtaken range
  const overtaken = db
    .prepare(
      `WITH scores AS (
        SELECT
          u.id,
          u.name,
          u.email,
          ROUND(
            COALESCE((SELECT SUM(juz_amount) FROM tilawah_logs WHERE user_id = u.id AND date_wib BETWEEN ? AND ?), 0) * ? +
            COALESCE((SELECT SUM(juz_amount) FROM murojaah_logs WHERE user_id = u.id AND date_wib BETWEEN ? AND ?), 0) * ? +
            COALESCE((SELECT COUNT(*) FROM khatam_events WHERE user_id = u.id AND type = 'tilawah' AND date_wib BETWEEN ? AND ?), 0) * ?
          ) AS score
        FROM users u
        WHERE u.id != ?
          AND u.role IN (${rolesSql})
          AND u.suspended_at IS NULL
          AND u.email IS NOT NULL
      )
      SELECT id, name, email FROM scores
      WHERE score > ? AND score <= ?`
    )
    .all(
      from, to, TILAWAH_POINT_PER_JUZ,
      from, to, MUROJAAH_POINT_PER_JUZ,
      from, to, KHATAM_BONUS_POINT,
      loggingUser.id,
      scoreBefore,
      scoreAfter,
    ) as Array<{ id: number; name: string; email: string }>;

  for (const u of overtaken) {
    sendOvertakenEmail(u, loggingUser.name).catch(() => {});
  }
}
