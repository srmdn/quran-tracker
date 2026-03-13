import { db } from "../db/connection.ts";
import type { User } from "../types.ts";

export function createSession(userId: number): string {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(id, userId, expiresAt);

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

export function cleanExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

export function upsertUser(params: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}): { user: User; isNew: boolean } {
  // Check if any users exist - first user becomes super_admin
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  const isFirstUser = count.c === 0;

  const existing = db
    .prepare("SELECT * FROM users WHERE google_id = ?")
    .get(params.googleId) as User | null;

  if (existing) {
    db.prepare(
      "UPDATE users SET name = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(params.name, params.avatarUrl, existing.id);
    return { user: { ...existing, name: params.name, avatar_url: params.avatarUrl }, isNew: false };
  }

  // If a manual account exists for this email, bind it to this Google identity.
  const existingByEmail = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(params.email) as User | null;

  if (existingByEmail) {
    db.prepare(
      "UPDATE users SET google_id = ?, name = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(params.googleId, params.name, params.avatarUrl, existingByEmail.id);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(existingByEmail.id) as User;
    return { user, isNew: false };
  }

  const role = isFirstUser ? "super_admin" : "pending";
  const result = db
    .prepare(
      "INSERT INTO users (google_id, email, name, avatar_url, role) VALUES (?, ?, ?, ?, ?)"
    )
    .run(params.googleId, params.email, params.name, params.avatarUrl, role);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as User;
  return { user, isNew: true };
}
