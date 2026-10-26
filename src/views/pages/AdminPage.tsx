import { CsrfInput } from "../components/CsrfInput.tsx";
import type { FC } from "hono/jsx";
import { AdminLayout, adminRoleLabel } from "../AdminLayout.tsx";
import { Icon } from "../components/Icon.tsx";
import type { User } from "../../types.ts";
import { isAdminRole, isSuperAdminRole } from "../../lib/roles.ts";
import type { Lang } from "../../lib/i18n.ts";

const roleBadgeClass = (role: string) =>
  isAdminRole(role)
    ? "bg-purple-50 text-purple-600 border border-purple-200"
    : ["member", "santri", "alumni", "asatidz"].includes(role)
      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
      : "bg-amber-50 text-amber-600 border border-amber-200";

export const AdminPage: FC<{
  user: User;
  lang: Lang;
  pendingUsers: User[];
  allUsers: User[];
  suspendedCount: number;
  emailsSentToday: number;
  emailsFailedToday: number;
  success?: string;
  error?: string;
}> = ({ user, lang, pendingUsers, allUsers, suspendedCount, emailsSentToday, emailsFailedToday, success, error }) => {
  return (
    <AdminLayout title={"Anggota"} user={user} lang={lang}>
      <div class="admin-content">
        <div class="w-full flex flex-col gap-2 mb-5">
          <h1 class="text-text-main text-3xl font-black leading-tight tracking-[-0.033em]">Anggota komunitas</h1>
          <p class="text-text-secondary text-base font-normal leading-normal">
            Kelola akun, akses, dan aktivitas anggota komunitas.
          </p>
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

        {/* Stats */}
        <div class="w-full admin-stat-grid grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <a href="#members" class="bg-white border border-border-light rounded-xl p-4 shadow-sm hover:border-primary/40 hover:shadow transition-shadow">
            <div class="flex items-center gap-2 mb-1.5">
              <Icon name="users" size={18}/>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Anggota</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{allUsers.length}</p>
          </a>
          <a href="#pending" class="bg-white border border-amber-200 rounded-xl p-4 shadow-sm hover:border-amber-400/60 hover:shadow transition-shadow">
            <div class="flex items-center gap-2 mb-1.5">
              <Icon name="clock" size={18}/>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Menunggu</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{pendingUsers.length}</p>
          </a>
          <a href="#members" class="bg-white border border-red-200 rounded-xl p-4 shadow-sm hover:border-red-400/60 hover:shadow transition-shadow">
            <div class="flex items-center gap-2 mb-1.5">
              <Icon name="shield" size={18}/>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Dibatasi</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{suspendedCount}</p>
          </a>
          <a href="/admin/email-log" class="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm hover:border-emerald-400/60 hover:shadow transition-shadow">
            <div class="flex items-center gap-2 mb-1.5">
              <Icon name="mail" size={18}/>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Email hari ini</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{emailsSentToday}</p>
            {emailsFailedToday > 0 && <p class="text-xs text-red-500 mt-1 font-semibold">{emailsFailedToday} gagal</p>}
          </a>
        </div>

        {/* Pending approvals */}
        <div id="pending" class="w-full bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm mb-6">
          <div class="px-6 py-4 border-b border-amber-200 bg-amber-50/50">
            <h2 class="text-text-main text-lg font-bold flex items-center gap-2">
              <Icon name="clock" size={18}/>
              Menunggu persetujuan ({pendingUsers.length})
            </h2>
          </div>
          {pendingUsers.length === 0 ? (
            <p class="px-6 py-5 text-sm text-text-secondary">Tidak ada akun yang menunggu persetujuan.</p>
          ) : (
            <div class="divide-y divide-border-light">
              {pendingUsers.map((u) => (
                <div class="admin-member-row flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div class="flex items-center gap-3 min-w-0">
                    {u.avatar_url ? (
                      <div
                        class="bg-center bg-no-repeat bg-cover rounded-full size-10 flex-shrink-0"
                        style={`background-image: url("${u.avatar_url}");`}
                      />
                    ) : (
                      <div class="size-10 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary text-xs font-bold border border-slate-200 flex-shrink-0">
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                    <div class="min-w-0">
                      <p class="text-text-main text-sm font-bold truncate">{u.name}</p>
                      <p class="text-text-secondary text-xs truncate">{u.email}</p>
                      <p class="text-text-secondary/60 text-xs">
                        {u.created_at.slice(0, 10)} · {u.google_id.startsWith("manual:") ? "Email/Password" : "Google"}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <form method="post" action={`/admin/users/${u.id}/approve`}>
                      <CsrfInput />
                      <button
                        type="submit"
                        class="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors shadow-sm"
                      >
                        Setujui
                      </button>
                    </form>
                    <form method="post" action={`/admin/users/${u.id}/reject`}>
                      <CsrfInput />
                      <button
                        type="submit"
                        class="px-4 py-2 bg-white text-red-500 border border-red-200 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
                      >
                        Tolak
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All members */}
        <div id="members" class="w-full bg-white border border-border-light rounded-xl shadow-sm">
          <div class="px-6 py-4 border-b border-border-light bg-slate-50/50 rounded-t-xl flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 class="text-text-main text-lg font-bold flex items-center gap-2 shrink-0">
              <Icon name="users" size={18}/>
              Semua anggota ({allUsers.length})
            </h2>
            <div class="admin-filters flex items-center gap-2 sm:ml-auto">
              <input
                id="member-search" aria-label="Cari nama atau email"
                type="search"
                placeholder="Cari nama atau email..."
                oninput="filterMembers()"
                class="rounded-lg border-slate-200 bg-slate-50 text-xs h-8 px-3 w-44"
              />
              <select
                id="role-filter" aria-label="Filter peran"
                onchange="filterMembers()"
                class="rounded-lg border-slate-200 bg-slate-50 text-xs h-8 px-2"
              >
                <option value="">Semua peran</option>
                <option value="santri">Santri</option>
                <option value="alumni">Alumni</option>
                <option value="asatidz">Asatidz</option>
                <option value="member">Anggota</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
                <option value="__suspended">akses dibatasi</option>
              </select>
            </div>
          </div>
          <div id="member-list" class="divide-y divide-border-light">
            {allUsers.map((u) => (
              <div
                class="admin-member-row flex items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50 transition-colors"
                data-name={u.name.toLowerCase()}
                data-email={u.email.toLowerCase()}
                data-role={u.role}
                data-suspended={u.suspended_at ? "1" : "0"}
              >
                <div class="flex items-center gap-3 min-w-0">
                  {u.avatar_url ? (
                    <div
                      class="bg-center bg-no-repeat bg-cover rounded-full size-10 flex-shrink-0"
                      style={`background-image: url("${u.avatar_url}");`}
                    />
                  ) : (
                    <div class="size-10 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary text-xs font-bold border border-slate-200 flex-shrink-0">
                      {u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  )}
                  <div class="min-w-0">
                    <p class="text-text-main text-sm font-bold flex items-center gap-2 truncate">
                      {u.name}
                      {u.id === user.id && (
                        <span class="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-black flex-shrink-0">
                          Kamu
                        </span>
                      )}
                    </p>
                    <p class="text-text-secondary text-xs truncate">{u.email}</p>
                    <p class="text-text-secondary/60 text-xs">Bergabung {u.created_at.slice(0, 10)}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class={`hidden sm:inline text-xs font-bold px-2 py-1 rounded ${roleBadgeClass(u.role)}`}>
                    {adminRoleLabel(u.role)}
                  </span>
                  {u.suspended_at && (
                    <span class="text-xs font-bold px-2 py-1 rounded bg-red-50 text-red-600 border border-red-200">
                      akses dibatasi
                    </span>
                  )}
                  {u.email_notif_enabled === 0 && (
                    <span
                      class="hidden sm:inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-slate-100 text-text-secondary border border-slate-200"
                      title="Notifikasi email nonaktif"
                    >
                      <Icon name="mail" size={18}/>
                      email nonaktif
                    </span>
                  )}
                  <details class="relative">
                    <summary aria-label={`Tindakan untuk ${u.name}`} class="list-none cursor-pointer flex items-center justify-center size-8 rounded-lg text-text-secondary hover:bg-slate-100 hover:text-primary transition-colors">
                      <Icon name="more" size={18}/>
                    </summary>
                    <div class="absolute right-0 top-9 z-20 w-44 bg-white border border-border-light rounded-lg shadow-lg py-1.5">
                      <a
                        href={`/admin/members/${u.id}`}
                        class="block px-3 py-1.5 text-sm text-text-main hover:bg-slate-50 hover:text-primary transition-colors"
                      >
                        Lihat detail
                      </a>
                      {isSuperAdminRole(user.role) && u.id !== user.id && (
                        <a
                          href={`/admin/members/${u.id}/edit`}
                          class="block px-3 py-1.5 text-sm text-text-main hover:bg-slate-50 hover:text-primary transition-colors"
                        >
                          Edit
                        </a>
                      )}
                      {isSuperAdminRole(user.role) && !isAdminRole(u.role) && u.id !== user.id && (
                        <form method="post" action={`/admin/users/${u.id}/role`} data-confirm={`Make ${u.name} an admin? This grants full admin access.`}>
                          <CsrfInput />
                          <button type="submit" class="w-full text-left px-3 py-1.5 text-sm text-text-main hover:bg-slate-50 hover:text-primary transition-colors">
                            Jadikan admin
                          </button>
                        </form>
                      )}
                      {isSuperAdminRole(user.role) && !isAdminRole(u.role) && u.id !== user.id && (
                        u.suspended_at ? (
                          <form method="post" action={`/admin/users/${u.id}/unsuspend`}>
                            <CsrfInput />
                            <button type="submit" class="w-full text-left px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
                              Pulihkan akses
                            </button>
                          </form>
                        ) : (
                          <form method="post" action={`/admin/users/${u.id}/suspend`} data-confirm={`Suspend ${u.name}? They will not be able to access the app.`}>
                            <CsrfInput />
                            <button type="submit" class="w-full text-left px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors">
                              Batasi akses
                            </button>
                          </form>
                        )
                      )}
                      {isSuperAdminRole(user.role) && !isAdminRole(u.role) && u.id !== user.id && (
                        <form method="post" action={`/admin/users/${u.id}/delete`} data-confirm={`Permanently delete ${u.name}? All their logs and data will be removed.`}>
                          <CsrfInput />
                          <button type="submit" class="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            Hapus anggota
                          </button>
                        </form>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
          <div id="page-ctrl" class="px-6 py-3 border-t border-border-light flex items-center justify-between gap-3 hidden">
            <button
              id="page-prev"
              type="button"
              onclick="changePage(-1)"
              class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-light bg-white text-text-secondary hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Sebelumnya
            </button>
            <span id="page-info" class="text-xs text-text-secondary" />
            <button
              id="page-next"
              type="button"
              onclick="changePage(1)"
              class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-light bg-white text-text-secondary hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Berikutnya →
            </button>
          </div>
        </div>

        {isSuperAdminRole(user.role) && (
          <div class="w-full bg-white border border-border-light rounded-xl p-6 shadow-sm mt-6">
            <h2 class="text-text-main text-lg font-bold mb-4 flex items-center gap-2">
              <Icon name="edit" size={18}/>
              Pengaturan admin
            </h2>

            {/* Create user */}
            <div class="mb-6">
              <h3 class="text-text-main text-sm font-bold mb-2">Tambah anggota</h3>
              <form method="post" action="/admin/users/create" class="admin-create grid md:grid-cols-4 gap-3">
                <CsrfInput />
                <div class="admin-field"><label for="create-name">Nama lengkap</label><input id="create-name"
                  name="name"
                  placeholder="Nama lengkap"
                  maxlength={100}
                  class="rounded-lg border-slate-200 bg-slate-50 text-sm"
                  required
                /></div>
                <div class="admin-field"><label for="create-email">Email</label><input id="create-email"
                  type="email"
                  name="email"
                  placeholder="Email"
                  maxlength={254}
                  class="rounded-lg border-slate-200 bg-slate-50 text-sm"
                  required
                /></div>
                <div class="admin-field"><label for="create-password">Password awal</label><input id="create-password"
                  type="password"
                  name="password"
                  placeholder="Password"
                  minlength={8}
                  autocomplete="new-password"
                  class="rounded-lg border-slate-200 bg-slate-50 text-sm"
                  required
                /></div>
                <div class="admin-field"><label for="create-role">Peran</label><select id="create-role" name="role" class="rounded-lg border-slate-200 bg-slate-50 text-sm" required>
                  <option value="santri">Santri</option>
                  <option value="alumni">Alumni</option>
                  <option value="asatidz">Asatidz</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super admin</option>
                </select></div>
                <button
                  type="submit"
                  class="px-4 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors shadow-sm md:col-span-4"
                >
                  Tambah anggota
                </button>
              </form>
            </div>

            {/* Snapshot */}
            <div class="border-t border-border-light pt-6">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 class="text-text-main text-sm font-bold">Arsip peringkat bulanan</h3>
                  <p class="text-text-secondary text-xs">
                    Simpan peringkat bulan sebelumnya. Arsip yang sudah tersimpan tidak ditimpa.
                  </p>
                </div>
                <form method="post" action="/admin/snapshots/run">
                  <CsrfInput />
                  <button
                    type="submit"
                    class="px-4 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors shadow-sm"
                  >
                    Simpan arsip bulan sebelumnya
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
var PAGE_SIZE = 20;
var currentPage = 1;

function filterMembers() {
  var q = (document.getElementById('member-search').value || '').toLowerCase();
  var role = document.getElementById('role-filter').value;
  var rows = document.querySelectorAll('#member-list > div[data-name]');
  var visible = [];
  rows.forEach(function(row) {
    var roleMatch = !role || (role === '__suspended' ? row.dataset.suspended === '1' : row.dataset.role === role);
    var match = (!q || row.dataset.name.includes(q) || row.dataset.email.includes(q)) && roleMatch;
    row.style.display = match ? '' : 'none';
    if (match) visible.push(row);
  });
  currentPage = 1;
  applyPagination(visible);
}

function applyPagination(visibleRows) {
  if (!visibleRows) {
    visibleRows = Array.from(document.querySelectorAll('#member-list > div[data-name]'))
      .filter(function(r) {
        var q = (document.getElementById('member-search').value || '').toLowerCase();
        var role = document.getElementById('role-filter').value;
        var roleMatch = !role || (role === '__suspended' ? r.dataset.suspended === '1' : r.dataset.role === role);
        return (!q || r.dataset.name.includes(q) || r.dataset.email.includes(q)) && roleMatch;
      });
  }
  var total = visibleRows.length;
  var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  visibleRows.forEach(function(row, i) {
    var inPage = i >= (currentPage - 1) * PAGE_SIZE && i < currentPage * PAGE_SIZE;
    row.style.display = inPage ? '' : 'none';
  });
  var ctrl = document.getElementById('page-ctrl');
  if (ctrl) {
    ctrl.style.display = totalPages > 1 ? 'flex' : 'none';
    document.getElementById('page-info').textContent = 'Halaman ' + currentPage + ' dari ' + totalPages;
    document.getElementById('page-prev').disabled = currentPage <= 1;
    document.getElementById('page-next').disabled = currentPage >= totalPages;
  }
}

function changePage(delta) {
  currentPage += delta;
  applyPagination();
}

document.addEventListener('click', function(e) {
  document.querySelectorAll('#member-list details[open]').forEach(function(d) {
    if (!d.contains(e.target)) d.removeAttribute('open');
  });
});


applyPagination();
      `}} />
    </AdminLayout>
  );
};
