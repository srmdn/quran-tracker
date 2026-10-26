import { CsrfInput } from "../components/CsrfInput.tsx";
import type { FC } from "hono/jsx";
import { AdminLayout } from "../AdminLayout.tsx";
import { Icon } from "../components/Icon.tsx";
import type { User } from "../../types.ts";
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
  user_name?: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  approval: "Persetujuan akun",
  daily_reminder: "Pengingat harian",
  inactivity_reminder: "Pengingat tidak aktif",
  khatam: "Khatam",
  monthly_snapshot: "Arsip bulanan",
  monthly_snapshot_preview: "Pratinjau arsip",
  new_member_alert_admin: "Anggota baru",
  no_target_nudge: "Pengingat target",
  overtaken: "Perubahan peringkat",
  rejection: "Penolakan akun",
  role_change: "Perubahan peran",
  streak_milestone: "Pencapaian streak",
  suspend: "Pembatasan akses",
  test_daily_reminder: "Uji pengingat",
  unsuspend: "Pemulihan akses",
  welcome: "Selamat datang",
};

const NOTIF_TYPES = new Set([
  "daily_reminder",
  "inactivity_reminder",
  "khatam",
  "monthly_snapshot",
  "no_target_nudge",
  "overtaken",
  "streak_milestone",
]);

const TRANSACTIONAL_TYPES = new Set([
  "approval",
  "welcome",
  "rejection",
  "role_change",
  "suspend",
  "unsuspend",
]);

function typeBadgeClass(emailType: string): string {
  if (NOTIF_TYPES.has(emailType)) return "bg-primary/10 text-primary border border-primary/20";
  if (TRANSACTIONAL_TYPES.has(emailType)) return "bg-purple-50 text-purple-600 border border-purple-200";
  return "bg-slate-100 text-text-secondary border border-slate-200";
}

const RESENDABLE_TYPES = new Set(["approval", "welcome", "rejection", "suspend", "unsuspend", "no_target_nudge"]);

export function toWib(utcStr: string): string {
  const ms = new Date(utcStr.replace(" ", "T") + "Z").getTime();
  return new Date(ms + 7 * 3600000).toISOString().slice(0, 16).replace("T", " ");
}

