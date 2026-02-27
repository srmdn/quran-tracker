import { db } from "../db/connection.ts";
import { ACTIVE_MEMBER_ROLES } from "./roles.ts";
import { sendSmtpMail } from "./smtp.ts";

export type MonthlyEmailResult = {
  year: number;
  month: number;
  attempted: number;
  sent: number;
  failed: number;
  failures: Array<{ email: string; error: string }>;
};

function getMonthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function getActiveRecipients(): string[] {
  const rolesSql = ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");
  const rows = db
    .prepare(`SELECT DISTINCT email FROM users WHERE role IN (${rolesSql}) AND email IS NOT NULL`)
    .all() as Array<{ email: string }>;
  return rows.map((r) => r.email).filter(Boolean);
}

function getTopThree(year: number, month: number): Array<{ rank: number; user_name_snapshot: string; score: number }> {
  return db
    .prepare(
      `SELECT rank, user_name_snapshot, score
       FROM monthly_leaderboard_snapshots
       WHERE period_year = ? AND period_month = ? AND rank <= 3
       ORDER BY rank ASC`
    )
    .all(year, month) as Array<{ rank: number; user_name_snapshot: string; score: number }>;
}

function buildMessage(year: number, month: number): { subject: string; text: string } {
  const monthLabel = getMonthLabel(year, month);
  const topThree = getTopThree(year, month);

  const topLines =
    topThree.length === 0
      ? "No ranking data available for this period."
      : topThree
          .map((u) => `${u.rank}. ${u.user_name_snapshot} - ${u.score} points`)
          .join("\n");

  const subject = `Monthly Quran Activity Leaderboard - ${monthLabel}`;
  const text = [
    `Assalamu'alaikum,`,
    ``,
    `Here is the monthly leaderboard snapshot for ${monthLabel}:`,
    ``,
    topLines,
    ``,
    `Keep istiqamah in tilawah and murojaah. May Allah bless your efforts.`,
    ``,
    `- Quran Activity Tracker`,
  ].join("\n");

  return { subject, text };
}

export async function sendMonthlySnapshotEmails(params: {
  year: number;
  month: number;
}): Promise<MonthlyEmailResult> {
  const { year, month } = params;
  const recipients = getActiveRecipients();
  const { subject, text } = buildMessage(year, month);

  let sent = 0;
  let failed = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (const email of recipients) {
    try {
      await sendSmtpMail({ to: email, subject, text });
      sent += 1;
    } catch (err) {
      failed += 1;
      failures.push({
        email,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return {
    year,
    month,
    attempted: recipients.length,
    sent,
    failed,
    failures,
  };
}
