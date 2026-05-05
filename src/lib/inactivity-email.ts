import { ORG_NAME, PRODUCT_NAME, PUBLIC_BASE_URL } from "../config.ts";
import { escapeHtml, ctaButton, baseEmailHtml } from "./email-base.ts";

export function buildInactivityEmail(params: {
  name: string;
  lastActivityDate: string | null;
}): { subject: string; text: string; html: string } {
  const { name, lastActivityDate } = params;
  const firstName = name.split(" ")[0]!;
  const ctaUrl = `${PUBLIC_BASE_URL}/tilawah`;

  const lastSeenLine = lastActivityDate
    ? `Your last logged activity was on ${lastActivityDate}.`
    : `We haven't seen any logged activity from you yet.`;

  const subject = `${ORG_NAME} | A gentle reminder — come back to your Quran journey`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `It looks like you haven't logged any activity this week on ${PRODUCT_NAME}.`,
    ``,
    lastSeenLine,
    ``,
    `Even a little bit counts. Come back and log your activity today:`,
    ctaUrl,
    ``,
    `May Allah make it easy for you to maintain istiqamah in reading and memorizing the Qur'an.`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const lastSeenHtml = lastActivityDate
    ? `Your last logged activity was on <strong>${escapeHtml(lastActivityDate)}</strong>.`
    : `We haven't seen any logged activity from you yet.`;

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;">
      It looks like you haven't logged any activity this week on ${escapeHtml(PRODUCT_NAME)}.
    </p>
    <p style="margin:0 0 20px;color:#475569;">${lastSeenHtml}</p>
    <p style="margin:0 0 20px;color:#475569;">Even a little bit counts. Come back and log your activity today:</p>

    ${ctaButton(ctaUrl, "Log Your Activity →")}

    <p style="margin:0;color:#475569;font-size:14px;">May Allah make it easy for you to maintain istiqamah in reading and memorizing the Qur'an.</p>
  `;

  const html = baseEmailHtml({ subtitle: `A gentle reminder`, bodyHtml });

  return { subject, text, html };
}
