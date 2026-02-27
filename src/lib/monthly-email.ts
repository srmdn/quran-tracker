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

type PeriodType = "weekly" | "monthly" | "yearly";

function getMonthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getActiveRecipients(): Array<{ id: number; email: string; name: string }> {
  const rolesSql = ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");
  const rows = db
    .prepare(`SELECT id, email, name FROM users WHERE role IN (${rolesSql}) AND email IS NOT NULL`)
    .all() as Array<{ id: number; email: string; name: string }>;
  return rows.filter((r) => !!r.email);
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

function getUserSnapshotStats(
  year: number,
  month: number,
  userId: number
): {
  rank: number;
  score: number;
  tilawah_juz: number;
  murojaah_juz: number;
  khatam_count: number;
} | null {
  return db
    .prepare(
      `SELECT rank, score, tilawah_juz, murojaah_juz, khatam_count
       FROM monthly_leaderboard_snapshots
       WHERE period_year = ? AND period_month = ? AND user_id = ?`
    )
    .get(year, month, userId) as
    | {
        rank: number;
        score: number;
        tilawah_juz: number;
        murojaah_juz: number;
        khatam_count: number;
      }
    | null;
}

function getWibGeneratedAtLabel(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(now) + " WIB";
}

function formatPeriodLabel(periodType: PeriodType, year: number, month: number, weeklyDateRange?: string): string {
  if (periodType === "weekly") {
    return weeklyDateRange
      ? `Weekly Snapshot (${weeklyDateRange})`
      : `Weekly Snapshot ${year}-${String(month).padStart(2, "0")}`;
  }
  if (periodType === "yearly") return `Yearly Snapshot ${year}`;
  return `Monthly Snapshot ${getMonthLabel(year, month)}`;
}

function buildMessage(params: {
  year: number;
  month: number;
  periodType?: PeriodType;
  weeklyDateRange?: string;
  recipientName: string;
  recipientStats: ReturnType<typeof getUserSnapshotStats>;
}): { subject: string; text: string; html: string } {
  const { year, month, recipientName, recipientStats } = params;
  const periodType = params.periodType || "monthly";
  const monthLabel = getMonthLabel(year, month);
  const periodLabel = formatPeriodLabel(periodType, year, month, params.weeklyDateRange);
  const topThree = getTopThree(year, month);
  const generatedAt = getWibGeneratedAtLabel();

  const topLines =
    topThree.length === 0
      ? "No ranking data available for this period."
      : topThree
          .map((u) => `${u.rank}. ${u.user_name_snapshot} - ${u.score} points`)
          .join("\n");

  const subject = `${periodLabel} - Quran Activity Tracker`;
  const text = [
    `Assalamu'alaikum,`,
    ``,
    `Here is your ${periodLabel}.`,
    `Generated: ${generatedAt}`,
    ``,
    `Top 3:`,
    topLines,
    ``,
    `Your Summary:`,
    recipientStats
      ? `Rank #${recipientStats.rank} | Score ${recipientStats.score} | Tilawah ${recipientStats.tilawah_juz} | Murojaah ${recipientStats.murojaah_juz} | Khatam ${recipientStats.khatam_count}`
      : "No personal snapshot data found for this period.",
    ``,
    `Keep istiqamah in tilawah and murojaah. May Allah bless your efforts.`,
    ``,
    `- Quran Activity Tracker`,
  ].join("\n");

  const topHtml =
    topThree.length === 0
      ? `<p style="margin:0;color:#64748b;">No ranking data available for this period.</p>`
      : `<ol style="margin:0;padding-left:20px;color:#1e293b;">${topThree
          .map(
            (u) =>
              `<li style="margin:6px 0;"><strong>${escapeHtml(
                u.user_name_snapshot
              )}</strong> - ${u.score} points</li>`
          )
          .join("")}</ol>`;

  const personalHtml = recipientStats
    ? `<p style="margin:0;color:#1e293b;"><strong>Rank #${recipientStats.rank}</strong><br/>Score: ${
        recipientStats.score
      }<br/>Tilawah: ${recipientStats.tilawah_juz}<br/>Murojaah: ${
        recipientStats.murojaah_juz
      }<br/>Khatam: ${recipientStats.khatam_count}</p>`
    : `<p style="margin:0;color:#64748b;">No personal snapshot data found for this period.</p>`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8faf9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#10b981;color:#ffffff;padding:18px 24px;">
                <h1 style="margin:0;font-size:20px;line-height:1.2;">Quran Activity Tracker</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:0.95;">${escapeHtml(periodLabel)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 8px;">Assalamu'alaikum ${escapeHtml(recipientName)},</p>
                <p style="margin:0 0 16px;color:#475569;">Here is your snapshot update for <strong>${escapeHtml(
                  monthLabel
                )}</strong>.</p>
                <p style="margin:0 0 16px;color:#64748b;font-size:12px;">Generated: ${escapeHtml(generatedAt)}</p>

                <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px;">
                  <h2 style="margin:0 0 10px;font-size:16px;">Top 3 Leaderboard</h2>
                  ${topHtml}
                </div>

                <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px;">
                  <h2 style="margin:0 0 10px;font-size:16px;">Your Summary</h2>
                  ${personalHtml}
                </div>

                <p style="margin:0;color:#334155;">Keep istiqamah in tilawah and murojaah. May Allah bless your efforts.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;background:#f1f5f9;color:#64748b;font-size:12px;">
                This is an automated email from Quran Activity Tracker.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export async function sendMonthlySnapshotEmails(params: {
  year: number;
  month: number;
  periodType?: PeriodType;
  weeklyDateRange?: string;
}): Promise<MonthlyEmailResult> {
  const { year, month } = params;
  const recipients = getActiveRecipients();

  let sent = 0;
  let failed = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (const recipient of recipients) {
    try {
      const message = buildMessage({
        year,
        month,
        periodType: params.periodType,
        weeklyDateRange: params.weeklyDateRange,
        recipientName: recipient.name,
        recipientStats: getUserSnapshotStats(year, month, recipient.id),
      });
      await sendSmtpMail({
        to: recipient.email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      failures.push({
        email: recipient.email,
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

export async function sendSnapshotPreviewEmail(params: {
  to: string;
  year: number;
  month: number;
  periodType?: PeriodType;
  weeklyDateRange?: string;
}): Promise<void> {
  const user = db
    .prepare("SELECT id, name FROM users WHERE email = ?")
    .get(params.to) as { id: number; name: string } | null;

  const message = buildMessage({
    year: params.year,
    month: params.month,
    periodType: params.periodType,
    weeklyDateRange: params.weeklyDateRange,
    recipientName: user?.name || "Member",
    recipientStats: user ? getUserSnapshotStats(params.year, params.month, user.id) : null,
  });

  await sendSmtpMail({
    to: params.to,
    subject: `[TEST] ${message.subject}`,
    text: message.text,
    html: message.html,
  });
}
