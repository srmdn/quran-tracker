import { describe, expect, test } from "bun:test";
import { renderToString } from "hono/jsx/dom/server";
import { AdminPage } from "../src/views/pages/AdminPage.tsx";
import type { User } from "../src/types.ts";

const payload = "X') && (alert('XSS'), true) || ('";

const admin: User = {
  id: 1,
  google_id: "manual:admin",
  email: "admin@example.test",
  name: "Admin",
  avatar_url: null,
  role: "super_admin",
  created_at: "2026-01-01 00:00:00",
  updated_at: "2026-01-01 00:00:00",
};

const member: User = {
  ...admin,
  id: 2,
  google_id: "manual:member",
  email: "member@example.test",
  name: payload,
  role: "santri",
};

describe("admin member list", () => {
  test("does not place a member name inside an inline event handler", () => {
    const html = renderToString(
      <AdminPage
        user={admin}
        lang="en"
        pendingUsers={[]}
        allUsers={[admin, member]}
        suspendedCount={0}
        emailsSentToday={0}
        emailsFailedToday={0}
      />
    );

    expect(html).not.toContain("onsubmit=");
    expect(html).toContain("data-confirm=");
    expect(html).toContain("Make X&#39;) &amp;&amp; (alert(&#39;XSS&#39;), true) || (&#39; an admin?");
  });

  test("keeps the ordinary confirmation behavior through data attributes", () => {
    const html = renderToString(
      <AdminPage
        user={admin}
        lang="en"
        pendingUsers={[]}
        allUsers={[admin, { ...member, name: "Siti Aisyah" }]}
        suspendedCount={0}
        emailsSentToday={0}
        emailsFailedToday={0}
      />
    );

    expect(html).toContain("data-confirm=");
    expect(html).toContain("Permanently delete Siti Aisyah?");
  });
});
