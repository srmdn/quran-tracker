import { db } from "../db/connection.ts";
import { sanitizeExternalDisplayName } from "./validation.ts";
import type { User } from "../types.ts";

export function createSession(userId: number): string {
  const id = crypto.randomUUID();

  db.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))"
  ).run(id, userId);

  return id;
}

export function getSessionUser(sessionId: string): User | null {
  const row = db
    .prepare(
      `SELECT u.* FROM users u
       JOIN sessions s ON s.user_id = u.id
       WHERE s.id = ? AND s.expires_at > datetime('now')`
    )
    .get(sessionId) as User | null;

  return row;
}

export function deleteSession(sessionId: string) {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function deleteOtherSessions(userId: number, keepSessionId: string): void {
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").run(userId, keepSessionId);
}

export function deleteSessionsForUser(userId: number): void {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function cleanExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

export function warnIfNoUsers(): void {
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (count.c === 0) {
    console.warn(
      "[bootstrap] users table is empty; the first signup will become super_admin. Seed an administrator before exposing this instance."
    );
  }
}

export function upsertUser(params: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}): { user: User; isNew: boolean } {
  const displayName = sanitizeExternalDisplayName(params.name);

  // Check if any users exist - first user becomes super_admin
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  const isFirstUser = count.c === 0;

  const existing = db
    .prepare("SELECT * FROM users WHERE google_id = ?")
    .get(params.googleId) as User | null;

  if (existing) {
    db.prepare(
      "UPDATE users SET name = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(displayName, params.avatarUrl, existing.id);
    return { user: { ...existing, name: displayName, avatar_url: params.avatarUrl }, isNew: false };
  }

  // If a manual account exists for this email, bind it to this Google identity.
  const existingByEmail = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(params.email) as User | null;

  if (existingByEmail) {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existingByEmail.id);
    db.prepare(
      "UPDATE users SET google_id = ?, name = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(params.googleId, displayName, params.avatarUrl, existingByEmail.id);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(existingByEmail.id) as User;
    return { user, isNew: false };
  }

  const role = isFirstUser ? "super_admin" : "pending";
  const result = db
    .prepare(
      "INSERT INTO users (google_id, email, name, avatar_url, role) VALUES (?, ?, ?, ?, ?)"
    )
    .run(params.googleId, params.email, displayName, params.avatarUrl, role);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as User;
  return { user, isNew: true };
}
