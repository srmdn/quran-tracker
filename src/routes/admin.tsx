import { Hono } from "hono";
import { authMiddleware, adminMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { sendMonthlySnapshotEmails, sendSnapshotPreviewEmail } from "../lib/monthly-email.ts";
import { createPreviousMonthSnapshot } from "../lib/monthly-snapshot.ts";
import { sendTestReminderEmail } from "../lib/reminder-email.ts";
import { isAdminRole, isAssignableRole, isSuperAdminRole } from "../lib/roles.ts";
import { getWibYearMonth } from "../lib/wib-date.ts";
import { AdminPage } from "../views/pages/AdminPage.tsx";
import type { Env, User } from "../types.ts";

const admin = new Hono<Env>();

admin.use("*", authMiddleware, adminMiddleware);

admin.get("/", (c) => {
  const user = c.get("user");
  const success = c.req.query("success");
  const error = c.req.query("error");
  const editId = c.req.query("edit");

  const pendingUsers = db
    .prepare("SELECT * FROM users WHERE role = 'pending' ORDER BY created_at DESC")
    .all() as User[];

  const allUsers = db
    .prepare("SELECT * FROM users WHERE role != 'pending' ORDER BY role DESC, name ASC")
    .all() as User[];

  const editUser =
    editId && /^\d+$/.test(editId)
      ? ((db.prepare("SELECT * FROM users WHERE id = ?").get(parseInt(editId, 10)) as User | null) || undefined)
      : undefined;

  return c.html(
    <AdminPage
      user={user}
      pendingUsers={pendingUsers}
      allUsers={allUsers}
      editUser={editUser}
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
  return c.redirect("/admin?success=User approved successfully.");
});

admin.post("/users/:id/reject", (c) => {
  const userId = c.req.param("id");
  // Delete the user and their sessions
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  db.prepare("DELETE FROM users WHERE id = ? AND role = 'pending'").run(userId);
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
    return c.redirect(`/admin?edit=${userId}&error=Name and a valid email are required.`);
  }
  if (!isAssignableRole(role)) {
    return c.redirect(`/admin?edit=${userId}&error=Invalid role.`);
  }
  if (target.id === currentUser.id && isSuperAdminRole(target.role) && !isSuperAdminRole(role)) {
    return c.redirect(`/admin?edit=${userId}&error=Cannot demote your own super admin role.`);
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
    return c.redirect(`/admin?edit=${userId}&error=Failed to update user. Email may already exist.`);
  }

  return c.redirect("/admin?success=User updated successfully.");
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
    return c.redirect(`/admin?edit=${userId}&error=Password must be at least 8 characters.`);
  }

  const hash = await Bun.password.hash(password);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, userId);
  return c.redirect(`/admin?edit=${userId}&success=Password updated.`);
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
  return c.redirect("/admin?success=User role updated.");
});

admin.post("/users/:id/delete", (c) => {
  const currentUser = c.get("user");
  if (!isSuperAdminRole(currentUser.role)) {
    return c.redirect("/admin?error=Only super admin can delete users.");
  }
  const userId = parseInt(c.req.param("id"), 10);

  // Cannot delete yourself
  if (userId === currentUser.id) {
    return c.redirect("/admin?success=Cannot delete your own account.");
  }

  // Cannot delete other admins
  const target = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as { role: string } | null;
  if (!target) return c.redirect("/admin?success=User not found.");
  if (isSuperAdminRole(target.role)) {
    return c.redirect("/admin?success=Cannot delete a super admin account.");
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

export { admin as adminRoutes };
