import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { APP_NAME } from "../../config.ts";
import type { Lang } from "../../lib/i18n.ts";

export type Enrollment = {
  id: number;
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female";
  whatsapp: string;
  address: string;
  program_type: string;
  quran_level: string;
  wali_name: string;
  wali_contact: string;
  notes: string | null;
  submitted_at: string;
  ip_address: string | null;
};

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-0.5">{label}</p>
      <p class="text-text-main text-sm">{value || <span class="text-text-secondary italic">—</span>}</p>
    </div>
  );
}

export const AdminEnrollmentDetailPage: FC<{
  user: User;
  lang: Lang;
  enrollment: Enrollment;
}> = ({ user, lang, enrollment: e }) => {
  return (
    <Layout title={`Enrollment #${e.id} - Admin - ${APP_NAME}`}>
      <Header user={user} currentPath="/admin" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
        <div class="w-full flex items-center justify-between mb-6">
          <div>
            <h1 class="text-text-main text-2xl font-black">Enrollment #{e.id}</h1>
            <p class="text-text-secondary text-xs">Submitted {e.submitted_at.slice(0, 16).replace("T", " ")} UTC</p>
          </div>
          <a href="/admin/enrollments" class="px-4 py-2 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-main hover:bg-slate-50">
            ← All Enrollments
          </a>
        </div>

        <div class="w-full flex flex-col gap-5">
          {/* Personal info */}
          <div class="bg-white border border-border-light rounded-xl p-6">
            <h2 class="text-text-main font-bold mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">person</span>
              Personal Info
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" value={e.full_name} />
              <Field label="Date of Birth" value={e.date_of_birth} />
              <Field label="Gender" value={e.gender === "male" ? "Laki-laki (Male)" : "Perempuan (Female)"} />
              <Field label="WhatsApp" value={e.whatsapp} />
            </div>
            <div class="mt-4">
              <Field label="Address" value={e.address} />
            </div>
          </div>

          {/* Program */}
          <div class="bg-white border border-border-light rounded-xl p-6">
            <h2 class="text-text-main font-bold mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">auto_stories</span>
              Program & Quran Level
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Program Type" value={e.program_type} />
              <Field label="Current Quran Level" value={e.quran_level} />
            </div>
          </div>

          {/* Wali */}
          <div class="bg-white border border-border-light rounded-xl p-6">
            <h2 class="text-text-main font-bold mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">family_restroom</span>
              Wali / Guardian
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Wali Name" value={e.wali_name} />
              <Field label="Wali Contact (WA)" value={e.wali_contact} />
            </div>
          </div>

          {/* Notes */}
          {e.notes && (
            <div class="bg-white border border-border-light rounded-xl p-6">
              <h2 class="text-text-main font-bold mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-xl">notes</span>
                Motivation / Notes
              </h2>
              <p class="text-text-main text-sm whitespace-pre-wrap">{e.notes}</p>
            </div>
          )}

          {/* Meta */}
          <div class="bg-slate-50 border border-border-light rounded-xl px-5 py-4 flex flex-wrap gap-4 text-xs text-text-secondary">
            <span>ID: <strong class="text-text-main">#{e.id}</strong></span>
            <span>Submitted: <strong class="text-text-main">{e.submitted_at.slice(0, 19).replace("T", " ")} UTC</strong></span>
            {e.ip_address && <span>IP: <strong class="text-text-main">{e.ip_address}</strong></span>}
          </div>
        </div>
      </main>
    </Layout>
  );
};
