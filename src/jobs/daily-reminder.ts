import { initializeDatabase } from "../db/schema.ts";
import { db } from "../db/connection.ts";
import { ACTIVE_MEMBER_ROLES } from "../lib/roles.ts";
import { getUserTarget, getTodayTilawahTotal, getTodayMurojaahTotal } from "../lib/targets.ts";
import { getUserStreak, getFreezeCreditsLeft } from "../lib/streak.ts";
import { getWibDateYmd } from "../lib/wib-date.ts";
import { sendTrackedEmail } from "../lib/email-log.ts";
import { buildReminderEmail } from "../lib/reminder-email.ts";
import { sendNoTargetNudgeEmail } from "../lib/no-target-email.ts";
import type { User } from "../types.ts";

initializeDatabase();

// Purge email log entries older than 3 months
const purged = db.prepare("DELETE FROM email_log WHERE sent_at < datetime('now', '-3 months')").run();
if (purged.changes > 0) console.log(`[daily-reminder] purged ${purged.changes} old email log entries`);

const todayWib = getWibDateYmd();
const rolesSql = ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");

const recipients = db
  .prepare(
    `SELECT id, name, email, role, avatar_url, suspended_at, created_at, updated_at FROM users WHERE role IN (${rolesSql}) AND email IS NOT NULL AND suspended_at IS NULL`
  )
  .all() as User[];

console.log(`[daily-reminder] date=${todayWib} candidates=${recipients.length}`);

let sent = 0;
let skipped = 0;
let failed = 0;

for (const user of recipients) {
  if (!user.email) {
    skipped++;
    continue;
  }

  const target = getUserTarget(user.id);
  if (!target) {
    // No target set: nudge once only — skip if already sent before
    const alreadyNudged = db.prepare(
      "SELECT 1 FROM email_log WHERE user_id = ? AND email_type = 'no_target_nudge' AND status = 'sent' LIMIT 1"
    ).get(user.id);
    if (alreadyNudged) {
      skipped++;
      continue;
    }
    try {
      await sendNoTargetNudgeEmail(user);
      sent++;
      console.log(`[daily-reminder] no-target nudge sent to ${user.email}`);
    } catch (err) {
      failed++;
      console.error(`[daily-reminder] no-target nudge failed for ${user.email}: ${err instanceof Error ? err.message : err}`);
    }
    continue;
  }

  const todayTilawah = getTodayTilawahTotal(user.id, todayWib);
  const todayMurojaah = getTodayMurojaahTotal(user.id, todayWib);

  if (todayTilawah >= target.tilawah_juz_daily && todayMurojaah >= target.murojaah_juz_daily) {
    skipped++;
    continue;
  }

  const streak = getUserStreak(user.id, todayWib);
  const freezeCreditsLeft = getFreezeCreditsLeft(user.id, todayWib.slice(0, 7));

  try {
    const message = buildReminderEmail({
      name: user.name,
      todayWib,
      todayTilawah,
      todayMurojaah,
      targetTilawah: target.tilawah_juz_daily,
      targetMurojaah: target.murojaah_juz_daily,
      currentStreak: streak.current_streak,
      freezeCreditsLeft,
    });
    await sendTrackedEmail({ to: user.email, subject: message.subject, text: message.text, html: message.html, emailType: "daily_reminder", userId: user.id });
    sent++;
    console.log(`[daily-reminder] sent to ${user.email}`);
  } catch (err) {
    failed++;
    console.error(`[daily-reminder] failed for ${user.email}: ${err instanceof Error ? err.message : err}`);
  }
}

console.log(`[daily-reminder] done — sent=${sent} skipped=${skipped} failed=${failed}`);
