import { initializeDatabase } from "../db/schema.ts";
import { db } from "../db/connection.ts";
import { ACTIVE_MEMBER_ROLES } from "../lib/roles.ts";
import { sendSuspendEmail } from "../lib/welcome-email.ts";
import { getWibDateYmd } from "../lib/wib-date.ts";
import type { User } from "../types.ts";

initializeDatabase();

const SUSPEND_DAYS = 28;

const todayWib = getWibDateYmd();
const rolesSql = ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");

// Users who:
// - are active members and not yet suspended
// - have no tilawah or murojaah logs in the last 28 days
const candidates = db.prepare(`
  SELECT id, name, email, role, avatar_url, suspended_at, created_at, updated_at
  FROM users
  WHERE role IN (${rolesSql})
    AND email IS NOT NULL
    AND suspended_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM tilawah_logs t
      WHERE t.user_id = users.id
        AND t.date_wib >= date('now', '-${SUSPEND_DAYS} days')
    )
    AND NOT EXISTS (
      SELECT 1 FROM murojaah_logs m
      WHERE m.user_id = users.id
        AND m.date_wib >= date('now', '-${SUSPEND_DAYS} days')
    )
`).all() as User[];

console.log(`[auto-suspend] date=${todayWib} candidates=${candidates.length}`);

let suspended = 0;
let failed = 0;

for (const user of candidates) {
  try {
    db.prepare("UPDATE users SET suspended_at = datetime('now'), updated_at = datetime('now') WHERE id = ?")
      .run(user.id);

    // Fetch updated record before sending email
    const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as User;
    await sendSuspendEmail(updated);

    suspended++;
    console.log(`[auto-suspend] suspended ${user.email} (id: ${user.id})`);
  } catch (err) {
    failed++;
    console.error(`[auto-suspend] failed for ${user.email}: ${err instanceof Error ? err.message : err}`);
  }
}

console.log(`[auto-suspend] done — suspended=${suspended} failed=${failed}`);
