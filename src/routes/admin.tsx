import { Hono } from "hono";
import { authMiddleware, adminMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { sendMonthlySnapshotEmails, sendSnapshotPreviewEmail } from "../lib/monthly-email.ts";
import { createPreviousMonthSnapshot } from "../lib/monthly-snapshot.ts";
import { sendTestReminderEmail } from "../lib/reminder-email.ts";
import { sendApprovalEmail, sendRejectionEmail, sendRoleChangeEmail, sendWelcomeEmail, sendNewMemberAlertToAdmins, sendSuspendEmail, sendUnsuspendEmail } from "../lib/welcome-email.ts";
import { sendKhatamEmail, sendStreakMilestoneEmail } from "../lib/milestone-email.ts";
import { sendNoTargetNudgeEmail } from "../lib/no-target-email.ts";
import { isAdminRole, isAssignableRole, isSuperAdminRole } from "../lib/roles.ts";
import { getWibDateYmd, getWibYearMonth } from "../lib/wib-date.ts";
import { getUserTarget, getTodayTilawahTotal, getTodayMurojaahTotal } from "../lib/targets.ts";
import { getUserStreak } from "../lib/streak.ts";
import { getUserActivityTotals, getCurrentMonthUserActivityRank } from "../lib/activity-calc.ts";
import { AdminPage } from "../views/pages/AdminPage.tsx";
import { AdminMemberDetailPage } from "../views/pages/AdminMemberDetailPage.tsx";
import { AdminEditMemberPage } from "../views/pages/AdminEditMemberPage.tsx";
import { AdminEnrollmentsPage } from "../views/pages/AdminEnrollmentsPage.tsx";
import { AdminEnrollmentDetailPage } from "../views/pages/AdminEnrollmentDetailPage.tsx";
import { AdminEmailLogPage } from "../views/pages/AdminEmailLogPage.tsx";
import type { EnrollmentRow } from "../views/pages/AdminEnrollmentsPage.tsx";
import type { Enrollment } from "../views/pages/AdminEnrollmentDetailPage.tsx";
import type { EmailLogRow } from "../views/pages/AdminEmailLogPage.tsx";
import { toWib } from "../views/pages/AdminEmailLogPage.tsx";
import type { RecentLogEntry } from "../routes/dashboard.tsx";
import type { Env, User } from "../types.ts";

const admin = new Hono<Env>();

admin.use("*", authMiddleware, adminMiddleware);

admin.get("/", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const success = c.req.query("success");
  const error = c.req.query("error");

  const pendingUsers = db
    .prepare("SELECT * FROM users WHERE role = 'pending' ORDER BY created_at DESC")
    .all() as User[];

  const allUsers = db
    .prepare("SELECT * FROM users WHERE role != 'pending' ORDER BY role DESC, name ASC")
    .all() as User[];

  const suspendedCount = (
    db.prepare("SELECT COUNT(*) AS cnt FROM users WHERE role != 'pending' AND suspended_at IS NOT NULL").get() as { cnt: number }
  ).cnt;

  const emailStats = db
    .prepare("SELECT status, COUNT(*) AS cnt FROM email_log WHERE sent_at >= datetime('now', 'start of day') GROUP BY status")
    .all() as { status: string; cnt: number }[];
  const emailsSentToday = emailStats.find((s) => s.status === "sent")?.cnt ?? 0;
  const emailsFailedToday = emailStats.find((s) => s.status === "failed")?.cnt ?? 0;

  return c.html(
    <AdminPage
      user={user}
      lang={lang}
      pendingUsers={pendingUsers}
      allUsers={allUsers}
      suspendedCount={suspendedCount}
      emailsSentToday={emailsSentToday}
      emailsFailedToday={emailsFailedToday}
      success={success}
      error={error}
    />
  );
});

