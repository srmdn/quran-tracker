import { db } from "../db/connection.ts";
import { ORG_NAME, PRODUCT_NAME, PUBLIC_BASE_URL } from "../config.ts";
import { sendTrackedEmail } from "./email-log.ts";
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

  await sendTrackedEmail({ to: user.email, subject, text, html, emailType: "welcome", userId: user.id });
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

  await sendTrackedEmail({ to: user.email, subject, text, html, emailType: "approval", userId: user.id });
}

export async function sendRoleChangeEmail(user: User, newRole: string): Promise<void> {
  if (!user.email) return;

  const firstName = user.name.split(" ")[0]!;
  const ctaUrl = `${PUBLIC_BASE_URL}/dashboard`;

  const subject = `${PRODUCT_NAME} | Your account role has been updated`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `Your account role on ${PRODUCT_NAME} (${ORG_NAME}) has been updated to: ${newRole}`,
    ``,
    `Visit your dashboard: ${ctaUrl}`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;">
      Your account role on <strong>${escapeHtml(PRODUCT_NAME)}</strong> has been updated.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
      <tr>
        <td style="padding:4px 12px 4px 0;color:#64748b;font-size:13px;">New role</td>
        <td style="padding:4px 0;font-weight:700;">${escapeHtml(newRole)}</td>
      </tr>
    </table>
    ${ctaButton(ctaUrl, "Go to Dashboard")}
  `;

  const html = baseEmailHtml({ subtitle: "Account Role Updated", bodyHtml });

  await sendTrackedEmail({ to: user.email, subject, text, html, emailType: "role_change", userId: user.id });
}

export async function sendRejectionEmail(user: User): Promise<void> {
  if (!user.email) return;

  const firstName = user.name.split(" ")[0]!;

  const subject = `Your ${PRODUCT_NAME} registration update`;

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `We're sorry to inform you that your registration request for ${PRODUCT_NAME} (${ORG_NAME})`,
    `could not be approved at this time.`,
    ``,
    `If you believe this is a mistake or have questions, please contact us directly.`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;">
      We're sorry to inform you that your registration request for
      <strong>${escapeHtml(PRODUCT_NAME)}</strong> (${escapeHtml(ORG_NAME)}) could not be approved at this time.
    </p>
    <p style="margin:0;color:#475569;font-size:14px;">
      If you believe this is a mistake or have questions, please contact us directly.
    </p>
  `;

  const html = baseEmailHtml({ subtitle: "Registration Update", bodyHtml });

  await sendTrackedEmail({ to: user.email, subject, text, html, emailType: "rejection", userId: user.id });
}

export async function sendSuspendEmail(user: User): Promise<void> {
  if (!user.email) return;
  const firstName = user.name.split(" ")[0]!;
  const subject = `${PRODUCT_NAME} | Your account has been suspended`;
  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `Your account on ${PRODUCT_NAME} (${ORG_NAME}) has been suspended.`,
    ``,
    `If you believe this is a mistake, please contact an admin directly.`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");
  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;">
      Your account on <strong>${escapeHtml(PRODUCT_NAME)}</strong> (${escapeHtml(ORG_NAME)}) has been suspended.
    </p>
    <p style="margin:0;color:#475569;font-size:14px;">
      If you believe this is a mistake, please contact an admin directly.
    </p>
  `;
  const html = baseEmailHtml({ subtitle: "Account Suspended", bodyHtml });
  await sendTrackedEmail({ to: user.email, subject, text, html, emailType: "suspend", userId: user.id });
}

export async function sendUnsuspendEmail(user: User): Promise<void> {
  if (!user.email) return;
  const firstName = user.name.split(" ")[0]!;
  const ctaUrl = `${PUBLIC_BASE_URL}/dashboard`;
  const subject = `${PRODUCT_NAME} | Your account has been reinstated`;
  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `Good news! Your account on ${PRODUCT_NAME} (${ORG_NAME}) has been reinstated.`,
    ``,
    `You can now log in and continue tracking your Tilawah and Murojaah.`,
    ``,
    `Visit the app: ${ctaUrl}`,
    ``,
    `May Allah bless your Quran journey.`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");
  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;">
      Good news! Your account on <strong>${escapeHtml(PRODUCT_NAME)}</strong> has been reinstated.
    </p>
    <p style="margin:0 0 16px;color:#475569;">
      You can now log in and continue tracking your <strong>Tilawah</strong> and <strong>Murojaah</strong>.
    </p>
    ${ctaButton(ctaUrl, "Go to Dashboard")}
    <p style="margin:0;color:#475569;font-size:14px;">May Allah bless your Quran journey.</p>
  `;
  const html = baseEmailHtml({ subtitle: "Account Reinstated", bodyHtml });
  await sendTrackedEmail({ to: user.email, subject, text, html, emailType: "unsuspend", userId: user.id });
}

export async function sendNewMemberAlertToAdmins(user: User): Promise<void> {
  const admins = db
    .prepare(
      `SELECT id, email, name FROM users
       WHERE role IN ('super_admin', 'admin') AND email IS NOT NULL AND id != ?`
    )
    .all(user.id) as Array<{ id: number; email: string; name: string }>;

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
      await sendTrackedEmail({ to: admin.email, subject, text, html, emailType: "new_member_alert_admin", userId: admin.id });
    } catch {
      // Best-effort — don't fail if one admin email bounces
    }
  }
}
