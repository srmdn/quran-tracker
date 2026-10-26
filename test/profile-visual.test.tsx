import { describe, expect, test } from "bun:test";
import { renderToString } from "hono/jsx/dom/server";
import { ProfilePage } from "../src/views/pages/ProfilePage.tsx";
import type { User } from "../src/types.ts";

const account: User = {
  id: 1, name: "Alya Contoh", email: "alya@example.test", google_id: "manual:demo:1",
  avatar_url: null, role: "santri", password_hash: "test-only-hash-never-render",
  created_at: "2026-10-26 00:00:00", updated_at: "2026-10-26 00:00:00",
};

describe("profile member layout", () => {
  test("keeps account actions and protected forms in the visual member shell", () => {
    const html = renderToString(<ProfilePage user={account} lang="id" success="Profil diperbarui." />);
    expect(html).toContain('class="app-body visual-app"');
    expect(html).toContain('href="/profile/export.csv"');
    for (const action of ["/profile/name", "/profile/avatar", "/profile/password", "/auth/logout"]) {
      expect(html).toContain(`method="post" action="${action}"`);
    }
    expect((html.match(/name="_csrf"/g) || []).length).toBe(4);
    expect(html).toContain('role="status"');
    expect(html).toContain('for="profile-current-password"');
    expect(html).not.toContain(account.password_hash!);
    expect(html).not.toContain("material-symbols-outlined");
  });

  test("Google-only accounts retain avatar editing without a password-change form", () => {
    const html = renderToString(<ProfilePage user={{...account, google_id:"google:demo", password_hash:null, avatar_url:"https://example.test/photo.png"}} lang="id" />);
    expect(html).toContain('src="https://example.test/photo.png"');
    expect(html).toContain('action="/profile/avatar"');
    expect(html).not.toContain('action="/profile/password"');
    expect(html).toContain("Pengaturan password dilakukan melalui akun Google.");
  });

  test("password fields keep the role-specific minimum and current/new autocomplete", () => {
    const html = renderToString(<ProfilePage user={{...account, role:"super_admin"}} lang="id" />);
    expect((html.match(/minlength="12"/g) || []).length).toBe(2);
    expect(html).toContain('autocomplete="current-password"');
    expect(html).toContain('autocomplete="new-password"');
    expect(html).toContain('for="profile-confirm-password"');
    expect(html).toContain("Super admin");
  });
});