admin.post("/users/:id/approve", (c) => {
  const userId = parseInt(c.req.param("id"), 10);
  if (!Number.isFinite(userId)) return c.redirect("/admin?error=Invalid user ID.");
  db.prepare("UPDATE users SET role = 'santri', updated_at = datetime('now') WHERE id = ? AND role = 'pending'").run(
    userId
  );
  const approved = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | null;
  if (approved) sendApprovalEmail(approved).catch(() => {});
  return c.redirect("/admin?success=User approved successfully.");
});

admin.post("/users/:id/reject", (c) => {
  const userId = parseInt(c.req.param("id"), 10);
  if (!Number.isFinite(userId)) return c.redirect("/admin?error=Invalid user ID.");
  const rejected = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'pending'").get(userId) as User | null;
  // Delete the user and their sessions
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  db.prepare("DELETE FROM users WHERE id = ? AND role = 'pending'").run(userId);
  if (rejected) sendRejectionEmail(rejected).catch(() => {});
  return c.redirect("/admin?success=User rejected and removed.");
});

admin.post("/users/create", async (c) => {
  const currentUser = c.get("user");
  if (!isSuperAdminRole(currentUser.role)) {
    return c.redirect("/admin?error=Only super admin can create users.");
  }

  const body = await c.req.parseBody();
  const name = ((body.name as string) || "").trim();
  const email = ((body.email as string) || "").trim().toLowerCase();
  const role = ((body.role as string) || "").trim();
  const password = ((body.password as string) || "").trim();

  if (!name || !email || !email.includes("@")) {
    return c.redirect("/admin?error=Name and a valid email are required.");
  }
  if (!isAssignableRole(role)) {
    return c.redirect("/admin?error=Invalid role.");
  }

  try {
    const passwordHash = password ? await Bun.password.hash(password, { algorithm: "bcrypt" }) : null;
    db.prepare(
      "INSERT INTO users (google_id, email, name, avatar_url, role, password_hash) VALUES (?, ?, ?, NULL, ?, ?)"
    ).run(`manual:${crypto.randomUUID()}`, email, name, role, passwordHash);
  } catch {
    return c.redirect("/admin?error=Failed to create user. Email may already exist.");
  }

  const created = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as import("../types.ts").User | null;
  if (created) {
    sendWelcomeEmail(created).catch(() => {});
    sendNewMemberAlertToAdmins(created).catch(() => {});
  }

  return c.redirect("/admin?success=User created successfully.");
});

admin.post("/users/:id/update", async (c) => {
  const currentUser = c.get("user");
  if (!isSuperAdminRole(currentUser.role)) {
    return c.redirect("/admin?error=Only super admin can edit users.");
  }

  const userId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(userId)) {
    return c.redirect("/admin?error=Invalid user id.");
  }

  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | null;
  if (!target) {
    return c.redirect("/admin?error=User not found.");
  }

  const body = await c.req.parseBody();
  const name = ((body.name as string) || "").trim();
  const email = ((body.email as string) || "").trim().toLowerCase();
  const role = ((body.role as string) || "").trim();
  const password = ((body.password as string) || "").trim();
  const emailNotifEnabled = body.email_notif_enabled === "1" ? 1 : 0;

  if (!name || !email || !email.includes("@")) {
    return c.redirect(`/admin/members/${userId}/edit?error=Name and a valid email are required.`);
  }
  if (!isAssignableRole(role)) {
    return c.redirect(`/admin/members/${userId}/edit?error=Invalid role.`);
  }
  if (target.id === currentUser.id && isSuperAdminRole(target.role) && !isSuperAdminRole(role)) {
    return c.redirect(`/admin/members/${userId}/edit?error=Cannot demote your own super admin role.`);
  }

  try {
    if (password) {
      const passwordHash = await Bun.password.hash(password, { algorithm: "bcrypt" });
      db.prepare(
        "UPDATE users SET name = ?, email = ?, role = ?, email_notif_enabled = ?, password_hash = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(name, email, role, emailNotifEnabled, passwordHash, userId);
    } else {
      db.prepare(
        "UPDATE users SET name = ?, email = ?, role = ?, email_notif_enabled = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(name, email, role, emailNotifEnabled, userId);
    }
  } catch {
    return c.redirect(`/admin/members/${userId}/edit?error=Failed to update user. Email may already exist.`);
  }

  if (target.role !== role) {
    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | null;
    if (updatedUser) sendRoleChangeEmail(updatedUser, role).catch(() => {});
  }

  return c.redirect(`/admin/members/${userId}?success=User updated successfully.`);
});

admin.post("/users/:id/password", async (c) => {
  const currentUser = c.get("user");
  if (!isSuperAdminRole(currentUser.role)) {
    return c.redirect("/admin?error=Only super admin can reset passwords.");
  }

  const userId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(userId)) {
    return c.redirect("/admin?error=Invalid user id.");
  }

  const body = await c.req.parseBody();
  const password = ((body.password as string) || "").trim();
  if (!password || password.length < 8) {
    return c.redirect(`/admin/members/${userId}/edit?error=Password must be at least 8 characters.`);
  }

  const hash = await Bun.password.hash(password, { algorithm: "bcrypt" });
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, userId);
  return c.redirect(`/admin/members/${userId}/edit?success=Password updated.`);
});

