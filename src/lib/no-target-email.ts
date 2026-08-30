import { ORG_NAME, PRODUCT_NAME, PUBLIC_BASE_URL } from "../config.ts";
import { sendTrackedEmail } from "./email-log.ts";
import { escapeHtml, ctaButton, baseEmailHtml } from "./email-base.ts";
import type { User } from "../types.ts";

export async function sendNoTargetNudgeEmail(user: User): Promise<void> {
  if (!user.email) return;

  const firstName = user.name.split(" ")[0]!;
  const ctaUrl = `${PUBLIC_BASE_URL}/dashboard`;

  const subject = `${PRODUCT_NAME} | Set your daily target to get started`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `Your account on ${PRODUCT_NAME} (${ORG_NAME}) is active, but you haven't set your daily`,
    `Tilawah and Murojaah targets yet.`,
    ``,
    `Setting a target takes less than a minute and unlocks your daily reminders,`,
    `streak tracking, and the community leaderboard.`,
    ``,
    `Set your target here: ${ctaUrl}`,
    ``,
    `May Allah bless your Quran journey.`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;">
      Your account on <strong>${escapeHtml(PRODUCT_NAME)}</strong> is active, but you haven't set your
      daily <strong>Tilawah</strong> and <strong>Murojaah</strong> targets yet.
    </p>
    <p style="margin:0 0 16px;color:#475569;">
      Setting a target takes less than a minute and unlocks your daily reminders,
      streak tracking, and the community leaderboard.
    </p>
    ${ctaButton(ctaUrl, "Set My Daily Target")}
    <p style="margin:0;color:#475569;font-size:14px;">May Allah bless your Quran journey.</p>
  `;

  const html = baseEmailHtml({ subtitle: "Set Your Daily Target", bodyHtml });

  await sendTrackedEmail({ to: user.email, subject, text, html, emailType: "no_target_nudge", userId: user.id });
}
