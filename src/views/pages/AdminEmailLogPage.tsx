import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { APP_NAME } from "../../config.ts";
import type { Lang } from "../../lib/i18n.ts";

export type EmailLogRow = {
  id: number;
  user_id: number | null;
  email_type: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed";
  error: string | null;
  sent_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  welcome: "Welcome",
  approval: "Approval",
  rejection: "Rejection",
  role_change: "Role Change",
  suspend: "Suspend",
  unsuspend: "Unsuspend",
  new_member_alert_admin: "New Member Alert",
  khatam: "Khatam",
  streak_milestone: "Streak Milestone",
  daily_reminder: "Daily Reminder",
  test_daily_reminder: "Test Reminder",
  monthly_snapshot: "Monthly Snapshot",
  monthly_snapshot_preview: "Snapshot Preview",
  overtaken: "Overtaken",
};

export const AdminEmailLogPage: FC<{
  user: User;
  lang: Lang;
  rows: EmailLogRow[];
  total: number;
  page: number;
  perPage: number;
  filterStatus: string;
  filterType: string;
  allTypes: string[];
}> = ({ user, lang, rows, total, page, perPage, filterStatus, filterType, allTypes }) => {
  const totalPages = Math.ceil(total / perPage);

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterType) params.set("type", filterType);
    params.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    return `/admin/email-log${qs ? "?" + qs : ""}`;
  }

  return (
    <Layout title={`Email Log - Admin - ${APP_NAME}`}>
      <Header user={user} currentPath="/admin" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        <div class="w-full flex items-center justify-between mb-6">
          <div>
            <h1 class="text-text-main text-3xl font-black">Email Log</h1>
            <p class="text-text-secondary text-sm">{total} record{total !== 1 ? "s" : ""}{filterStatus || filterType ? " (filtered)" : ""}</p>
          </div>
          <a href="/admin" class="px-4 py-2 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-main hover:bg-slate-50">
            ← Admin Panel
          </a>
        </div>

        {/* Filters */}
        <div class="w-full flex flex-wrap gap-3 mb-5">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-text-secondary font-medium">Status:</span>
            <a href={buildUrl({ status: "", page: "1" })} class={`px-2.5 py-1 rounded font-semibold ${!filterStatus ? "bg-primary text-white" : "border border-border-light text-text-main hover:bg-slate-50"}`}>All</a>
            <a href={buildUrl({ status: "sent", page: "1" })} class={`px-2.5 py-1 rounded font-semibold ${filterStatus === "sent" ? "bg-emerald-600 text-white" : "border border-border-light text-text-main hover:bg-slate-50"}`}>Sent</a>
            <a href={buildUrl({ status: "failed", page: "1" })} class={`px-2.5 py-1 rounded font-semibold ${filterStatus === "failed" ? "bg-red-600 text-white" : "border border-border-light text-text-main hover:bg-slate-50"}`}>Failed</a>
          </div>
          {allTypes.length > 0 && (
            <form method="GET" action="/admin/email-log" class="flex items-center gap-2 text-sm">
              {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
              <input type="hidden" name="page" value="1" />
              <select
                name="type"
                onchange="this.form.submit()"
                class="border border-border-light rounded px-2.5 py-1 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All types</option>
                {allTypes.map((t) => (
                  <option value={t} selected={filterType === t}>{TYPE_LABELS[t] ?? t}</option>
                ))}
              </select>
            </form>
          )}
        </div>

        {rows.length === 0 ? (
          <div class="w-full bg-white border border-border-light rounded-xl p-12 text-center text-text-secondary text-sm">
            No email log entries{filterStatus || filterType ? " matching this filter" : ""}.
          </div>
        ) : (
          <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-slate-50 text-text-secondary">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold">Type</th>
                    <th class="px-4 py-3 text-left font-semibold">Recipient</th>
                    <th class="px-4 py-3 text-left font-semibold">Subject</th>
                    <th class="px-4 py-3 text-left font-semibold">Status</th>
                    <th class="px-4 py-3 text-left font-semibold">Sent At</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-light">
                  {rows.map((row) => (
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="px-4 py-3">
                        <span class="px-2 py-0.5 bg-slate-100 text-text-secondary text-xs font-mono rounded">
                          {TYPE_LABELS[row.email_type] ?? row.email_type}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-text-main text-xs">{row.recipient}</td>
                      <td class="px-4 py-3 text-text-secondary text-xs max-w-[200px] truncate">{row.subject}</td>
                      <td class="px-4 py-3">
                        {row.status === "sent" ? (
                          <span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded">sent</span>
                        ) : (
                          <span class="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded" title={row.error ?? ""}>failed</span>
                        )}
                        {row.status === "failed" && row.error && (
                          <p class="text-xs text-red-500 mt-0.5 max-w-[180px] truncate">{row.error}</p>
                        )}
                      </td>
                      <td class="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                        {row.sent_at.slice(0, 16).replace("T", " ")}
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
                    <a href={buildUrl({ page: String(page - 1) })} class="px-3 py-1.5 border border-border-light rounded-lg font-semibold text-text-main hover:bg-slate-50">
                      ← Prev
                    </a>
                  )}
                  {page < totalPages && (
                    <a href={buildUrl({ page: String(page + 1) })} class="px-3 py-1.5 border border-border-light rounded-lg font-semibold text-text-main hover:bg-slate-50">
                      Next →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </Layout>
  );
};
