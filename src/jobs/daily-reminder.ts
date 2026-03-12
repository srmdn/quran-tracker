import { initializeDatabase } from "../db/schema.ts";
import { db } from "../db/connection.ts";
import { ACTIVE_MEMBER_ROLES } from "../lib/roles.ts";
import { getUserTarget, getTodayTilawahTotal, getTodayMurojaahTotal } from "../lib/targets.ts";
import { getUserStreak } from "../lib/streak.ts";
import { getWibDateYmd } from "../lib/wib-date.ts";
import { sendSmtpMail } from "../lib/smtp.ts";
import { ORG_NAME, PRODUCT_NAME, PUBLIC_BASE_URL } from "../config.ts";

initializeDatabase();

const todayWib = getWibDateYmd();
const rolesSql = ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");

const recipients = db
  .prepare(
    `SELECT id, name, email FROM users WHERE role IN (${rolesSql}) AND email IS NOT NULL`
  )
  .all() as Array<{ id: number; name: string; email: string }>;

console.log(`[daily-reminder] date=${todayWib} candidates=${recipients.length}`);

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildReminderEmail(params: {
  name: string;
  todayTilawah: number;
  todayMurojaah: number;
  targetTilawah: number;
  targetMurojaah: number;
  currentStreak: number;
}): { subject: string; text: string; html: string } {
  const { name, todayTilawah, todayMurojaah, targetTilawah, targetMurojaah, currentStreak } = params;
  const firstName = name.split(" ")[0]!;
  const remaining_tilawah = Math.max(0, targetTilawah - todayTilawah).toFixed(1);
  const remaining_murojaah = Math.max(0, targetMurojaah - todayMurojaah).toFixed(1);
  const ctaUrl = `${PUBLIC_BASE_URL}/tilawah`;

  const streakLine = currentStreak > 0
    ? `Your current streak is 🔥 ${currentStreak} days — don't break it today!`
    : `Start a new streak today!`;

  const subject = `${ORG_NAME} | Daily Reminder — Complete your Quran target today`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `This is your daily reminder from ${PRODUCT_NAME}.`,
    ``,
    `Today's progress (${todayWib}):`,
    `  Tilawah:  ${todayTilawah} / ${targetTilawah} juz ${todayTilawah >= targetTilawah ? "✓" : `(${remaining_tilawah} juz remaining)`}`,
    `  Murojaah: ${todayMurojaah} / ${targetMurojaah} juz ${todayMurojaah >= targetMurojaah ? "✓" : `(${remaining_murojaah} juz remaining)`}`,
    ``,
    streakLine,
    ``,
    `Log your activity: ${ctaUrl}`,
    ``,
    `May Allah bless your efforts in reading and memorizing the Qur'an.`,
    ``,
    `- ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const tilawahStatus = todayTilawah >= targetTilawah
    ? `<span style="color:#10b981;font-weight:700;">✓ Done</span>`
    : `<span style="color:#ef4444;">${todayTilawah} / ${targetTilawah} juz &mdash; ${escapeHtml(remaining_tilawah)} juz left</span>`;

  const murojaahStatus = todayMurojaah >= targetMurojaah
    ? `<span style="color:#10b981;font-weight:700;">✓ Done</span>`
    : `<span style="color:#ef4444;">${todayMurojaah} / ${targetMurojaah} juz &mdash; ${escapeHtml(remaining_murojaah)} juz left</span>`;

  const streakHtml = currentStreak > 0
    ? `<p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#f97316;">🔥 ${currentStreak} day streak — don't break it!</p>`
    : `<p style="margin:0 0 16px;color:#64748b;">Start a new streak today!</p>`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8faf9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#10b981;color:#ffffff;padding:18px 24px;">
                <h1 style="margin:0;font-size:20px;line-height:1.2;">${escapeHtml(PRODUCT_NAME)}</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Daily Reminder &mdash; ${escapeHtml(todayWib)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
                <p style="margin:0 0 16px;color:#475569;">You have not yet completed your daily target. Here's where you stand:</p>

                ${streakHtml}

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:20px;overflow:hidden;">
                  <thead>
                    <tr style="background:#f8fafc;">
                      <th style="padding:10px 14px;text-align:left;font-size:13px;color:#64748b;font-weight:600;">Activity</th>
                      <th style="padding:10px 14px;text-align:right;font-size:13px;color:#64748b;font-weight:600;">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-top:1px solid #e2e8f0;">
                      <td style="padding:12px 14px;font-weight:600;">Tilawah</td>
                      <td style="padding:12px 14px;text-align:right;">${tilawahStatus}</td>
                    </tr>
                    <tr style="border-top:1px solid #e2e8f0;">
                      <td style="padding:12px 14px;font-weight:600;">Murojaah</td>
                      <td style="padding:12px 14px;text-align:right;">${murojaahStatus}</td>
                    </tr>
                  </tbody>
                </table>

                <p style="margin:0 0 16px;">
                  <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:10px 20px;background:#10b981;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
                    Log Your Activity →
                  </a>
                </p>

                <p style="margin:0;color:#475569;font-size:14px;">May Allah bless your efforts in reading and memorizing the Qur'an.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px;background:#f1f5f9;color:#94a3b8;font-size:12px;">
                Automated reminder from ${escapeHtml(PRODUCT_NAME)} &mdash; ${escapeHtml(ORG_NAME)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

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

  const streak = getUserStreak(user.id);

  try {
    const message = buildReminderEmail({
      name: user.name,
      todayTilawah,
      todayMurojaah,
      targetTilawah: target.tilawah_juz_daily,
      targetMurojaah: target.murojaah_juz_daily,
      currentStreak: streak.current_streak,
    });
    await sendSmtpMail({ to: user.email, subject: message.subject, text: message.text, html: message.html });
    sent++;
    console.log(`[daily-reminder] sent to ${user.email}`);
  } catch (err) {
    failed++;
    console.error(`[daily-reminder] failed for ${user.email}: ${err instanceof Error ? err.message : err}`);
  }
}

console.log(`[daily-reminder] done — sent=${sent} skipped=${skipped} failed=${failed}`);
