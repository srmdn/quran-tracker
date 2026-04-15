import { initializeDatabase } from "../db/schema.ts";
import { db } from "../db/connection.ts";
import { ACTIVE_MEMBER_ROLES } from "../lib/roles.ts";
import { sendTrackedEmail } from "../lib/email-log.ts";
import { buildInactivityEmail } from "../lib/inactivity-email.ts";
import { getUserActivityTotals } from "../lib/activity-calc.ts";
import { getWibDateYmd } from "../lib/wib-date.ts";
import type { User } from "../types.ts";

initializeDatabase();

const INACTIVITY_DAYS = 7;

const todayWib = getWibDateYmd();
const rolesSql = ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");

// Users who:
// - are active members and not suspended
// - have no tilawah or murojaah logs in the last INACTIVITY_DAYS days
// - have not already received an inactivity_reminder in the last INACTIVITY_DAYS days
const candidates = db.prepare(`
  SELECT id, name, email, role, avatar_url, suspended_at, created_at, updated_at
  FROM users
  WHERE role IN (${rolesSql})
    AND email IS NOT NULL
    AND suspended_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM tilawah_logs t
      WHERE t.user_id = users.id
        AND t.date_wib >= date('now', '-${INACTIVITY_DAYS} days')
    )
    AND NOT EXISTS (
      SELECT 1 FROM murojaah_logs m
      WHERE m.user_id = users.id
        AND m.date_wib >= date('now', '-${INACTIVITY_DAYS} days')
    )
    AND NOT EXISTS (
      SELECT 1 FROM email_log el
      WHERE el.user_id = users.id
        AND el.email_type = 'inactivity_reminder'
        AND el.sent_at >= datetime('now', '-${INACTIVITY_DAYS} days')
        AND el.status = 'sent'
    )
`).all() as User[];

console.log(`[inactivity-reminder] date=${todayWib} candidates=${candidates.length}`);

let sent = 0;
let skipped = 0;
let failed = 0;

for (const user of candidates) {
  if (!user.email) {
    skipped++;
    continue;
  }

  // Find last activity date across both log tables
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

  const totals = getUserActivityTotals(user.id);

  try {
    const message = buildInactivityEmail({
      name: user.name,
      lastActivityDate,
      daysSinceActivity,
      totalTilawahJuz: totals.tilawahJuz,
      totalMurojaahJuz: totals.murojaahJuz,
    });
    await sendTrackedEmail({
      to: user.email,
      subject: message.subject,
      text: message.text,
      html: message.html,
      emailType: "inactivity_reminder",
      userId: user.id,
    });
    sent++;
    console.log(`[inactivity-reminder] sent to ${user.email} (last activity: ${lastActivityDate ?? "never"})`);
  } catch (err) {
    failed++;
    console.error(`[inactivity-reminder] failed for ${user.email}: ${err instanceof Error ? err.message : err}`);
  }
}

console.log(`[inactivity-reminder] done — sent=${sent} skipped=${skipped} failed=${failed}`);
