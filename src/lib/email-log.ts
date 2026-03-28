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
}): Promise<void> {
  const { emailType, userId = null, ...smtpParams } = params;
  try {
    await sendSmtpMail(smtpParams);
    logEmail({ userId, emailType, recipient: params.to, subject: params.subject, status: "sent" });
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
