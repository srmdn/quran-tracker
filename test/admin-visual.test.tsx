import { expect, test } from "bun:test";
import { renderToString } from "hono/jsx/dom/server";
import { AdminPage } from "../src/views/pages/AdminPage.tsx";
import { AdminEditMemberPage } from "../src/views/pages/AdminEditMemberPage.tsx";
import { PendingPage } from "../src/views/pages/PendingPage.tsx";
import { SuspendedPage } from "../src/views/pages/SuspendedPage.tsx";
import type { User } from "../src/types.ts";
const admin:User={id:4,name:"Admin Demo",email:"admin@example.test",google_id:"manual:demo",role:"super_admin",avatar_url:null,created_at:"2026-10-01",updated_at:"2026-10-01"};
const member:User={...admin,id:1,name:"Alya Contoh",role:"santri"};
test("admin shell retains protected management controls and accessible member filters",()=>{
 const html=renderToString(<AdminPage user={admin} lang="id" pendingUsers={[]} allUsers={[member,admin]} suspendedCount={0} emailsSentToday={0} emailsFailedToday={0}/>);
 expect(html).toContain('class="app-body visual-app"');expect(html).toContain('/public/admin-visual.css');
 expect(html).not.toContain('material-symbols-outlined');expect(html).not.toContain('mobile-menu-btn');
 expect((html.match(/<main /g)||[]).length).toBe(1);
 for(const action of ['/admin/users/create','/admin/users/1/role','/admin/users/1/suspend','/admin/users/1/delete','/admin/snapshots/run'])expect(html).toContain(`action="${action}"`);
 expect((html.match(/method="post"/g)||[]).length).toBe((html.match(/name="_csrf"/g)||[]).length);
 expect(html).toContain('aria-label="Cari nama atau email"');expect(html).toContain('aria-label="Tindakan untuk Alya Contoh"');
 expect(html).toContain('data-role="santri"');expect(html).toContain('data-confirm=');expect(html).not.toContain('/admin/enrollments');
});
test("ordinary admins retain view access without super-admin action forms",()=>{
 const html=renderToString(<AdminPage user={{...admin,role:"admin"}} lang="id" pendingUsers={[]} allUsers={[member]} suspendedCount={0} emailsSentToday={0} emailsFailedToday={0}/>);
 expect(html).not.toContain('action="/admin/users/create"');expect(html).not.toContain('action="/admin/users/1/delete"');
 expect(html).toContain('href="/admin/members/1"');
});
test("edit member preserves labels and role-specific password policy",()=>{
 const html=renderToString(<AdminEditMemberPage adminUser={admin} member={admin}/>);
 expect(html).toContain('action="/admin/users/4/update"');expect(html).toContain('action="/admin/users/4/password"');
 expect(html).toContain('minlength="12"');expect(html).toContain('for="reset-password"');expect(html).toContain('for="edit-email"');
 expect(html).not.toContain('material-symbols-outlined');
});
test("pending and suspended screens use the new public shell and retain CSRF logout",()=>{
 for(const Page of [PendingPage,SuspendedPage]){
  const html=renderToString(<Page user={member} lang="id"/>);
  expect(html).toContain('class="visual-public"');expect(html).toContain('action="/auth/logout"');expect(html).toContain('name="_csrf"');
  expect(html).toContain('href="/landing"');expect(html).not.toContain('marketing-header');
 }
});
