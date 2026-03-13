import { db } from "../db/connection.ts";
import { ORG_NAME, PRODUCT_NAME, PUBLIC_BASE_URL } from "../config.ts";
import { sendSmtpMail } from "./smtp.ts";
import { escapeHtml, ctaButton, baseEmailHtml } from "./email-base.ts";
import type { User } from "../types.ts";

export async function sendWelcomeEmail(user: User): Promise<void> {
  if (!user.email) return;

  const firstName = user.name.split(" ")[0]!;
  const ctaUrl = `${PUBLIC_BASE_URL}/setup`;

  const subject = `Welcome to ${PRODUCT_NAME} — ${ORG_NAME}`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `Welcome to ${PRODUCT_NAME} at ${ORG_NAME}!`,
    ``,
    `Your account has been registered. Once an admin approves your account, you can start`,
    `tracking your daily Tilawah and Murojaah.`,
    ``,
    `Visit the app: ${PUBLIC_BASE_URL}`,
    ``,
    `May Allah bless your Quran journey.`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;">
      Welcome to <strong>${escapeHtml(PRODUCT_NAME)}</strong> at ${escapeHtml(ORG_NAME)}!
      Your account has been registered.
    </p>
    <p style="margin:0 0 16px;color:#475569;">
      Once an admin approves your account, you can start tracking your daily
      <strong>Tilawah</strong> and <strong>Murojaah</strong>.
    </p>
    ${ctaButton(PUBLIC_BASE_URL, "Go to App")}
    <p style="margin:0;color:#475569;font-size:14px;">May Allah bless your Quran journey.</p>
  `;

  const html = baseEmailHtml({ subtitle: `Welcome to ${PRODUCT_NAME}`, bodyHtml });

  await sendSmtpMail({ to: user.email, subject, text, html });
}

export async function sendApprovalEmail(user: User): Promise<void> {
  if (!user.email) return;

  const firstName = user.name.split(" ")[0]!;
  const ctaUrl = `${PUBLIC_BASE_URL}/setup`;

  const subject = `Your ${PRODUCT_NAME} account has been approved!`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `Great news! Your account on ${PRODUCT_NAME} (${ORG_NAME}) has been approved.`,
    ``,
    `You can now log in and start tracking your daily Tilawah and Murojaah.`,
    ``,
    `Get started: ${ctaUrl}`,
    ``,
    `May Allah bless your Quran journey.`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;">
      Great news! Your account on <strong>${escapeHtml(PRODUCT_NAME)}</strong> (${escapeHtml(ORG_NAME)}) has been approved.
    </p>
    <p style="margin:0 0 16px;color:#475569;">
      You can now log in and start tracking your daily <strong>Tilawah</strong> and <strong>Murojaah</strong>.
    </p>
    ${ctaButton(ctaUrl, "Get Started")}
    <p style="margin:0;color:#475569;font-size:14px;">May Allah bless your Quran journey.</p>
  `;

  const html = baseEmailHtml({ subtitle: "Account Approved", bodyHtml });

  await sendSmtpMail({ to: user.email, subject, text, html });
}

export async function sendNewMemberAlertToAdmins(user: User): Promise<void> {
  const admins = db
    .prepare(
      `SELECT email, name FROM users
       WHERE role IN ('super_admin', 'admin') AND email IS NOT NULL AND id != ?`
    )
    .all(user.id) as Array<{ email: string; name: string }>;

  if (admins.length === 0) return;

  const ctaUrl = `${PUBLIC_BASE_URL}/admin`;
  const subject = `${PRODUCT_NAME} | New member registered: ${user.name}`;

  const text = [
    `A new member has registered on ${PRODUCT_NAME}.`,
    ``,
    `Name:  ${user.name}`,
    `Email: ${user.email ?? "(no email)"}`,
    ``,
    `Visit admin panel to approve: ${ctaUrl}`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;">A new member has registered on <strong>${escapeHtml(PRODUCT_NAME)}</strong>.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:4px 12px 4px 0;color:#64748b;font-size:13px;">Name</td>
        <td style="padding:4px 0;font-weight:700;">${escapeHtml(user.name)}</td>
      </tr>
      <tr>
        <td style="padding:4px 12px 4px 0;color:#64748b;font-size:13px;">Email</td>
        <td style="padding:4px 0;">${escapeHtml(user.email ?? "(no email)")}</td>
      </tr>
    </table>
    ${ctaButton(ctaUrl, "Open Admin Panel")}
  `;

  const html = baseEmailHtml({ subtitle: "New Member Registration", bodyHtml });

  for (const admin of admins) {
    try {
      await sendSmtpMail({ to: admin.email, subject, text, html });
    } catch {
      // Best-effort — don't fail if one admin email bounces
    }
  }
}
