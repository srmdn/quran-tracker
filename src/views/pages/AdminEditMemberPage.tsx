import { CsrfInput } from "../components/CsrfInput.tsx";
import type { FC } from "hono/jsx";
import { AdminLayout } from "../AdminLayout.tsx";
import { Icon } from "../components/Icon.tsx";
import type { User } from "../../types.ts";
import { passwordMinimum } from "../../lib/validation.ts";
import { isSuperAdminRole } from "../../lib/roles.ts";

export const AdminEditMemberPage: FC<{
  adminUser: User;
  member: User;
  error?: string;
  success?: string;
}> = ({ adminUser, member, error, success }) => {
  return (
    <AdminLayout title={"Edit anggota"} user={adminUser} lang={"id"}>
      <div class="admin-content">

        <div class="w-full mb-6">
          <a
            href={`/admin/members/${member.id}`}
            class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <Icon name="arrow" size={18} class="icon admin-back"/>
            Kembali ke {member.name}
          </a>
        </div>

        <div class="w-full mb-6">
          <h1 class="text-text-main text-2xl font-black">Edit anggota</h1>
          <p class="text-text-secondary text-sm mt-1">{member.name} · {member.email}</p>
        </div>

        {success && (
          <div role="status" class="w-full bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-6 border border-emerald-200 flex items-center gap-2">
            <Icon name="check" size={18}/>
            {success}
          </div>
        )}

        {error && (
          <div role="alert" class="w-full bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6 border border-red-200 flex items-center gap-2">
            <Icon name="info" size={18}/>
            {error}
          </div>
        )}

        {isSuperAdminRole(adminUser.role) ? (
          <>
            <div class="w-full bg-white border border-border-light rounded-xl p-6 shadow-sm mb-4">
              <h2 class="text-text-main text-base font-bold mb-4">Detail akun</h2>
              <form method="post" action={`/admin/users/${member.id}/update`} class="space-y-4">
                <CsrfInput />
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1" for="edit-name">Nama</label>
                  <input
                    id="edit-name" name="name"
                    value={member.name}
                    maxlength={100}
                    class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1" for="edit-email">Email</label>
                  <input
                    type="email"
                    id="edit-email" name="email"
                    value={member.email}
                    maxlength={254}
                    class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1" for="edit-role">Peran</label>
                  <select id="edit-role" name="role" class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required>
                    <option value="santri" selected={member.role === "santri"}>Santri</option>
                    <option value="alumni" selected={member.role === "alumni"}>Alumni</option>
                    <option value="asatidz" selected={member.role === "asatidz"}>Asatidz</option>
                    <option value="member" selected={member.role === "member"}>Anggota</option>
                    <option value="admin" selected={member.role === "admin"}>Admin</option>
                    <option value="super_admin" selected={member.role === "super_admin"}>Super admin</option>
                  </select>
                </div>
                <div>
                  <label class="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="email_notif_enabled"
                      value="1"
                      checked={member.email_notif_enabled !== 0}
                      class="rounded border-slate-300 text-primary focus:ring-primary/30"
                    />
                    <span class="text-sm text-text-main font-semibold">Notifikasi email aktif</span>
                  </label>
                  <p class="text-xs text-text-secondary mt-1 ml-6">
                    Nonaktifkan untuk menghentikan email pengingat, arsip, dan pencapaian anggota ini.
                  </p>
                </div>
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors shadow-sm"
                >
                  Simpan perubahan
                </button>
              </form>
            </div>

            <div class="w-full bg-white border border-border-light rounded-xl p-6 shadow-sm">
              <h2 class="text-text-main text-base font-bold mb-4">Atur ulang password</h2>
              <form method="post" action={`/admin/users/${member.id}/password`} class="admin-reset flex gap-3">
                <CsrfInput />
                <div class="admin-field"><label for="reset-password">Password baru</label><input
                  id="reset-password" type="password" autocomplete="new-password"
                  name="password"
                  placeholder={`Minimal ${passwordMinimum(member.role)} karakter`}
                  minlength={passwordMinimum(member.role)}
                  class="flex-1 rounded-lg border-slate-200 bg-slate-50 text-sm"
                  required
                /></div>
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
                >
                  Atur ulang password
                </button>
              </form>
            </div>
          </>
        ) : (
          <div class="w-full bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-700">
            Hanya super admin yang dapat mengubah detail anggota.
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