admin.post("/users/:id/role", async (c) => {
  const userId = parseInt(c.req.param("id"), 10);
  if (!Number.isFinite(userId)) return c.redirect("/admin?error=Invalid user ID.");
  const body = await c.req.parseBody();
  const role = body.role as string;
  const currentUser = c.get("user");

  if (!isAssignableRole(role)) {
    return c.redirect("/admin");
  }
  if (!isSuperAdminRole(currentUser.role)) {
    return c.redirect("/admin?error=Only super admin can change roles.");
  }

  db.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?").run(role, userId);
  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | null;
  if (updated) sendRoleChangeEmail(updated, role).catch(() => {});
  return c.redirect("/admin?success=User role updated.");
});

admin.post("/users/:id/suspend", (c) => {
  const currentUser = c.get("user");
  if (!isSuperAdminRole(currentUser.role)) {
    return c.redirect("/admin?error=Only super admin can suspend users.");
  }
  const userId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(userId)) {
    return c.redirect("/admin?error=Invalid user id.");
  }
  if (userId === currentUser.id) {
    return c.redirect("/admin?error=Cannot suspend your own account.");
  }
  const target = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as { role: string } | null;
  if (!target) return c.redirect("/admin?error=User not found.");
  if (isAdminRole(target.role)) {
    return c.redirect("/admin?error=Cannot suspend an admin account.");
  }
  db.prepare("UPDATE users SET suspended_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(userId);
  const suspendedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | null;
  if (suspendedUser) sendSuspendEmail(suspendedUser).catch(() => {});
  return c.redirect("/admin?success=User suspended.");
});

admin.post("/users/:id/unsuspend", (c) => {
  const currentUser = c.get("user");
  if (!isSuperAdminRole(currentUser.role)) {
    return c.redirect("/admin?error=Only super admin can unsuspend users.");
  }
  const userId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(userId)) {
    return c.redirect("/admin?error=Invalid user id.");
  }
  db.prepare("UPDATE users SET suspended_at = NULL, updated_at = datetime('now') WHERE id = ?").run(userId);
  const unsuspendedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | null;
  if (unsuspendedUser) sendUnsuspendEmail(unsuspendedUser).catch(() => {});
  return c.redirect("/admin?success=User unsuspended.");
});

admin.post("/users/:id/email-notif", async (c) => {
  const currentUser = c.get("user");
  if (!isSuperAdminRole(currentUser.role)) {
    return c.redirect(`/admin/members/${c.req.param("id")}?error=Only super admin can change email notification settings.`);
  }
  const userId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(userId)) {
    return c.redirect("/admin?error=Invalid user id.");
  }
  const body = await c.req.parseBody();
  const enabled = body.enabled === "1" ? 1 : 0;
  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(userId) as { id: number } | null;
  if (!target) return c.redirect("/admin?error=User not found.");
  db.prepare("UPDATE users SET email_notif_enabled = ?, updated_at = datetime('now') WHERE id = ?").run(enabled, userId);
  return c.redirect(
    `/admin/members/${userId}?success=${enabled ? "Email notifications enabled." : "Email notifications disabled for this member."}`
  );
});

