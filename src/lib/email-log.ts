import { db } from "../db/connection.ts";
import { sendSmtpMail } from "./smtp.ts";

function logEmail(params: {
  userId: number | null;
  emailType: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed";
  error?: string;
}): void {
  try {
    db.prepare(
      "INSERT INTO email_log (user_id, email_type, recipient, subject, status, error) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      params.userId ?? null,
      params.emailType,
      params.recipient,
      params.subject,
      params.status,
      params.error ?? null
    );
  } catch {
    // Never let log failures propagate — email delivery is more important
  }
}

export async function sendTrackedEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  emailType: string;
  userId?: number | null;
  notif?: boolean;
}): Promise<"sent" | "failed" | "skipped"> {
  const { emailType, userId = null, notif = false, ...smtpParams } = params;
  if (notif && userId) {
    const row = db.prepare("SELECT email_notif_enabled FROM users WHERE id = ?").get(userId) as
      | { email_notif_enabled: number | null }
      | undefined;
    if (row && row.email_notif_enabled === 0) {
      return "skipped";
    }
  }
  try {
    await sendSmtpMail(smtpParams);
    logEmail({ userId, emailType, recipient: params.to, subject: params.subject, status: "sent" });
    return "sent";
  } catch (err) {
    logEmail({
      userId,
      emailType,
      recipient: params.to,
      subject: params.subject,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
