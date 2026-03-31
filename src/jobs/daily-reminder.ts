import { initializeDatabase } from "../db/schema.ts";
import { db } from "../db/connection.ts";
import { ACTIVE_MEMBER_ROLES } from "../lib/roles.ts";
import { getUserTarget, getTodayTilawahTotal, getTodayMurojaahTotal } from "../lib/targets.ts";
import { getUserStreak } from "../lib/streak.ts";
import { getWibDateYmd } from "../lib/wib-date.ts";
import { sendTrackedEmail } from "../lib/email-log.ts";
import { buildReminderEmail } from "../lib/reminder-email.ts";

initializeDatabase();

const todayWib = getWibDateYmd();
const rolesSql = ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");

const recipients = db
  .prepare(
    `SELECT id, name, email FROM users WHERE role IN (${rolesSql}) AND email IS NOT NULL`
  )
  .all() as Array<{ id: number; name: string; email: string }>;

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
    skipped++;
    continue;
  }

  const todayTilawah = getTodayTilawahTotal(user.id, todayWib);
  const todayMurojaah = getTodayMurojaahTotal(user.id, todayWib);

  if (todayTilawah >= target.tilawah_juz_daily && todayMurojaah >= target.murojaah_juz_daily) {
    skipped++;
    continue;
  }

  const streak = getUserStreak(user.id, todayWib);

  try {
    const message = buildReminderEmail({
      name: user.name,
      todayWib,
      todayTilawah,
      todayMurojaah,
      targetTilawah: target.tilawah_juz_daily,
      targetMurojaah: target.murojaah_juz_daily,
      currentStreak: streak.current_streak,
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
