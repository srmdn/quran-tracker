import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { APP_NAME } from "../../config.ts";
import type { Lang } from "../../lib/i18n.ts";

export type EnrollmentRow = {
  id: number;
  full_name: string;
  gender: "male" | "female";
  whatsapp: string;
  program_type: string;
  quran_level: string;
  submitted_at: string;
  status: string;
};

export const AdminEnrollmentsPage: FC<{
  user: User;
  lang: Lang;
  rows: EnrollmentRow[];
  total: number;
  page: number;
  perPage: number;
  statusFilter: string;
  success?: string;
  error?: string;
}> = ({ user, lang, rows, total, page, perPage, statusFilter, success, error }) => {
  const totalPages = Math.ceil(total / perPage);

  const tabs = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];

  const statusBadge = (status: string) => {
    if (status === "approved") return <span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700">Approved</span>;
    if (status === "rejected") return <span class="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600">Rejected</span>;
    return <span class="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700">Pending</span>;
  };

  return (
    <Layout title={`Enrollments - Admin - ${APP_NAME}`}>
      <Header user={user} currentPath="/admin" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        <div class="w-full flex items-center justify-between mb-4">
          <div>
            <h1 class="text-text-main text-3xl font-black">Enrollments</h1>
            <p class="text-text-secondary text-sm">{total} submission{total !== 1 ? "s" : ""} shown</p>
          </div>
          <a href="/admin" class="px-4 py-2 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-main hover:bg-slate-50">
            Back to Admin
          </a>
        </div>

        {success && (
          <div class="w-full bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-4 border border-emerald-200">{success}</div>
        )}
        {error && (
          <div class="w-full bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200">{error}</div>
        )}

        {/* Status filter tabs */}
        <div class="w-full flex gap-1 mb-4">
          {tabs.map((tab) => (
            <a
              href={`/admin/enrollments?status=${tab.value}`}
              class={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${statusFilter === tab.value ? "bg-primary text-white" : "bg-white border border-border-light text-text-main hover:bg-slate-50"}`}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {rows.length === 0 ? (
          <div class="w-full bg-white border border-border-light rounded-xl p-12 text-center text-text-secondary text-sm">
            No enrollment submissions in this category.
          </div>
        ) : (
          <form method="post" action="/admin/enrollments/bulk" id="bulk-form" class="w-full">
            {/* Bulk action bar (only for pending) */}
            {statusFilter === "pending" && (
              <div class="flex items-center gap-3 mb-3">
                <span class="text-sm text-text-secondary font-semibold">Bulk action:</span>
                <button
                  type="submit"
                  name="action"
                  value="approve"
                  onclick="return bulkConfirm('approve')"
                  class="px-4 py-1.5 text-sm font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Approve Selected
                </button>
                <button
                  type="submit"
                  name="action"
                  value="reject"
                  onclick="return bulkConfirm('reject')"
                  class="px-4 py-1.5 text-sm font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Reject Selected
                </button>
              </div>
            )}

            <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden">
              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead class="bg-slate-50 text-text-secondary">
                    <tr>
                      {statusFilter === "pending" && (
                        <th class="px-4 py-3 text-left w-8">
                          <input type="checkbox" id="select-all" class="rounded border-slate-300" />
                        </th>
                      )}
                      <th class="px-4 py-3 text-left font-semibold">#</th>
                      <th class="px-4 py-3 text-left font-semibold">Name</th>
                      <th class="px-4 py-3 text-left font-semibold">WhatsApp</th>
                      <th class="px-4 py-3 text-left font-semibold">Program</th>
                      <th class="px-4 py-3 text-left font-semibold">Gender</th>
                      <th class="px-4 py-3 text-left font-semibold">Status</th>
                      <th class="px-4 py-3 text-left font-semibold">Submitted</th>
                      <th class="px-4 py-3 text-left font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border-light">
                    {rows.map((row) => (
                      <tr class="hover:bg-slate-50 transition-colors">
                        {statusFilter === "pending" && (
                          <td class="px-4 py-3">
                            <input type="checkbox" name="ids" value={String(row.id)} class="rounded border-slate-300" />
                          </td>
                        )}
                        <td class="px-4 py-3 text-text-secondary font-bold">#{row.id}</td>
                        <td class="px-4 py-3 text-text-main font-semibold">{row.full_name}</td>
                        <td class="px-4 py-3 text-text-main">{row.whatsapp}</td>
                        <td class="px-4 py-3 text-text-secondary text-xs max-w-[180px] truncate">{row.program_type}</td>
                        <td class="px-4 py-3">
                          <span class={`px-2 py-0.5 rounded text-xs font-bold ${row.gender === "male" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                            {row.gender === "male" ? "L" : "P"}
                          </span>
                        </td>
                        <td class="px-4 py-3">{statusBadge(row.status)}</td>
                        <td class="px-4 py-3 text-text-secondary text-xs">{row.submitted_at.slice(0, 16).replace("T", " ")}</td>
                        <td class="px-4 py-3">
                          <a
                            href={`/admin/enrollments/${row.id}`}
                            class="px-3 py-1 text-xs font-bold text-primary border border-primary/30 rounded hover:bg-primary-light transition-colors"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div class="px-6 py-4 border-t border-border-light flex items-center justify-between text-sm">
                  <span class="text-text-secondary">Page {page} of {totalPages}</span>
                  <div class="flex gap-2">
                    {page > 1 && (
                      <a href={`/admin/enrollments?status=${statusFilter}&page=${page - 1}`} class="px-3 py-1.5 border border-border-light rounded-lg font-semibold text-text-main hover:bg-slate-50">
                        Prev
                      </a>
                    )}
                    {page < totalPages && (
                      <a href={`/admin/enrollments?status=${statusFilter}&page=${page + 1}`} class="px-3 py-1.5 border border-border-light rounded-lg font-semibold text-text-main hover:bg-slate-50">
                        Next
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </main>

      <script dangerouslySetInnerHTML={{ __html: `
        var selectAll = document.getElementById('select-all');
        if (selectAll) {
          selectAll.addEventListener('change', function() {
            document.querySelectorAll('input[name="ids"]').forEach(function(cb) { cb.checked = selectAll.checked; });
          });
        }
        function bulkConfirm(action) {
          var checked = document.querySelectorAll('input[name="ids"]:checked').length;
          if (checked === 0) { alert('Select at least one enrollment first.'); return false; }
          var label = action === 'approve' ? 'Approve' : 'Reject';
          return confirm(label + ' ' + checked + ' selected enrollment' + (checked !== 1 ? 's' : '') + '?');
        }
      `}} />
    </Layout>
  );
};
