import { Hono } from "hono";
import { authMiddleware, memberMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { t } from "../lib/i18n.ts";
import { ProfilePage } from "../views/pages/ProfilePage.tsx";
import type { Env } from "../types.ts";
import type { User } from "../types.ts";

const profile = new Hono<Env>();

profile.use("*", authMiddleware, memberMiddleware);

function redirectWith(kind: "success" | "error", message: string) {
  const q = new URLSearchParams({ [kind]: message });
  return `/profile?${q.toString()}`;
}

profile.get("/", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  return c.html(
    <ProfilePage
      user={user}
      lang={lang}
      success={c.req.query("success")}
      error={c.req.query("error")}
    />
  );
});

profile.post("/name", async (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const body = await c.req.parseBody();
  const name = ((body.name as string) || "").trim();

  if (name.length < 1) return c.redirect(redirectWith("error", t(lang, "nameTooShort")));
  if (name.length > 100) return c.redirect(redirectWith("error", t(lang, "nameTooLong")));

  db.prepare("UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name, user.id);

  return c.redirect(redirectWith("success", t(lang, "profileUpdated")));
});

profile.post("/avatar", async (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const body = await c.req.parseBody();
  const avatarUrl = ((body.avatar_url as string) || "").trim();

  if (avatarUrl === "") {
    db.prepare("UPDATE users SET avatar_url = NULL, updated_at = datetime('now') WHERE id = ?")
      .run(user.id);
    return c.redirect(redirectWith("success", t(lang, "profileUpdated")));
  }

  if (!avatarUrl.startsWith("http://") && !avatarUrl.startsWith("https://")) {
    return c.redirect(redirectWith("error", t(lang, "invalidAvatarUrl")));
  }
  if (avatarUrl.length > 500) {
    return c.redirect(redirectWith("error", t(lang, "avatarUrlTooLong")));
  }

  db.prepare("UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?")
    .run(avatarUrl, user.id);

  return c.redirect(redirectWith("success", t(lang, "profileUpdated")));
});

profile.post("/password", async (c) => {
  const user = c.get("user");
  const lang = c.get("lang");

  // Only email/password accounts can change their password
  const freshUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as User | null;
  if (!freshUser?.password_hash) {
    return c.redirect(redirectWith("error", "Password change is not available for Google accounts."));
  }

  const body = await c.req.parseBody();
  const currentPassword = (body.current_password as string) || "";
  const newPassword = (body.new_password as string) || "";
  const confirmPassword = (body.confirm_password as string) || "";

  const validCurrent = await Bun.password.verify(currentPassword, freshUser.password_hash);
  if (!validCurrent) return c.redirect(redirectWith("error", t(lang, "passwordIncorrect")));
  if (newPassword.length < 8) return c.redirect(redirectWith("error", t(lang, "passwordTooShort")));
  if (newPassword !== confirmPassword) return c.redirect(redirectWith("error", t(lang, "passwordMismatch")));

  const newHash = await Bun.password.hash(newPassword);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .run(newHash, user.id);

  return c.redirect(redirectWith("success", t(lang, "passwordChanged")));
});

profile.get("/export.csv", (c) => {
  const user = c.get("user");

  const tilawahRows = db
    .prepare(
      `SELECT date_wib, juz_amount, start_surah, start_ayah, start_juz, end_surah, end_ayah, end_juz, created_at
       FROM tilawah_logs WHERE user_id = ? ORDER BY date_wib DESC, created_at DESC`
    )
    .all(user.id) as Array<{
      date_wib: string; juz_amount: number;
      start_surah: number | null; start_ayah: number | null; start_juz: number | null;
      end_surah: number | null; end_ayah: number | null; end_juz: number | null;
      created_at: string;
    }>;

  const murojaahRows = db
    .prepare(
      `SELECT date_wib, juz_amount, start_surah, start_ayah, start_juz, end_surah, end_ayah, end_juz, created_at
       FROM murojaah_logs WHERE user_id = ? ORDER BY date_wib DESC, created_at DESC`
    )
    .all(user.id) as Array<{
      date_wib: string; juz_amount: number;
      start_surah: number | null; start_ayah: number | null; start_juz: number | null;
      end_surah: number | null; end_ayah: number | null; end_juz: number | null;
      created_at: string;
    }>;

  function csvVal(v: string | number | null): string {
    if (v === null || v === undefined) return "";
    return String(v);
  }

  const header = "date,type,juz_amount,start_juz,start_surah,start_ayah,end_juz,end_surah,end_ayah,logged_at";

  const tilawahLines = tilawahRows.map((r) =>
    [r.date_wib, "tilawah", csvVal(r.juz_amount), csvVal(r.start_juz), csvVal(r.start_surah), csvVal(r.start_ayah), csvVal(r.end_juz), csvVal(r.end_surah), csvVal(r.end_ayah), r.created_at].join(",")
  );

  const murojaahLines = murojaahRows.map((r) =>
    [r.date_wib, "murojaah", csvVal(r.juz_amount), csvVal(r.start_juz), csvVal(r.start_surah), csvVal(r.start_ayah), csvVal(r.end_juz), csvVal(r.end_surah), csvVal(r.end_ayah), r.created_at].join(",")
  );

  const allLines = [...tilawahLines.map((l, i) => ({ line: l, key: tilawahRows[i].date_wib + tilawahRows[i].created_at })),
                    ...murojaahLines.map((l, i) => ({ line: l, key: murojaahRows[i].date_wib + murojaahRows[i].created_at }))]
    .sort((a, b) => b.key.localeCompare(a.key))
    .map((x) => x.line);

  const csv = [header, ...allLines].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="quran-log-${user.id}.csv"`,
    },
  });
});

export { profile as profileRoutes };