export const AdminEmailLogPage: FC<{
  user: User;
  lang: Lang;
  rows: EmailLogRow[];
  total: number;
  sentTotal: number;
  failedTotal: number;
  todaySent: number;
  todayFailed: number;
  smtpConfigured: boolean;
  page: number;
  perPage: number;
  filterStatus: string;
  filterType: string;
  allTypes: string[];
  flashSuccess?: string;
  flashError?: string;
}> = ({ user, lang, rows, total, sentTotal, failedTotal, todaySent, todayFailed, smtpConfigured, page, perPage, filterStatus, filterType, allTypes, flashSuccess, flashError }) => {
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

  const statusFilterBtn = (label: string, value: string, activeClass: string) => {
    const active = filterStatus === value;
    return (
      <a
        href={buildUrl({ status: value || "", page: "1" })}
        class={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
          active ? activeClass : "border border-border-light text-text-main hover:bg-slate-50"
        }`}
      >
        {label}
      </a>
    );
  };

  return (
    <AdminLayout title={"Riwayat email"} user={user} lang={lang} section="email">
      <div class="admin-content">
        <div class="w-full flex flex-col gap-2 mb-5">
          <h1 class="text-text-main text-3xl font-black leading-tight tracking-[-0.033em]">Riwayat email</h1>
          <p class="text-text-secondary text-sm">Tinjau email yang terkirim, gagal, dan perlu dikirim ulang.</p>
        </div>

        {flashSuccess && (
          <div role="status" class="w-full mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg">{flashSuccess}</div>
        )}
        {flashError && (
          <div role="alert" class="w-full mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">{flashError}</div>
        )}

        {/* SMTP status */}
        {smtpConfigured ? (
          <div class="w-full mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center gap-2">
            <Icon name="check" size={18}/>
            Pengiriman email aktif.
          </div>
        ) : (
          <div class="w-full mb-6 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg flex items-center gap-2">
            <Icon name="info" size={18}/>
            Pengiriman email belum diaktifkan. Hubungi pengelola untuk mengaktifkannya.
          </div>
        )}

        {/* Stats */}
        <div class="w-full admin-stat-grid grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div class="bg-white border border-border-light rounded-xl p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-1.5">
              <Icon name="mail" size={18}/>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Total</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{total}</p>
          </div>
          <div class="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-1.5">
              <Icon name="mail" size={18}/>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Terkirim</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{sentTotal}</p>
          </div>
          <div class="bg-white border border-red-200 rounded-xl p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-1.5">
              <Icon name="info" size={18}/>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Gagal</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{failedTotal}</p>
          </div>
          <div class="bg-white border border-sky-200 rounded-xl p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-1.5">
              <Icon name="calendar" size={18}/>
              <span class="text-xs font-bold text-text-secondary uppercase tracking-wider">Hari ini</span>
            </div>
            <p class="text-text-main text-2xl font-black leading-none">{todaySent}</p>
            {todayFailed > 0 && <p class="text-xs text-red-500 mt-1 font-semibold">{todayFailed} gagal</p>}
          </div>
        </div>

        {/* Filters */}
        <div class="w-full flex flex-wrap items-center gap-3 mb-5">
          <div class="flex items-center gap-1.5 bg-white border border-border-light rounded-lg p-1">
            {statusFilterBtn("Semua", "", "bg-primary text-white")}
            {statusFilterBtn(`Terkirim (${sentTotal})`, "sent", "bg-emerald-600 text-white")}
            {statusFilterBtn(`Gagal (${failedTotal})`, "failed", "bg-red-600 text-white")}
          </div>
          {allTypes.length > 0 && (
            <form method="get" action="/admin/email-log" class="flex items-center gap-2 text-sm">
              {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
              <input type="hidden" name="page" value="1" />
              <select
                aria-label="Jenis email" name="type"
                onchange="this.form.submit()"
                class="border border-border-light rounded-lg px-3 py-2 text-sm text-text-main bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Semua jenis</option>
                {allTypes.map((t) => (
                  <option value={t} selected={filterType === t}>{TYPE_LABELS[t] ?? t}</option>
                ))}
              </select>
            </form>
          )}
          <a
            href={`/admin/email-log/export?status=${filterStatus}&type=${filterType}`}
            class="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-border-light bg-white text-text-main rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Icon name="download" size={18}/>
            Unduh CSV
          </a>
        </div>

        {rows.length === 0 ? (
          <div class="w-full bg-white border border-border-light rounded-xl p-12 text-center text-text-secondary text-sm">
            Belum ada riwayat email{filterStatus || filterType ? " untuk filter ini" : ""}.
          </div>
        ) : (
          <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden shadow-sm">
            <div class="admin-email-table overflow-x-auto" tabindex={0} role="region" aria-label="Riwayat pengiriman email">
              <table class="min-w-full text-sm">
                <thead class="bg-slate-50 text-text-secondary">
                  <tr>
                    <th scope="col" class="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Jenis</th>
                    <th scope="col" class="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Penerima</th>
                    <th scope="col" class="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Subjek</th>
                    <th scope="col" class="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th scope="col" class="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Waktu (WIB)</th>
                    <th scope="col" class="px-4 py-3"><span class="sr-only">Tindakan</span></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-light">
                  {rows.map((row) => (
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="px-4 py-3">
                        <span class={`px-2 py-0.5 text-xs font-semibold rounded ${typeBadgeClass(row.email_type)}`}>
                          {TYPE_LABELS[row.email_type] ?? row.email_type}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <p class="text-text-main text-xs font-semibold">{row.user_name ?? "-"}</p>
                        <p class="text-text-secondary text-xs">{row.recipient}</p>
                      </td>
                      <td class="px-4 py-3 text-text-secondary text-xs max-w-[220px] truncate" title={row.subject}>
                        {row.subject}
                      </td>
                      <td class="px-4 py-3">
                        {row.status === "sent" ? (
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded">
                            <Icon name="check" size={18}/>
                            terkirim
                          </span>
                        ) : (
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded" title={row.error ?? ""}>
                            <Icon name="info" size={18}/>
                            gagal
                          </span>
                        )}
                        {row.status === "failed" && row.error && (
                          <p class="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={row.error}>{row.error}</p>
                        )}
                      </td>
                      <td class="px-4 py-3 text-text-secondary text-xs whitespace-nowrap font-mono">
                        {toWib(row.sent_at)}
                      </td>
                      <td class="px-4 py-3">
                        {row.status === "failed" && RESENDABLE_TYPES.has(row.email_type) && (
                          <form method="post" action={`/admin/email-log/${row.id}/resend`}>
                            <CsrfInput />
                            <button type="submit" class="px-2.5 py-1 text-xs font-semibold border border-primary/30 text-primary rounded hover:bg-primary-light transition-colors">
                              Kirim ulang
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div class="admin-pagination px-6 py-4 border-t border-border-light flex items-center justify-between text-sm">
                <span class="text-text-secondary">Halaman {page} dari {totalPages} · {total} catatan</span>
                <div class="flex gap-2">
                  {page > 1 && (
                    <a href={buildUrl({ page: String(page - 1) })} class="px-3 py-1.5 border border-border-light rounded-lg font-semibold text-text-main hover:bg-slate-50">
                      ← Sebelumnya
                    </a>
                  )}
                  {page < totalPages && (
                    <a href={buildUrl({ page: String(page + 1) })} class="px-3 py-1.5 border border-border-light rounded-lg font-semibold text-text-main hover:bg-slate-50">
                      Berikutnya →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test emails */}
        <div class="w-full bg-white border border-border-light rounded-xl p-6 shadow-sm mt-6">
          <h2 class="text-text-main text-lg font-bold mb-1 flex items-center gap-2">
            <Icon name="mail" size={18}/>
            Uji pengiriman email
          </h2>
          <p class="text-text-secondary text-sm mb-4">
            Kirim email uji ke akun kamu sendiri ({user.email}).
          </p>
          <div class="flex flex-wrap gap-3">
            <form method="post" action="/admin/email/test-reminder">
              <CsrfInput />
              <button
                type="submit"
                class="px-4 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
              >
                Uji pengingat harian
              </button>
            </form>
            <form method="post" action="/admin/email/test-snapshot">
              <CsrfInput />
              <button
                type="submit"
                class="px-4 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
              >
                Uji arsip bulanan
              </button>
            </form>
            <form method="post" action="/admin/email/test-approval">
              <CsrfInput />
              <button
                type="submit"
                class="px-4 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
              >
                Uji persetujuan akun
              </button>
            </form>
            <form method="post" action="/admin/email/test-khatam">
              <CsrfInput />
              <button
                type="submit"
                class="px-4 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
              >
                Uji khatam pertama
              </button>
            </form>
            <form method="post" action="/admin/email/test-streak">
              <CsrfInput />
              <button
                type="submit"
                class="px-4 py-2.5 bg-white text-primary border border-primary/30 rounded-lg font-bold text-sm hover:bg-primary-light transition-colors"
              >
                Uji streak 7 hari
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
