import { Hono } from "hono";
import { authMiddleware, adminMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { sendMonthlySnapshotEmails, sendSnapshotPreviewEmail } from "../lib/monthly-email.ts";
import { createPreviousMonthSnapshot } from "../lib/monthly-snapshot.ts";
import { sendTestReminderEmail } from "../lib/reminder-email.ts";
import { sendApprovalEmail, sendRejectionEmail, sendRoleChangeEmail, sendWelcomeEmail, sendNewMemberAlertToAdmins, sendSuspendEmail, sendUnsuspendEmail } from "../lib/welcome-email.ts";
import { sendKhatamEmail, sendStreakMilestoneEmail } from "../lib/milestone-email.ts";
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
import type { EnrollmentRow, } from "../views/pages/AdminEnrollmentsPage.tsx";
import type { Enrollment } from "../views/pages/AdminEnrollmentDetailPage.tsx";
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

  return c.html(
    <AdminPage
      user={user}
      lang={lang}
      pendingUsers={pendingUsers}
      allUsers={allUsers}
      success={success}
      error={error}
    />
  );
});

admin.post("/users/:id/approve", (c) => {
  const userId = c.req.param("id");
  db.prepare("UPDATE users SET role = 'santri', updated_at = datetime('now') WHERE id = ? AND role = 'pending'").run(
    userId
  );
  const approved = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | null;
  if (approved) sendApprovalEmail(approved).catch(() => {});
  return c.redirect("/admin?success=User approved successfully.");
});

admin.post("/users/:id/reject", (c) => {
  const userId = c.req.param("id");
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
    const passwordHash = password ? await Bun.password.hash(password) : null;
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
      const passwordHash = await Bun.password.hash(password);
      db.prepare(
        "UPDATE users SET name = ?, email = ?, role = ?, password_hash = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(name, email, role, passwordHash, userId);
    } else {
      db.prepare(
        "UPDATE users SET name = ?, email = ?, role = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(name, email, role, userId);
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

  const hash = await Bun.password.hash(password);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, userId);
  return c.redirect(`/admin/members/${userId}/edit?success=Password updated.`);
});

admin.post("/users/:id/role", async (c) => {
  const userId = c.req.param("id");
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
    emailMsg = ` Email failed to run: ${err instanceof Error ? err.message : "Unknown error"}.`;
  }

  return c.redirect(
    `/admin?success=Snapshot created for ${period} with ${result.rowsInserted} rows.${emailMsg}`
  );
});

admin.post("/email/test-approval", async (c) => {
  const user = c.get("user");
  if (!user.email) {
    return c.redirect("/admin?error=Your account has no email address.");
  }
  try {
    await sendApprovalEmail(user);
    return c.redirect("/admin?success=Test approval email sent to " + user.email);
  } catch (err) {
    return c.redirect(
      `/admin?error=Failed to send test approval: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
});

admin.post("/email/test-reminder", async (c) => {
  const user = c.get("user");
  if (!user.email) {
    return c.redirect("/admin?error=Your account has no email address.");
  }
  try {
    await sendTestReminderEmail({ id: user.id, name: user.name, email: user.email });
    return c.redirect("/admin?success=Test reminder email sent to " + user.email);
  } catch (err) {
    return c.redirect(
      `/admin?error=Failed to send test reminder: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
});

admin.post("/email/test-snapshot", async (c) => {
  const user = c.get("user");
  if (!user.email) {
    return c.redirect("/admin?error=Your account has no email address.");
  }
  try {
    const { year, month } = getWibYearMonth();
    await sendSnapshotPreviewEmail({ to: user.email, year, month });
    return c.redirect("/admin?success=Test snapshot email sent to " + user.email);
  } catch (err) {
    return c.redirect(
      `/admin?error=Failed to send test snapshot: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
});

admin.post("/email/test-khatam", async (c) => {
  const user = c.get("user");
  if (!user.email) {
    return c.redirect("/admin?error=Your account has no email address.");
  }
  try {
    await sendKhatamEmail(user, 1);
    return c.redirect("/admin?success=Test khatam email sent to " + user.email);
  } catch (err) {
    return c.redirect(
      `/admin?error=Failed to send test khatam: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
});

admin.post("/email/test-streak", async (c) => {
  const user = c.get("user");
  if (!user.email) {
    return c.redirect("/admin?error=Your account has no email address.");
  }
  try {
    await sendStreakMilestoneEmail(user, 7);
    return c.redirect("/admin?success=Test streak email (7 days) sent to " + user.email);
  } catch (err) {
    return c.redirect(
      `/admin?error=Failed to send test streak: ${err instanceof Error ? err.message : "Unknown error"}`
    );
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
  const streak = getUserStreak(memberId);
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

admin.get("/enrollments", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const perPage = 20;
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const total = (db.prepare("SELECT COUNT(*) AS cnt FROM enrollments").get() as { cnt: number }).cnt;
  const rows = db
    .prepare(
      "SELECT id, full_name, gender, whatsapp, program_type, quran_level, submitted_at FROM enrollments ORDER BY submitted_at DESC LIMIT ? OFFSET ?"
    )
    .all(perPage, (page - 1) * perPage) as EnrollmentRow[];

  return c.html(
    <AdminEnrollmentsPage user={user} lang={lang} rows={rows} total={total} page={page} perPage={perPage} />
  );
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