admin.post("/users/:id/delete", (c) => {
  const currentUser = c.get("user");
  if (!isSuperAdminRole(currentUser.role)) {
    return c.redirect("/admin?error=Only super admin can delete users.");
  }
  const userId = parseInt(c.req.param("id"), 10);

  // Cannot delete yourself
  if (userId === currentUser.id) {
    return c.redirect("/admin?error=Cannot delete your own account.");
  }

  // Cannot delete other admins
  const target = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as { role: string } | null;
  if (!target) return c.redirect("/admin?error=User not found.");
  if (isSuperAdminRole(target.role)) {
    return c.redirect("/admin?error=Cannot delete a super admin account.");
  }

  // ON DELETE CASCADE handles sessions, progress_entries, progress_log
  db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  return c.redirect("/admin?success=Member removed successfully.");
});

admin.post("/snapshots/run", async (c) => {
  const result = createPreviousMonthSnapshot();
  const period = `${result.year}-${String(result.month).padStart(2, "0")}`;

  if (result.status === "skipped") {
    return c.redirect(`/admin?success=Snapshot skipped for ${period}. ${result.reason || ""}`);
  }

  let emailMsg = " Email not attempted.";
  try {
    const mail = await sendMonthlySnapshotEmails({ year: result.year, month: result.month });
    emailMsg = ` Email result: sent ${mail.sent}/${mail.attempted}, failed ${mail.failed}.`;
  } catch (err) {
    console.error("[admin] snapshot email failed:", err);
    emailMsg = " Email failed to send. Check server logs.";
  }

  return c.redirect(
    `/admin?success=Snapshot created for ${period} with ${result.rowsInserted} rows.${emailMsg}`
  );
});

admin.post("/email/test-approval", async (c) => {
  const user = c.get("user");
  if (!user.email) {
    return c.redirect("/admin/email-log?error=Your account has no email address.");
  }
  try {
    await sendApprovalEmail(user);
    return c.redirect("/admin/email-log?success=Test approval email sent to " + user.email);
  } catch (err) {
    console.error("[admin] test-approval email failed:", err);
    return c.redirect("/admin?error=Failed to send test approval email. Check server logs.");
  }
});

admin.post("/email/test-reminder", async (c) => {
  const user = c.get("user");
  if (!user.email) {
    return c.redirect("/admin/email-log?error=Your account has no email address.");
  }
  try {
    await sendTestReminderEmail({ id: user.id, name: user.name, email: user.email });
    return c.redirect("/admin/email-log?success=Test reminder email sent to " + user.email);
  } catch (err) {
    console.error("[admin] test-reminder email failed:", err);
    return c.redirect("/admin?error=Failed to send test reminder email. Check server logs.");
  }
});

admin.post("/email/test-snapshot", async (c) => {
  const user = c.get("user");
  if (!user.email) {
    return c.redirect("/admin/email-log?error=Your account has no email address.");
  }
  try {
    const { year, month } = getWibYearMonth();
    await sendSnapshotPreviewEmail({ to: user.email, year, month });
    return c.redirect("/admin/email-log?success=Test snapshot email sent to " + user.email);
  } catch (err) {
    console.error("[admin] test-snapshot email failed:", err);
    return c.redirect("/admin?error=Failed to send test snapshot email. Check server logs.");
  }
});

admin.post("/email/test-khatam", async (c) => {
  const user = c.get("user");
  if (!user.email) {
    return c.redirect("/admin/email-log?error=Your account has no email address.");
  }
  try {
    await sendKhatamEmail(user, 1, { notif: false });
    return c.redirect("/admin/email-log?success=Test khatam email sent to " + user.email);
  } catch (err) {
    console.error("[admin] test-khatam email failed:", err);
    return c.redirect("/admin?error=Failed to send test khatam email. Check server logs.");
  }
});

