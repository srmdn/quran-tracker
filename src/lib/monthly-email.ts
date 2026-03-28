import { db } from "../db/connection.ts";
import { ACTIVE_MEMBER_ROLES } from "./roles.ts";
import { ORG_NAME, PRODUCT_NAME, PUBLIC_BASE_URL } from "../config.ts";
import { sendTrackedEmail } from "./email-log.ts";
import { escapeHtml, ctaButton, baseEmailHtml } from "./email-base.ts";
import { getMonthlyActivityLeaderboard, getMonthlyUserActivityRank } from "./activity-calc.ts";
import { getUserStreak } from "./streak.ts";

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

function getActiveRecipients(): Array<{ id: number; email: string; name: string }> {
  const rolesSql = ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");
  const rows = db
    .prepare(`SELECT id, email, name FROM users WHERE role IN (${rolesSql}) AND email IS NOT NULL`)
    .all() as Array<{ id: number; email: string; name: string }>;
  return rows.filter((r) => !!r.email);
}

function getWibGeneratedAtLabel(now = new Date()): string {
  return (
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(now) + " WIB"
  );
}

function buildMessage(params: {
  year: number;
  month: number;
  recipientId: number;
  recipientName: string;
  topThree: Array<{ rank: number; name: string; score: number }>;
}): { subject: string; text: string; html: string } {
  const { year, month, recipientId, recipientName, topThree } = params;
  const monthLabel = getMonthLabel(year, month);
  const firstName = recipientName.split(" ")[0]!;
  const generatedAt = getWibGeneratedAtLabel();
  const ctaUrl = `${PUBLIC_BASE_URL}/activity/leaderboard`;

  const recipientStats = getMonthlyUserActivityRank(recipientId, year, month);
  const streak = getUserStreak(recipientId);

  const subject = `${ORG_NAME} | Monthly Snapshot | ${monthLabel}`;

  // Plain text
  const topLines =
    topThree.length === 0
      ? "No data yet for this month."
      : topThree.map((u) => `${u.rank}. ${u.name} — ${u.score} pts`).join("\n");

  const personalLines = recipientStats
    ? [
        `Rank: #${recipientStats.rank}`,
        `Score: ${recipientStats.score} pts`,
        `Tilawah: ${recipientStats.tilawahJuz} juz`,
        `Murojaah: ${recipientStats.murojaahJuz} juz`,
        `Khatam: ${recipientStats.khatamCount}x`,
        `Streak: 🔥 ${streak.current_streak} days`,
      ].join("\n")
    : "No activity recorded this month.";

  const text = [
    `Assalamu'alaikum ${firstName},`,
    ``,
    `Here is your monthly snapshot for ${monthLabel}.`,
    `Generated: ${generatedAt}`,
    ``,
    `Top 3 this month:`,
    topLines,
    ``,
    `Your summary:`,
    personalLines,
    ``,
    `View full leaderboard: ${ctaUrl}`,
    ``,
    `Keep istiqamah in tilawah and murojaah. May Allah bless your efforts.`,
    ``,
    `— ${PRODUCT_NAME} (${ORG_NAME})`,
  ].join("\n");

  // HTML
  const topHtml =
    topThree.length === 0
      ? `<p style="margin:0;color:#64748b;">No activity data yet for this month.</p>`
      : `<ol style="margin:0;padding-left:20px;color:#1e293b;">${topThree
          .map(
            (u) =>
              `<li style="margin:6px 0;"><strong>${escapeHtml(u.name)}</strong> &mdash; ${u.score} pts</li>`
          )
          .join("")}</ol>`;

  const personalHtml = recipientStats
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:13px;">Rank</td>
          <td style="padding:4px 0;font-weight:700;text-align:right;">#${recipientStats.rank}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:13px;">Score</td>
          <td style="padding:4px 0;font-weight:700;text-align:right;">${recipientStats.score} pts</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:13px;">Tilawah</td>
          <td style="padding:4px 0;text-align:right;">${recipientStats.tilawahJuz} juz</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:13px;">Murojaah</td>
          <td style="padding:4px 0;text-align:right;">${recipientStats.murojaahJuz} juz</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:13px;">Khatam</td>
          <td style="padding:4px 0;text-align:right;">${recipientStats.khatamCount}x</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:13px;">Streak</td>
          <td style="padding:4px 0;text-align:right;">🔥 ${streak.current_streak} days</td>
        </tr>
      </table>`
    : `<p style="margin:0;color:#64748b;">No activity recorded this month.</p>`;

  const bodyHtml = `
    <p style="margin:0 0 16px;">Assalamu'alaikum <strong>${escapeHtml(firstName)}</strong>,</p>
    <p style="margin:0 0 4px;color:#475569;">Here is your monthly snapshot for <strong>${escapeHtml(monthLabel)}</strong>.</p>
    <p style="margin:0 0 16px;color:#94a3b8;font-size:12px;">Generated: ${escapeHtml(generatedAt)}</p>

    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:14px;">
      <h2 style="margin:0 0 10px;font-size:15px;color:#1e293b;">Top 3 This Month</h2>
      ${topHtml}
    </div>

    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:16px;">
      <h2 style="margin:0 0 10px;font-size:15px;color:#1e293b;">Your Summary</h2>
      ${personalHtml}
    </div>

    ${ctaButton(ctaUrl, "View Full Leaderboard")}

    <p style="margin:0;color:#334155;font-size:14px;">Keep istiqamah in tilawah and murojaah. May Allah bless your efforts.</p>
  `;

  const html = baseEmailHtml({ subtitle: `Monthly Snapshot — ${monthLabel}`, bodyHtml });

  return { subject, text, html };
}

export async function sendMonthlySnapshotEmails(params: {
  year: number;
  month: number;
}): Promise<MonthlyEmailResult> {
  const { year, month } = params;
  const recipients = getActiveRecipients();

  // Fetch live leaderboard once; top 3 is shared across all emails
  const leaderboard = getMonthlyActivityLeaderboard({ year, month, page: 1, perPage: 10000 });
  const topThree = leaderboard.rows.slice(0, 3).map((r) => ({
    rank: r.rank,
    name: r.name,
    score: r.score,
  }));

  let sent = 0;
  let failed = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (const recipient of recipients) {
    try {
      const message = buildMessage({
        year,
        month,
        recipientId: recipient.id,
        recipientName: recipient.name,
        topThree,
      });
      await sendTrackedEmail({
        to: recipient.email,
        subject: message.subject,
        text: message.text,
        html: message.html,
        emailType: "monthly_snapshot",
        userId: recipient.id,
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
}): Promise<void> {
  const user = db
    .prepare("SELECT id, name FROM users WHERE email = ?")
    .get(params.to) as { id: number; name: string } | null;

  const leaderboard = getMonthlyActivityLeaderboard({
    year: params.year,
    month: params.month,
    page: 1,
    perPage: 10000,
  });
  const topThree = leaderboard.rows.slice(0, 3).map((r) => ({
    rank: r.rank,
    name: r.name,
    score: r.score,
  }));

  const message = buildMessage({
    year: params.year,
    month: params.month,
    recipientId: user?.id ?? 0,
    recipientName: user?.name ?? "Member",
    topThree,
  });

  await sendTrackedEmail({
    to: params.to,
    subject: `[TEST] ${message.subject}`,
    text: message.text,
    html: message.html,
    emailType: "monthly_snapshot_preview",
    userId: user?.id ?? null,
  });
}
