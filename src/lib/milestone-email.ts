import { ORG_NAME, PRODUCT_NAME, PUBLIC_BASE_URL } from "../config.ts";
import { sendSmtpMail } from "./smtp.ts";
import { escapeHtml, ctaButton, baseEmailHtml } from "./email-base.ts";
import type { User } from "../types.ts";

export const STREAK_MILESTONES = [7, 30, 100];

export function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}

export async function sendKhatamEmail(user: User, khatamNumber: number): Promise<void> {
  if (!user.email) return;

  const firstName = user.name.split(" ")[0]!;
  const ordinal = khatamNumber === 1 ? "1st" : khatamNumber === 2 ? "2nd" : khatamNumber === 3 ? "3rd" : `${khatamNumber}th`;
  const ctaUrl = `${PUBLIC_BASE_URL}/dashboard`;

  const subject = `${PRODUCT_NAME} | Congratulations — Khatam #${khatamNumber}! 🎉`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `Alhamdulillah! You have completed your ${ordinal} khatam of the Qur'an on ${PRODUCT_NAME}.`,
    ``,
    `May Allah accept your recitation and bless you with its barakah.`,
    ``,
    `Keep going! View your dashboard: ${ctaUrl}`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <div style="text-align:center;padding:20px 0 24px;">
      <p style="margin:0 0 8px;font-size:40px;">🎉</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#1e293b;">Khatam #${khatamNumber}</p>
      <p style="margin:4px 0 0;color:#64748b;font-size:14px;">Alhamdulillah — ${ordinal} complete!</p>
    </div>
    <p style="margin:0 0 16px;color:#475569;text-align:center;">
      May Allah accept your recitation and bless you with its barakah.
    </p>
    ${ctaButton(ctaUrl, "View Dashboard")}
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
      ${escapeHtml(PRODUCT_NAME)} &mdash; ${escapeHtml(ORG_NAME)}
    </p>
  `;

  const html = baseEmailHtml({ subtitle: `Khatam #${khatamNumber} — Alhamdulillah!`, bodyHtml });

  await sendSmtpMail({ to: user.email, subject, text, html });
}

export async function sendStreakMilestoneEmail(user: User, streak: number): Promise<void> {
  if (!user.email) return;

  const firstName = user.name.split(" ")[0]!;
  const ctaUrl = `${PUBLIC_BASE_URL}/dashboard`;

  const subject = `${PRODUCT_NAME} | 🔥 ${streak}-day streak milestone!`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `MashaAllah! You have reached a ${streak}-day streak on ${PRODUCT_NAME}.`,
    ``,
    `Your consistency in tilawah and murojaah is an inspiration. Keep it up!`,
    ``,
    `View your dashboard: ${ctaUrl}`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <div style="text-align:center;padding:20px 0 24px;">
      <p style="margin:0 0 8px;font-size:40px;">🔥</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#f97316;">${streak}-Day Streak!</p>
      <p style="margin:4px 0 0;color:#64748b;font-size:14px;">MashaAllah — keep going!</p>
    </div>
    <p style="margin:0 0 16px;color:#475569;text-align:center;">
      Your consistency in tilawah and murojaah is an inspiration. Don't break it!
    </p>
    ${ctaButton(ctaUrl, "View Dashboard")}
  `;

  const html = baseEmailHtml({ subtitle: `${streak}-Day Streak Milestone`, bodyHtml });

  await sendSmtpMail({ to: user.email, subject, text, html });
}