admin.post("/email/test-streak", async (c) => {
  const user = c.get("user");
  if (!user.email) {
    return c.redirect("/admin/email-log?error=Your account has no email address.");
  }
  try {
    await sendStreakMilestoneEmail(user, 7, { notif: false });
    return c.redirect("/admin/email-log?success=Test streak email (7 days) sent to " + user.email);
  } catch (err) {
    console.error("[admin] test-streak email failed:", err);
    return c.redirect("/admin?error=Failed to send test streak email. Check server logs.");
  }
});

admin.get("/members/:id/edit", (c) => {
  const adminUser = c.get("user");
  const memberId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(memberId)) return c.redirect("/admin?error=Invalid member ID.");

  const member = db.prepare("SELECT * FROM users WHERE id = ?").get(memberId) as User | null;
  if (!member) return c.redirect("/admin?error=Member not found.");

  return c.html(
    <AdminEditMemberPage
      adminUser={adminUser}
      member={member}
      error={c.req.query("error")}
      success={c.req.query("success")}
    />
  );
});

admin.get("/members/:id", (c) => {
  const adminUser = c.get("user");
  const lang = c.get("lang");
  const memberId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(memberId)) return c.redirect("/admin?error=Invalid member ID.");

  const member = db.prepare("SELECT * FROM users WHERE id = ?").get(memberId) as User | null;
  if (!member) return c.redirect("/admin?error=Member not found.");

  const todayWib = getWibDateYmd();
  const target = getUserTarget(memberId);
  const streak = getUserStreak(memberId, todayWib);
  const activityTotals = getUserActivityTotals(memberId);
  const todayTilawah = getTodayTilawahTotal(memberId, todayWib);
  const todayMurojaah = getTodayMurojaahTotal(memberId, todayWib);
  const monthlyRank = getCurrentMonthUserActivityRank(memberId);

  const recentLogs = db
    .prepare(
      `SELECT type, date_wib, juz_amount, end_surah, end_ayah, end_juz, repetition_count, created_at
       FROM (
         SELECT 'tilawah' AS type, date_wib, juz_amount, end_surah, end_ayah, end_juz,
                NULL AS repetition_count, created_at
         FROM tilawah_logs WHERE user_id = ?
         UNION ALL
         SELECT 'murojaah' AS type, date_wib, juz_amount, end_surah, end_ayah, end_juz,
                repetition_count, created_at
         FROM murojaah_logs WHERE user_id = ?
       )
       ORDER BY created_at DESC
       LIMIT 100`
    )
    .all(memberId, memberId) as RecentLogEntry[];

  const khatamEvents = db
    .prepare(
      `SELECT type, date_wib FROM khatam_events WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(memberId) as { type: string; date_wib: string }[];

  return c.html(
    <AdminMemberDetailPage
      adminUser={adminUser}
      lang={lang}
      member={member}
      target={target}
      streak={streak}
      activityTotals={activityTotals}
      todayTilawah={todayTilawah}
      todayMurojaah={todayMurojaah}
      todayWib={todayWib}
      monthlyRank={monthlyRank}
      recentLogs={recentLogs}
      khatamEvents={khatamEvents}
      success={c.req.query("success")}
      error={c.req.query("error")}
    />
  );
});

admin.get("/email-log", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const perPage = 50;
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const filterStatus = c.req.query("status") || "";
  const filterType = c.req.query("type") || "";
  const flashSuccess = c.req.query("success") || "";
  const flashError = c.req.query("error") || "";

  const conditions: string[] = [];
  const args: (string | number)[] = [];
  if (filterStatus === "sent" || filterStatus === "failed") {
    conditions.push("status = ?");
    args.push(filterStatus);
  }
  if (filterType) {
    conditions.push("email_type = ?");
    args.push(filterType);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = (db.prepare(`SELECT COUNT(*) AS cnt FROM email_log ${where}`).get(...args) as { cnt: number }).cnt;
  const rows = db
    .prepare(`SELECT el.id, el.user_id, el.email_type, el.recipient, el.subject, el.status, el.error, el.sent_at, u.name AS user_name FROM email_log el LEFT JOIN users u ON u.id = el.user_id ${where.replaceAll("status = ?", "el.status = ?").replaceAll("email_type = ?", "el.email_type = ?")} ORDER BY el.sent_at DESC LIMIT ? OFFSET ?`)
    .all(...args, perPage, (page - 1) * perPage) as EmailLogRow[];

  const sentTotal = (db.prepare("SELECT COUNT(*) AS cnt FROM email_log WHERE status = 'sent'").get() as { cnt: number }).cnt;
  const failedTotal = (db.prepare("SELECT COUNT(*) AS cnt FROM email_log WHERE status = 'failed'").get() as { cnt: number }).cnt;
  const todaySent = (db.prepare("SELECT COUNT(*) AS cnt FROM email_log WHERE status = 'sent' AND sent_at >= datetime('now', 'start of day')").get() as { cnt: number }).cnt;
  const todayFailed = (db.prepare("SELECT COUNT(*) AS cnt FROM email_log WHERE status = 'failed' AND sent_at >= datetime('now', 'start of day')").get() as { cnt: number }).cnt;

  const smtpConfigured = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM
  );

  const allTypes = [
    "approval", "daily_reminder", "inactivity_reminder", "khatam",
    "monthly_snapshot", "monthly_snapshot_preview", "new_member_alert_admin",
    "no_target_nudge", "overtaken", "rejection", "role_change",
    "streak_milestone", "suspend", "test_daily_reminder", "unsuspend", "welcome",
  ];

  return c.html(
    <AdminEmailLogPage
      user={user}
      lang={lang}
      rows={rows}
      total={total}
      sentTotal={sentTotal}
      failedTotal={failedTotal}
      todaySent={todaySent}
      todayFailed={todayFailed}
      smtpConfigured={smtpConfigured}
      page={page}
      perPage={perPage}
      filterStatus={filterStatus}
      filterType={filterType}
      allTypes={allTypes}
      flashSuccess={flashSuccess}
      flashError={flashError}
    />
  );
});

admin.get("/email-log/export", (c) => {
  const filterStatus = c.req.query("status") || "";
  const filterType = c.req.query("type") || "";

  const conditions: string[] = [];
  const args: string[] = [];
  if (filterStatus === "sent" || filterStatus === "failed") {
    conditions.push("el.status = ?");
    args.push(filterStatus);
  }
  if (filterType) {
    conditions.push("el.email_type = ?");
    args.push(filterType);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(`SELECT el.email_type, el.recipient, el.subject, el.status, el.error, el.sent_at, u.name AS user_name FROM email_log el LEFT JOIN users u ON u.id = el.user_id ${where} ORDER BY el.sent_at DESC`)
    .all(...args) as Array<{ email_type: string; recipient: string; subject: string; status: string; error: string | null; sent_at: string; user_name: string | null }>;

  const escapeCsv = (value: string | null | undefined): string => {
    const s = value ?? "";
    return `"${s.replaceAll('"', '""')}"`;
  };

  const header = "sent_at_wib,email_type,status,recipient,user_name,subject,error";
  const lines = rows.map((row) =>
    [toWib(row.sent_at), row.email_type, row.status, row.recipient, row.user_name, row.subject, row.error].map(escapeCsv).join(",")
  );
  const csv = [header, ...lines].join("\r\n");

  const filename = `email-log-${getWibDateYmd()}.csv`;
  return c.body(csv, 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
});

