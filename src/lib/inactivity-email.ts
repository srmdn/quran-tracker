import { ORG_NAME, PRODUCT_NAME, PUBLIC_BASE_URL } from "../config.ts";
import { escapeHtml, ctaButton, baseEmailHtml } from "./email-base.ts";

export function buildInactivityEmail(params: {
  name: string;
  lastActivityDate: string | null;
  daysSinceActivity: number;
  totalTilawahJuz: number;
  totalMurojaahJuz: number;
}): { subject: string; text: string; html: string } {
  const { name, lastActivityDate, daysSinceActivity, totalTilawahJuz, totalMurojaahJuz } = params;
  const firstName = name.split(" ")[0]!;
  const ctaUrl = `${PUBLIC_BASE_URL}/tilawah`;

  const lastSeenLine = lastActivityDate
    ? `Your last logged activity was on ${lastActivityDate} (${daysSinceActivity} day${daysSinceActivity === 1 ? "" : "s"} ago).`
    : `We have not seen any logged activity from you yet.`;

  const subject = `${ORG_NAME} | We haven't seen you lately — come back to your Quran journey`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `It has been a while since your last activity on ${PRODUCT_NAME}.`,
    ``,
    lastSeenLine,
    ``,
    `Your all-time stats:`,
    `  Tilawah:  ${totalTilawahJuz} juz`,
    `  Murojaah: ${totalMurojaahJuz} juz`,
    ``,
    `Don't let your consistency break. Come back and log your activity today:`,
    ctaUrl,
    ``,
    `May Allah make it easy for you to maintain istiqamah in reading and memorizing the Qur'an.`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const lastSeenHtml = lastActivityDate
    ? `Your last logged activity was on <strong>${escapeHtml(lastActivityDate)}</strong> (${daysSinceActivity} day${daysSinceActivity === 1 ? "" : "s"} ago).`
    : `We have not seen any logged activity from you yet.`;

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;">It has been a while since your last activity on ${escapeHtml(PRODUCT_NAME)}.</p>
    <p style="margin:0 0 20px;color:#475569;">${lastSeenHtml}</p>

    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:20px;">
      <h2 style="margin:0 0 10px;font-size:15px;color:#1e293b;">Your All-Time Stats</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:13px;">Tilawah</td>
          <td style="padding:4px 0;font-weight:700;text-align:right;">${totalTilawahJuz} juz</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:13px;">Murojaah</td>
          <td style="padding:4px 0;font-weight:700;text-align:right;">${totalMurojaahJuz} juz</td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 16px;color:#475569;">Don't let your consistency break. Come back and log your activity today:</p>

    ${ctaButton(ctaUrl, "Log Your Activity →")}

    <p style="margin:0;color:#475569;font-size:14px;">May Allah make it easy for you to maintain istiqamah in reading and memorizing the Qur'an.</p>
  `;

  const html = baseEmailHtml({ subtitle: `We haven't seen you lately`, bodyHtml });

  return { subject, text, html };
}
