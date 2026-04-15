import { initializeDatabase } from "../db/schema.ts";
import { db } from "../db/connection.ts";
import { ACTIVE_MEMBER_ROLES } from "../lib/roles.ts";
import { sendTrackedEmail } from "../lib/email-log.ts";
import { buildSuspensionWarningEmail } from "../lib/suspension-warning-email.ts";
import { getWibDateYmd } from "../lib/wib-date.ts";
import type { User } from "../types.ts";

initializeDatabase();

const WARNING_DAYS = 21;
const SUSPEND_DAYS = 28;

const todayWib = getWibDateYmd();
const rolesSql = ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");

// Users who:
// - are active members and not suspended
// - have no activity in the last 21 days but fewer than 28 (28+ get auto-suspended)
// - have not already received a suspension_warning in the last 7 days
const candidates = db.prepare(`
  SELECT id, name, email, role, avatar_url, suspended_at, created_at, updated_at
  FROM users
  WHERE role IN (${rolesSql})
    AND email IS NOT NULL
    AND suspended_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM tilawah_logs t
      WHERE t.user_id = users.id
        AND t.date_wib >= date('now', '-${WARNING_DAYS} days')
    )
    AND NOT EXISTS (
      SELECT 1 FROM murojaah_logs m
      WHERE m.user_id = users.id
        AND m.date_wib >= date('now', '-${WARNING_DAYS} days')
    )
    AND (
      EXISTS (
        SELECT 1 FROM tilawah_logs t
        WHERE t.user_id = users.id
          AND t.date_wib >= date('now', '-${SUSPEND_DAYS} days')
      )
      OR EXISTS (
        SELECT 1 FROM murojaah_logs m
        WHERE m.user_id = users.id
          AND m.date_wib >= date('now', '-${SUSPEND_DAYS} days')
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM email_log el
      WHERE el.user_id = users.id
        AND el.email_type = 'suspension_warning'
        AND el.sent_at >= datetime('now', '-7 days')
        AND el.status = 'sent'
    )
`).all() as User[];

console.log(`[suspension-warning] date=${todayWib} candidates=${candidates.length}`);

let sent = 0;
let skipped = 0;
let failed = 0;

for (const user of candidates) {
  if (!user.email) {
    skipped++;
    continue;
  }

  const lastRow = db.prepare(`
    SELECT MAX(date_wib) AS last_date FROM (
      SELECT date_wib FROM tilawah_logs WHERE user_id = ?
      UNION ALL
      SELECT date_wib FROM murojaah_logs WHERE user_id = ?
    )
  `).get(user.id, user.id) as { last_date: string | null };

  const lastActivityDate = lastRow.last_date ?? null;
  const daysSinceActivity = lastActivityDate
    ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / 86400000)
    : 0;
  const daysUntilSuspension = Math.max(1, SUSPEND_DAYS - daysSinceActivity);

  try {
    const message = buildSuspensionWarningEmail({
      name: user.name,
      lastActivityDate,
      daysSinceActivity,
      daysUntilSuspension,
    });
    await sendTrackedEmail({
      to: user.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
      emailType: "suspension_warning",
      userId: user.id,
    });
    sent++;
    console.log(`[suspension-warning] sent to ${user.email} (days inactive: ${daysSinceActivity})`);
  } catch (err) {
    failed++;
    console.error(`[suspension-warning] failed for ${user.email}: ${err instanceof Error ? err.message : err}`);
  }
}

console.log(`[suspension-warning] done — sent=${sent} skipped=${skipped} failed=${failed}`);