admin.post("/email-log/:id/resend", async (c) => {
  const logId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(logId)) return c.redirect("/admin/email-log?error=Invalid+log+id.");

  const row = db
    .prepare("SELECT id, user_id, email_type, status FROM email_log WHERE id = ?")
    .get(logId) as { id: number; user_id: number | null; email_type: string; status: string } | null;

  if (!row) return c.redirect("/admin/email-log?error=Log+entry+not+found.");
  if (row.status !== "failed") return c.redirect("/admin/email-log?error=Only+failed+emails+can+be+resent.");
  if (!row.user_id) return c.redirect("/admin/email-log?error=Cannot+resend:+no+user+linked+to+this+log+entry.");

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(row.user_id) as User | null;
  if (!user) return c.redirect("/admin/email-log?error=User+not+found.");

  try {
    switch (row.email_type) {
      case "approval":        await sendApprovalEmail(user); break;
      case "welcome":         await sendWelcomeEmail(user); break;
      case "rejection":       await sendRejectionEmail(user); break;
      case "suspend":         await sendSuspendEmail(user); break;
      case "unsuspend":       await sendUnsuspendEmail(user); break;
      case "no_target_nudge": await sendNoTargetNudgeEmail(user); break;
      default:
        return c.redirect("/admin/email-log?error=This+email+type+cannot+be+resent+manually.");
    }
  } catch {
    return c.redirect("/admin/email-log?error=Resend+failed:+check+SMTP+config.");
  }

  return c.redirect("/admin/email-log?success=Email+resent+successfully.");
});

