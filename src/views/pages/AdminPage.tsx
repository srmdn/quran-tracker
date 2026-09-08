import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { APP_NAME } from "../../config.ts";
import { isAdminRole, isSuperAdminRole } from "../../lib/roles.ts";
import type { Lang } from "../../lib/i18n.ts";

const roleBadgeClass = (role: string) =>
  isAdminRole(role)
    ? "bg-purple-50 text-purple-600 border border-purple-200"
    : ["member", "santri", "alumni", "asatidz"].includes(role)
      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
      : "bg-amber-50 text-amber-600 border border-amber-200";

const TABS = [
  { label: "Members", href: "/admin", current: true },
  { label: "Email Log", href: "/admin/email-log", current: false },
  { label: "Enrollments", href: "/admin/enrollments", current: false },
];

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
    <Layout title={`Admin Panel - ${APP_NAME}`}>
      <Header user={user} currentPath="/admin" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        <div class="w-full flex flex-col gap-2 mb-5">
          <h1 class="text-text-main text-3xl font-black leading-tight tracking-[-0.033em]">Admin Panel</h1>
          <p class="text-text-secondary text-base font-normal leading-normal">
            Manage community members. Approve or reject new registrations.
          </p>
        </div>

        {/* Tab nav */}
        <nav class="w-full flex items-center gap-1 mb-6 border-b border-border-light">
          {TABS.map((tab) => (
            <a
              href={tab.href}
              class={`px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 -mb-px transition-colors ${
                tab.current
                  ? "border-primary text-primary bg-primary-light/60"
                  : "border-transparent text-text-secondary hover:text-primary hover:border-border-light"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </nav>

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

        {/* Stats */}
        <div class="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <a href="#members" class="bg-white border border-border-light rounded-xl p-4 shadow-sm hover:border-primary/40 hover:shadow transition-shadow">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="material-symbols-outlined text-primary text-lg">group</span>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Members</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{allUsers.length}</p>
          </a>
          <a href="#pending" class="bg-white border border-amber-200 rounded-xl p-4 shadow-sm hover:border-amber-400/60 hover:shadow transition-shadow">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="material-symbols-outlined text-amber-500 text-lg">hourglass_top</span>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Pending</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{pendingUsers.length}</p>
          </a>
          <a href="#members" class="bg-white border border-red-200 rounded-xl p-4 shadow-sm hover:border-red-400/60 hover:shadow transition-shadow">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="material-symbols-outlined text-red-500 text-lg">block</span>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Suspended</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{suspendedCount}</p>
          </a>
          <a href="/admin/email-log" class="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm hover:border-emerald-400/60 hover:shadow transition-shadow">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="material-symbols-outlined text-emerald-500 text-lg">mail</span>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Emails Today</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{emailsSentToday}</p>
            {emailsFailedToday > 0 && <p class="text-xs text-red-500 mt-1 font-semibold">{emailsFailedToday} failed</p>}
          </a>
        </div>

        {/* Pending approvals */}
        <div id="pending" class="w-full bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm mb-6">
          <div class="px-6 py-4 border-b border-amber-200 bg-amber-50/50">
            <h2 class="text-text-main text-lg font-bold flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-500">hourglass_top</span>
              Pending Approvals ({pendingUsers.length})
            </h2>
          </div>
          {pendingUsers.length === 0 ? (
            <p class="px-6 py-5 text-sm text-text-secondary">No pending registrations. All clear.</p>
          ) : (
            <div class="divide-y divide-border-light">
              {pendingUsers.map((u) => (
                <div class="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
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
                    <form method="POST" action={`/admin/users/${u.id}/approve`}>
                      <button
                        type="submit"
                        class="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors shadow-sm"
                      >
                        Approve
                      </button>
                    </form>
                    <form method="POST" action={`/admin/users/${u.id}/reject`}>
                      <button
                        type="submit"
                        class="px-4 py-2 bg-white text-red-500 border border-red-200 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
                      >
                        Reject
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
              <span class="material-symbols-outlined text-primary">group</span>
              All Members ({allUsers.length})
            </h2>
            <div class="flex items-center gap-2 sm:ml-auto">
              <input
                id="member-search"
                type="search"
                placeholder="Search name or email..."
                oninput="filterMembers()"
                class="rounded-lg border-slate-200 bg-slate-50 text-xs h-8 px-3 w-44"
              />
              <select
                id="role-filter"
                onchange="filterMembers()"
                class="rounded-lg border-slate-200 bg-slate-50 text-xs h-8 px-2"
              >
                <option value="">All roles</option>
                <option value="santri">santri</option>
                <option value="alumni">alumni</option>
                <option value="asatidz">asatidz</option>
                <option value="member">member</option>
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
                <option value="__suspended">suspended</option>
              </select>
            </div>
          </div>
          <div id="member-list" class="divide-y divide-border-light">
            {allUsers.map((u) => (
              <div
                class="flex items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50 transition-colors"
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
                          You
                        </span>
                      )}
                    </p>
                    <p class="text-text-secondary text-xs truncate">{u.email}</p>
                    <p class="text-text-secondary/60 text-xs">Joined {u.created_at.slice(0, 10)}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class={`hidden sm:inline text-xs font-bold px-2 py-1 rounded ${roleBadgeClass(u.role)}`}>
                    {u.role}
                  </span>
                  {u.suspended_at && (
                    <span class="text-xs font-bold px-2 py-1 rounded bg-red-50 text-red-600 border border-red-200">
                      suspended
                    </span>
                  )}
                  {u.email_notif_enabled === 0 && (
                    <span
                      class="hidden sm:inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-slate-100 text-text-secondary border border-slate-200"
                      title="Email notifications disabled"
                    >
                      <span class="material-symbols-outlined text-xs">notifications_off</span>
                      email off
                    </span>
                  )}
                  <details class="relative">
                    <summary class="list-none cursor-pointer flex items-center justify-center size-8 rounded-lg text-text-secondary hover:bg-slate-100 hover:text-primary transition-colors">
                      <span class="material-symbols-outlined text-lg">more_vert</span>
                    </summary>
                    <div class="absolute right-0 top-9 z-20 w-44 bg-white border border-border-light rounded-lg shadow-lg py-1.5">
                      <a
                        href={`/admin/members/${u.id}`}
                        class="block px-3 py-1.5 text-sm text-text-main hover:bg-slate-50 hover:text-primary transition-colors"
                      >
                        View
                      </a>
                      {isSuperAdminRole(user.role) && u.id !== user.id && (
                        <a
                          href={`/admin/members/${u.id}/edit`}
                          class="block px-3 py-1.5 text-sm text-text-main hover:bg-slate-50 hover:text-primary transition-colors"
                        >
                          Edit
                        </a>
                      )}
                      {!isAdminRole(u.role) && u.id !== user.id && (
                        <form method="POST" action={`/admin/users/${u.id}/role`} onsubmit={`return confirm('Make ${u.name} an admin? This grants full admin access.')`}>
                          <button type="submit" class="w-full text-left px-3 py-1.5 text-sm text-text-main hover:bg-slate-50 hover:text-primary transition-colors">
                            Make Admin
                          </button>
                        </form>
                      )}
                      {isSuperAdminRole(user.role) && !isAdminRole(u.role) && u.id !== user.id && (
                        u.suspended_at ? (
                          <form method="POST" action={`/admin/users/${u.id}/unsuspend`}>
                            <button type="submit" class="w-full text-left px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
                              Unsuspend
                            </button>
                          </form>
                        ) : (
                          <form method="POST" action={`/admin/users/${u.id}/suspend`} onsubmit={`return confirm('Suspend ${u.name}? They will not be able to access the app.')`}>
                            <button type="submit" class="w-full text-left px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors">
                              Suspend
                            </button>
                          </form>
                        )
                      )}
                      {!isAdminRole(u.role) && u.id !== user.id && (
                        <form method="POST" action={`/admin/users/${u.id}/delete`} onsubmit={`return confirm('Permanently delete ${u.name}? All their logs and data will be removed.')`}>
                          <button type="submit" class="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            Remove
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
              ← Prev
            </button>
            <span id="page-info" class="text-xs text-text-secondary" />
            <button
              id="page-next"
              type="button"
              onclick="changePage(1)"
              class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-light bg-white text-text-secondary hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>

        {isSuperAdminRole(user.role) && (
          <div class="w-full bg-white border border-border-light rounded-xl p-6 shadow-sm mt-6">
            <h2 class="text-text-main text-lg font-bold mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">build</span>
              Tools
            </h2>

            {/* Create user */}
            <div class="mb-6">
              <h3 class="text-text-main text-sm font-bold mb-2">Create User</h3>
              <form method="POST" action="/admin/users/create" class="grid md:grid-cols-4 gap-3">
                <input
                  name="name"
                  placeholder="Full name"
                  maxlength={100}
                  class="rounded-lg border-slate-200 bg-slate-50 text-sm"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  maxlength={254}
                  class="rounded-lg border-slate-200 bg-slate-50 text-sm"
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password (optional)"
                  class="rounded-lg border-slate-200 bg-slate-50 text-sm"
                />
                <select name="role" class="rounded-lg border-slate-200 bg-slate-50 text-sm" required>
                  <option value="santri">santri</option>
                  <option value="alumni">alumni</option>
                  <option value="asatidz">asatidz</option>
                  <option value="admin">admin</option>
                  <option value="super_admin">super_admin</option>
                </select>
                <button
                  type="submit"
                  class="px-4 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors shadow-sm md:col-span-4"
                >
                  Create User
                </button>
              </form>
            </div>

            {/* Snapshot */}
            <div class="border-t border-border-light pt-6">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 class="text-text-main text-sm font-bold">Monthly Snapshot Job</h3>
                  <p class="text-text-secondary text-xs">
                    Runs previous month activity snapshot (idempotent, safe to re-run).
                  </p>
                </div>
                <form method="POST" action="/admin/snapshots/run">
                  <button
                    type="submit"
                    class="px-4 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors shadow-sm"
                  >
                    Run Previous Month Snapshot
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
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
      .filter(function(r) { return r.style.display !== 'none'; });
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
    ctrl.style.display = totalPages > 1 ? '' : 'none';
    document.getElementById('page-info').textContent = 'Page ' + currentPage + ' of ' + totalPages;
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
    </Layout>
  );
};
