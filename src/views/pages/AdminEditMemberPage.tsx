import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { APP_NAME } from "../../config.ts";
import { isSuperAdminRole } from "../../lib/roles.ts";

export const AdminEditMemberPage: FC<{
  adminUser: User;
  member: User;
  error?: string;
  success?: string;
}> = ({ adminUser, member, error, success }) => {
  return (
    <Layout title={`Edit ${member.name} — ${APP_NAME}`}>
      <Header user={adminUser} currentPath="/admin" lang="en" />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">

        <div class="w-full mb-6">
          <a
            href={`/admin/members/${member.id}`}
            class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <span class="material-symbols-outlined text-base">arrow_back</span>
            Back to {member.name}
          </a>
        </div>

        <div class="w-full mb-6">
          <h1 class="text-text-main text-2xl font-black">Edit Member</h1>
          <p class="text-text-secondary text-sm mt-1">{member.name} · {member.email}</p>
        </div>

        {success && (
          <div class="w-full bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-6 border border-emerald-200 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">check_circle</span>
            {success}
          </div>
        )}

        {error && (
          <div class="w-full bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6 border border-red-200 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {isSuperAdminRole(adminUser.role) ? (
          <>
            <div class="w-full bg-white border border-border-light rounded-xl p-6 shadow-sm mb-4">
              <h2 class="text-text-main text-base font-bold mb-4">Account Details</h2>
              <form method="POST" action={`/admin/users/${member.id}/update`} class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1">Name</label>
                  <input
                    name="name"
                    value={member.name}
                    maxlength={100}
                    class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={member.email}
                    maxlength={254}
                    class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1">Role</label>
                  <select name="role" class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required>
                    <option value="santri" selected={member.role === "santri"}>santri</option>
                    <option value="alumni" selected={member.role === "alumni"}>alumni</option>
                    <option value="asatidz" selected={member.role === "asatidz"}>asatidz</option>
                    <option value="member" selected={member.role === "member"}>member</option>
                    <option value="admin" selected={member.role === "admin"}>admin</option>
                    <option value="super_admin" selected={member.role === "super_admin"}>super_admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </form>
            </div>

            <div class="w-full bg-white border border-border-light rounded-xl p-6 shadow-sm">
              <h2 class="text-text-main text-base font-bold mb-4">Reset Password</h2>
              <form method="POST" action={`/admin/users/${member.id}/password`} class="flex gap-3">
                <input
                  type="password"
                  name="password"
                  placeholder="New password (min 8 chars)"
                  minlength={8}
                  class="flex-1 rounded-lg border-slate-200 bg-slate-50 text-sm"
                  required
                />
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
                >
                  Reset Password
                </button>
              </form>
            </div>
          </>
        ) : (
          <div class="w-full bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-700">
            Only super admins can edit member details.
          </div>
        )}
      </main>
    </Layout>
  );
};