admin.get("/enrollments", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const perPage = 20;
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const statusFilter = c.req.query("status") || "pending";
  const success = c.req.query("success") || "";
  const error = c.req.query("error") || "";

  const validStatuses = ["pending", "approved", "rejected", "all"];
  const safeStatus = validStatuses.includes(statusFilter) ? statusFilter : "pending";

  const where = safeStatus === "all" ? "" : "WHERE status = ?";
  const args: (string | number)[] = safeStatus === "all" ? [] : [safeStatus];

  const total = (db.prepare(`SELECT COUNT(*) AS cnt FROM enrollments ${where}`).get(...args) as { cnt: number }).cnt;
  const rows = db
    .prepare(
      `SELECT id, full_name, gender, whatsapp, program_type, quran_level, submitted_at, status FROM enrollments ${where} ORDER BY submitted_at DESC LIMIT ? OFFSET ?`
    )
    .all(...args, perPage, (page - 1) * perPage) as EnrollmentRow[];

  return c.html(
    <AdminEnrollmentsPage
      user={user} lang={lang} rows={rows} total={total}
      page={page} perPage={perPage} statusFilter={safeStatus}
      success={success} error={error}
    />
  );
});

admin.post("/enrollments/bulk", async (c) => {
  const fd = await c.req.raw.formData();
  const action = (fd.get("action") as string | null) || "";
  const rawIds = fd.getAll("ids");
  const ids = rawIds
    .map((id) => parseInt(id as string, 10))
    .filter((n) => Number.isFinite(n));

  if (!["approve", "reject"].includes(action)) {
    return c.redirect("/admin/enrollments?error=Invalid action.");
  }
  if (ids.length === 0) {
    return c.redirect("/admin/enrollments?error=No enrollments selected.");
  }

  const placeholders = ids.map(() => "?").join(", ");
  const newStatus = action === "approve" ? "approved" : "rejected";
  db.prepare(
    `UPDATE enrollments SET status = '${newStatus}' WHERE id IN (${placeholders}) AND status = 'pending'`
  ).run(...ids);

  const count = ids.length;
  const verb = action === "approve" ? "approved" : "rejected";
  return c.redirect(`/admin/enrollments?success=${count} enrollment${count !== 1 ? "s" : ""} ${verb}.&status=pending`);
});

admin.get("/enrollments/:id", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const id = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(id)) return c.redirect("/admin/enrollments?error=Invalid ID.");

  const enrollment = db
    .prepare("SELECT * FROM enrollments WHERE id = ?")
    .get(id) as Enrollment | null;
  if (!enrollment) return c.redirect("/admin/enrollments?error=Enrollment not found.");

  return c.html(
    <AdminEnrollmentDetailPage user={user} lang={lang} enrollment={enrollment} />
  );
});

export { admin as adminRoutes };
