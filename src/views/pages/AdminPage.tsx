import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { APP_NAME } from "../../config.ts";
import { isAdminRole, isSuperAdminRole } from "../../lib/roles.ts";
import type { Lang } from "../../lib/i18n.ts";

export const AdminPage: FC<{
  user: User;
  lang: Lang;
  pendingUsers: User[];
  allUsers: User[];
  success?: string;
  error?: string;
}> = ({ user, lang, pendingUsers, allUsers, success, error }) => {
  return (
    <Layout title={`Admin Panel - ${APP_NAME}`}>
      <Header user={user} currentPath="/admin" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        <div class="w-full flex flex-col gap-2 mb-8">
          <h1 class="text-text-main text-3xl font-black leading-tight tracking-[-0.033em]">
            Admin Panel
          </h1>
          <p class="text-text-secondary text-base font-normal leading-normal">
            Manage community members. Approve or reject new registrations.
          </p>
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

        {/* Enrollment submissions link */}
        <div class="w-full bg-white border border-border-light rounded-xl p-6 shadow-sm mb-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 class="text-text-main text-lg font-bold">Enrollment Submissions</h2>
              <p class="text-text-secondary text-sm">View and review public enrollment form submissions.</p>
            </div>
            <a
              href="/admin/enrollments"
              class="px-4 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors shadow-sm inline-block text-center"
            >
              View Enrollments
            </a>
          </div>
        </div>

        <div class="w-full bg-white border border-border-light rounded-xl p-6 shadow-sm mb-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 class="text-text-main text-lg font-bold">Monthly Snapshot Job</h2>
              <p class="text-text-secondary text-sm">
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

        <div class="w-full bg-white border border-border-light rounded-xl p-6 shadow-sm mb-8">
          <h2 class="text-text-main text-lg font-bold mb-1">Test Emails</h2>
          <p class="text-text-secondary text-sm mb-4">
            Send a test email to your own account ({user.email}).
          </p>
          <div class="flex flex-wrap gap-3">
            <form method="POST" action="/admin/email/test-reminder">
              <button
                type="submit"
                class="px-4 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
              >
                Send Test Daily Reminder
              </button>
            </form>
            <form method="POST" action="/admin/email/test-snapshot">
              <button
                type="submit"
                class="px-4 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
              >
                Send Test Monthly Snapshot
              </button>
            </form>
            <form method="POST" action="/admin/email/test-approval">
              <button
                type="submit"
                class="px-4 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
              >
                Send Test Approval
              </button>
            </form>
            <form method="POST" action="/admin/email/test-khatam">
              <button
                type="submit"
                class="px-4 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
              >
                Send Test Khatam (#1)
              </button>
            </form>
            <form method="POST" action="/admin/email/test-streak">
              <button
                type="submit"
                class="px-4 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
              >
                Send Test Streak (7 days)
              </button>
            </form>
          </div>
        </div>

        {isSuperAdminRole(user.role) && (
          <div class="w-full bg-white border border-border-light rounded-xl p-6 shadow-sm mb-8">
            <h2 class="text-text-main text-lg font-bold mb-4">Create User</h2>
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
                class="px-4 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors shadow-sm"
              >
                Create User
              </button>
            </form>
          </div>
        )}

        {/* Pending approvals */}
        {pendingUsers.length > 0 && (
          <div class="w-full bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm mb-8">
            <div class="px-6 py-4 border-b border-amber-200 bg-amber-50/50">
              <h2 class="text-text-main text-lg font-bold flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-500">hourglass_top</span>
                Pending Approvals ({pendingUsers.length})
              </h2>
            </div>
            <div class="divide-y divide-border-light">
              {pendingUsers.map((u) => (
                <div class="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div class="flex items-center gap-3">
                    {u.avatar_url ? (
                      <div
                        class="bg-center bg-no-repeat bg-cover rounded-full size-10 flex-shrink-0"
                        style={`background-image: url("${u.avatar_url}");`}
                      />
                    ) : (
                      <div class="size-10 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary text-xs font-bold border border-slate-200">
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p class="text-text-main text-sm font-bold">{u.name}</p>
                      <p class="text-text-secondary text-xs">{u.email}</p>
                      <p class="text-text-secondary/60 text-xs">
                        {u.created_at.slice(0, 10)} · {u.google_id.startsWith("manual:") ? "Email/Password" : "Google"}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
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
          </div>
        )}

        {/* All members */}
        <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden shadow-sm">
          <div class="px-6 py-4 border-b border-border-light bg-slate-50/50 flex flex-col sm:flex-row sm:items-center gap-3">
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
                class="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                data-name={u.name.toLowerCase()}
                data-email={u.email.toLowerCase()}
                data-role={u.role}
                data-suspended={u.suspended_at ? "1" : "0"}
              >
                <div class="flex items-center gap-3">
                  {u.avatar_url ? (
                    <div
                      class="bg-center bg-no-repeat bg-cover rounded-full size-10 flex-shrink-0"
                      style={`background-image: url("${u.avatar_url}");`}
                    />
                  ) : (
                    <div class="size-10 rounded-full bg-slate-100 flex items-center justify-center text-text-secondary text-xs font-bold border border-slate-200">
                      {u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <p class="text-text-main text-sm font-bold flex items-center gap-2">
                      {u.name}
                      {u.id === user.id && (
                        <span class="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-black">
                          You
                        </span>
                      )}
                    </p>
                    <p class="text-text-secondary text-xs">{u.email}</p>
                    <p class="text-text-secondary/60 text-xs">Joined {u.created_at.slice(0, 10)}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span
                    class={`text-xs font-bold px-2 py-1 rounded ${isAdminRole(u.role)
                      ? "bg-purple-50 text-purple-600 border border-purple-200"
                      : ["member", "santri", "alumni", "asatidz"].includes(u.role)
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                      }`}
                  >
                    {u.role}
                  </span>
                  {u.suspended_at && (
                    <span class="text-xs font-bold px-2 py-1 rounded bg-red-50 text-red-600 border border-red-200">
                      suspended
                    </span>
                  )}
                  {!isAdminRole(u.role) && u.id !== user.id && (
                    <form
                      method="POST"
                      action={`/admin/users/${u.id}/role`}
                      onsubmit={`return confirm('Make ${u.name} an admin? This grants full admin access.')`}
                    >
                      <input type="hidden" name="role" value="admin" />
                      <button
                        type="submit"
                        class="text-text-secondary hover:text-primary text-xs font-medium transition-colors"
                      >
                        Make Admin
                      </button>
                    </form>
                  )}
                  <a
                    href={`/admin/members/${u.id}`}
                    class="text-text-secondary hover:text-primary text-xs font-medium transition-colors"
                  >
                    View
                  </a>
                  {isSuperAdminRole(user.role) && u.id !== user.id && (
                    <a
                      href={`/admin/members/${u.id}/edit`}
                      class="text-text-secondary hover:text-primary text-xs font-medium transition-colors"
                    >
                      Edit
                    </a>
                  )}
                  {isSuperAdminRole(user.role) && !isAdminRole(u.role) && u.id !== user.id && (
                    u.suspended_at ? (
                      <form method="POST" action={`/admin/users/${u.id}/unsuspend`} class="inline">
                        <button
                          type="submit"
                          class="text-text-secondary hover:text-emerald-600 text-xs font-medium transition-colors"
                        >
                          Unsuspend
                        </button>
                      </form>
                    ) : (
                      <span class="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          id={`sus-btn-${u.id}`}
                          onclick={`showSus(${u.id})`}
                          class="text-text-secondary hover:text-amber-600 text-xs font-medium transition-colors"
                        >
                          Suspend
                        </button>
                        <span id={`sus-confirm-${u.id}`} class="hidden inline-flex items-center gap-1.5">
                          <span class="text-xs text-text-secondary">Sure?</span>
                          <form method="POST" action={`/admin/users/${u.id}/suspend`} class="inline">
                            <button type="submit" class="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                              Suspend
                            </button>
                          </form>
                          <button
                            type="button"
                            onclick={`hideSus(${u.id})`}
                            class="text-xs text-text-secondary hover:text-primary transition-colors"
                          >
                            Cancel
                          </button>
                        </span>
                      </span>
                    )
                  )}
                  {!isAdminRole(u.role) && u.id !== user.id && (
                    <span class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        id={`del-btn-${u.id}`}
                        onclick={`showDel(${u.id})`}
                        class="text-text-secondary hover:text-red-500 text-xs font-medium transition-colors"
                      >
                        Remove
                      </button>
                      <span id={`del-confirm-${u.id}`} class="hidden inline-flex items-center gap-1.5">
                        <span class="text-xs text-text-secondary">Sure?</span>
                        <form method="POST" action={`/admin/users/${u.id}/delete`} class="inline">
                          <button type="submit" class="text-xs font-bold text-red-600 hover:text-red-700 transition-colors">
                            Delete
                          </button>
                        </form>
                        <button
                          type="button"
                          onclick={`hideDel(${u.id})`}
                          class="text-xs text-text-secondary hover:text-primary transition-colors"
                        >
                          Cancel
                        </button>
                      </span>
                    </span>
                  )}
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

function showDel(id) {
  document.getElementById('del-btn-' + id).classList.add('hidden');
  document.getElementById('del-confirm-' + id).classList.remove('hidden');
}
function hideDel(id) {
  document.getElementById('del-confirm-' + id).classList.add('hidden');
  document.getElementById('del-btn-' + id).classList.remove('hidden');
}
function showSus(id) {
  document.getElementById('sus-btn-' + id).classList.add('hidden');
  document.getElementById('sus-confirm-' + id).classList.remove('hidden');
}
function hideSus(id) {
  document.getElementById('sus-confirm-' + id).classList.add('hidden');
  document.getElementById('sus-btn-' + id).classList.remove('hidden');
}

applyPagination();
      `}} />
    </Layout>
  );
};
