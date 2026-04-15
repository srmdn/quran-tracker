import { ORG_NAME, PRODUCT_NAME, PUBLIC_BASE_URL } from "../config.ts";
import { escapeHtml, ctaButton, baseEmailHtml } from "./email-base.ts";

export function buildSuspensionWarningEmail(params: {
  name: string;
  lastActivityDate: string | null;
  daysSinceActivity: number;
  daysUntilSuspension: number;
}): { subject: string; text: string; html: string } {
  const { name, lastActivityDate, daysSinceActivity, daysUntilSuspension } = params;
  const firstName = name.split(" ")[0]!;
  const ctaUrl = `${PUBLIC_BASE_URL}/tilawah`;

  const lastSeenLine = lastActivityDate
    ? `Your last logged activity was on ${lastActivityDate} (${daysSinceActivity} day${daysSinceActivity === 1 ? "" : "s"} ago).`
    : `We have not seen any logged activity from your account.`;

  const subject = `${ORG_NAME} | Account suspension notice — ${daysUntilSuspension} day${daysUntilSuspension === 1 ? "" : "s"} remaining`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `Your ${PRODUCT_NAME} account will be suspended in ${daysUntilSuspension} day${daysUntilSuspension === 1 ? "" : "s"} due to inactivity.`,
    ``,
    lastSeenLine,
    ``,
    `To keep your account active, log at least one tilawah or murojaah entry before the deadline.`,
    ``,
    `Log your activity now: ${ctaUrl}`,
    ``,
    `If your account is suspended, please contact the admin to request reactivation.`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const lastSeenHtml = lastActivityDate
    ? `Your last logged activity was on <strong>${escapeHtml(lastActivityDate)}</strong> (${daysSinceActivity} day${daysSinceActivity === 1 ? "" : "s"} ago).`
    : `We have not seen any logged activity from your account.`;

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-weight:700;color:#dc2626;font-size:15px;">
        Account suspension in ${daysUntilSuspension} day${daysUntilSuspension === 1 ? "" : "s"}
      </p>
      <p style="margin:0;color:#7f1d1d;font-size:13px;">
        Your account will be automatically suspended due to inactivity.
      </p>
    </div>

    <p style="margin:0 0 16px;color:#475569;">${lastSeenHtml}</p>
    <p style="margin:0 0 20px;color:#475569;">
      To keep your account active, log at least one tilawah or murojaah entry before the deadline.
    </p>

    ${ctaButton(ctaUrl, "Log Your Activity Now →")}

    <p style="margin:0;color:#94a3b8;font-size:13px;">
      If your account is suspended, please contact the admin to request reactivation.
    </p>
  `;

  const html = baseEmailHtml({ subtitle: `Account Suspension Notice`, bodyHtml });

  return { subject, text, html };
}
