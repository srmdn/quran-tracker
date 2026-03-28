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
};

export const AdminEnrollmentsPage: FC<{
  user: User;
  lang: Lang;
  rows: EnrollmentRow[];
  total: number;
  page: number;
  perPage: number;
}> = ({ user, lang, rows, total, page, perPage }) => {
  const totalPages = Math.ceil(total / perPage);

  return (
    <Layout title={`Enrollments - Admin - ${APP_NAME}`}>
      <Header user={user} currentPath="/admin" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        <div class="w-full flex items-center justify-between mb-6">
          <div>
            <h1 class="text-text-main text-3xl font-black">Enrollments</h1>
            <p class="text-text-secondary text-sm">{total} submission{total !== 1 ? "s" : ""} total</p>
          </div>
          <a href="/admin" class="px-4 py-2 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-main hover:bg-slate-50">
            ← Admin Panel
          </a>
        </div>

        {rows.length === 0 ? (
          <div class="w-full bg-white border border-border-light rounded-xl p-12 text-center text-text-secondary text-sm">
            No enrollment submissions yet.
          </div>
        ) : (
          <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-slate-50 text-text-secondary">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold">#</th>
                    <th class="px-4 py-3 text-left font-semibold">Name</th>
                    <th class="px-4 py-3 text-left font-semibold">WhatsApp</th>
                    <th class="px-4 py-3 text-left font-semibold">Program</th>
                    <th class="px-4 py-3 text-left font-semibold">Gender</th>
                    <th class="px-4 py-3 text-left font-semibold">Submitted</th>
                    <th class="px-4 py-3 text-left font-semibold"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-light">
                  {rows.map((row) => (
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="px-4 py-3 text-text-secondary font-bold">#{row.id}</td>
                      <td class="px-4 py-3 text-text-main font-semibold">{row.full_name}</td>
                      <td class="px-4 py-3 text-text-main">{row.whatsapp}</td>
                      <td class="px-4 py-3 text-text-secondary text-xs max-w-[180px] truncate">{row.program_type}</td>
                      <td class="px-4 py-3">
                        <span class={`px-2 py-0.5 rounded text-xs font-bold ${row.gender === "male" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                          {row.gender === "male" ? "L" : "P"}
                        </span>
                      </td>
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
                    <a href={`/admin/enrollments?page=${page - 1}`} class="px-3 py-1.5 border border-border-light rounded-lg font-semibold text-text-main hover:bg-slate-50">
                      ← Prev
                    </a>
                  )}
                  {page < totalPages && (
                    <a href={`/admin/enrollments?page=${page + 1}`} class="px-3 py-1.5 border border-border-light rounded-lg font-semibold text-text-main hover:bg-slate-50">
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
