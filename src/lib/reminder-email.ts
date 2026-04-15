import { ORG_NAME, PRODUCT_NAME, PUBLIC_BASE_URL } from "../config.ts";
import { sendTrackedEmail } from "./email-log.ts";
import { escapeHtml, ctaButton, baseEmailHtml } from "./email-base.ts";
import { getUserTarget, getTodayTilawahTotal, getTodayMurojaahTotal } from "./targets.ts";
import { getUserStreak, getFreezeCreditsLeft } from "./streak.ts";
import { getWibDateYmd } from "./wib-date.ts";

export function buildReminderEmail(params: {
  name: string;
  todayWib: string;
  todayTilawah: number;
  todayMurojaah: number;
  targetTilawah: number;
  targetMurojaah: number;
  currentStreak: number;
  freezeCreditsLeft: number;
}): { subject: string; text: string; html: string } {
  const { name, todayWib, todayTilawah, todayMurojaah, targetTilawah, targetMurojaah, currentStreak, freezeCreditsLeft } = params;
  const firstName = name.split(" ")[0]!;
  const remaining_tilawah = Math.max(0, targetTilawah - todayTilawah).toFixed(1);
  const remaining_murojaah = Math.max(0, targetMurojaah - todayMurojaah).toFixed(1);
  const ctaUrl = `${PUBLIC_BASE_URL}/tilawah`;

  const streakLine =
    currentStreak > 0
      ? `Your current streak is 🔥 ${currentStreak} days — don't break it today!`
      : `Start a new streak today!`;

  const freezeLine =
    freezeCreditsLeft > 0
      ? `You have ${freezeCreditsLeft} freeze credit${freezeCreditsLeft === 1 ? "" : "s"} available — your streak is protected if you miss a day.`
      : null;

  const subject = `${ORG_NAME} | Daily Reminder — Complete your Quran target today`;

  const textLines = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `This is your daily reminder from ${PRODUCT_NAME}.`,
    ``,
    `Today's progress (${todayWib}):`,
    `  Tilawah:  ${todayTilawah} / ${targetTilawah} juz ${todayTilawah >= targetTilawah ? "✓" : `(${remaining_tilawah} juz remaining)`}`,
    `  Murojaah: ${todayMurojaah} / ${targetMurojaah} juz ${todayMurojaah >= targetMurojaah ? "✓" : `(${remaining_murojaah} juz remaining)`}`,
    ``,
    streakLine,
  ];
  if (freezeLine) textLines.push(freezeLine);
  textLines.push(
    ``,
    `Log your activity: ${ctaUrl}`,
    ``,
    `May Allah bless your efforts in reading and memorizing the Qur'an.`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  );
  const text = textLines.join("\n");

  const tilawahStatus =
    todayTilawah >= targetTilawah
      ? `<span style="color:#16a34a;font-weight:700;">✓ Done</span>`
      : `<span style="color:#ef4444;">${todayTilawah} / ${targetTilawah} juz &mdash; ${escapeHtml(remaining_tilawah)} juz left</span>`;

  const murojaahStatus =
    todayMurojaah >= targetMurojaah
      ? `<span style="color:#16a34a;font-weight:700;">✓ Done</span>`
      : `<span style="color:#ef4444;">${todayMurojaah} / ${targetMurojaah} juz &mdash; ${escapeHtml(remaining_murojaah)} juz left</span>`;

  const streakHtml =
    currentStreak > 0
      ? `<p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#f97316;">🔥 ${currentStreak} day streak — don't break it!</p>`
      : `<p style="margin:0 0 16px;color:#64748b;">Start a new streak today!</p>`;

  const freezeHtml =
    freezeCreditsLeft > 0
      ? `<p style="margin:0 0 16px;font-size:13px;color:#0369a1;">🧊 You have ${freezeCreditsLeft} freeze credit${freezeCreditsLeft === 1 ? "" : "s"} available — your streak is protected if you miss a day.</p>`
      : ``;

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;">You have not yet completed your daily target. Here's where you stand:</p>

    ${streakHtml}
    ${freezeHtml}

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

    ${ctaButton(ctaUrl, "Log Your Activity →")}

    <p style="margin:0;color:#475569;font-size:14px;">May Allah bless your efforts in reading and memorizing the Qur'an.</p>
  `;

  const html = baseEmailHtml({ subtitle: `Daily Reminder — ${escapeHtml(todayWib)}`, bodyHtml });

  return { subject, text, html };
}

export async function sendTestReminderEmail(user: {
  id: number;
  name: string;
  email: string;
}): Promise<void> {
  const todayWib = getWibDateYmd();
  const yearMonth = todayWib.slice(0, 7);
  const target = getUserTarget(user.id);
  const streak = getUserStreak(user.id, todayWib);
  const todayTilawah = getTodayTilawahTotal(user.id, todayWib);
  const todayMurojaah = getTodayMurojaahTotal(user.id, todayWib);
  const freezeCreditsLeft = getFreezeCreditsLeft(user.id, yearMonth);

  const message = buildReminderEmail({
    name: user.name,
    todayWib,
    todayTilawah,
    todayMurojaah,
    targetTilawah: target?.tilawah_juz_daily ?? 1,
    targetMurojaah: target?.murojaah_juz_daily ?? 1,
    currentStreak: streak.current_streak,
    freezeCreditsLeft,
  });

  await sendTrackedEmail({
    to: user.email,
    subject: `[TEST] ${message.subject}`,
    text: message.text,
    html: message.html,
    emailType: "test_daily_reminder",
    userId: user.id,
  });
}
