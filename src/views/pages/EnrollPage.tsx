import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { APP_NAME } from "../../config.ts";

const PROGRAM_OPTIONS = [
  "Tahsin (Perbaikan Bacaan)",
  "Tilawah (Tartil & Kelancaran)",
  "Tahfidz (Hafalan Al-Quran)",
  "Murojaah (Pengulangan Hafalan)",
];

const LEVEL_OPTIONS = [
  "Belum bisa membaca Al-Quran",
  "Bisa membaca, perlu perbaikan (tahsin)",
  "Sudah lancar membaca",
  "Hafal 1-5 juz",
  "Hafal 6-15 juz",
  "Hafal 16-29 juz",
  "Hafal 30 juz (Khatam)",
];

export const EnrollPage: FC<{
  success?: boolean;
  error?: string;
  prefill?: Record<string, string>;
}> = ({ success, error, prefill = {} }) => {
  if (success) {
    return (
      <Layout title={`Pendaftaran - ${APP_NAME}`}>
        <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
          <div class="w-full max-w-md text-center bg-white border border-border-light rounded-2xl p-10 shadow-sm">
            <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <span class="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
            </div>
            <h1 class="text-2xl font-black text-text-main mb-2">Pendaftaran Terkirim!</h1>
            <p class="text-text-secondary text-sm leading-relaxed mb-6">
              Terima kasih telah mendaftar. Tim kami akan menghubungi Anda melalui WhatsApp untuk informasi lebih lanjut.
            </p>
            <a href="/landing" class="inline-block px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors">
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Pendaftaran - ${APP_NAME}`} description="Daftar program Al-Quran Markaz Talaqqi">
      {/* Nav */}
      <header class="w-full border-b border-border-light bg-white px-4 sm:px-6 py-3 flex items-center justify-between">
        <a href="/landing" class="flex items-center gap-2 text-primary font-black text-lg">
          <img src="/public/logo.png" alt={APP_NAME} class="w-7 h-7 rounded" />
          {APP_NAME}
        </a>
        <a href="/landing" class="text-sm text-text-secondary hover:text-text-main font-medium">
          ← Kembali
        </a>
      </header>

      <main class="flex-1 flex flex-col items-center px-4 sm:px-6 py-10">
        <div class="w-full max-w-2xl">
          <div class="mb-8">
            <h1 class="text-3xl font-black text-text-main mb-1">Formulir Pendaftaran</h1>
            <p class="text-text-secondary text-sm">
              Isi formulir berikut untuk mendaftar program Quran di Markaz Talaqqi. Semua kolom bertanda * wajib diisi.
            </p>
          </div>

          {error && (
            <div class="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6 border border-red-200 flex items-center gap-2">
              <span class="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form method="POST" action="/enroll" class="flex flex-col gap-6">
            {/* Personal info */}
            <div class="bg-white border border-border-light rounded-xl p-6">
              <h2 class="text-text-main font-bold mb-4">Data Pribadi</h2>
              <div class="flex flex-col gap-4">
                <div>
                  <label class="block text-sm font-semibold text-text-main mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={prefill.full_name || ""}
                    required
                    maxlength={100}
                    placeholder="Nama sesuai KTP / kartu pelajar"
                    class="w-full border border-border-light rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-text-main mb-1">Tanggal Lahir *</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={prefill.date_of_birth || ""}
                      required
                      class="w-full border border-border-light rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-text-main mb-1">Jenis Kelamin *</label>
                    <select
                      name="gender"
                      required
                      class="w-full border border-border-light rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="" disabled selected={!prefill.gender}>Pilih...</option>
                      <option value="male" selected={prefill.gender === "male"}>Laki-laki</option>
                      <option value="female" selected={prefill.gender === "female"}>Perempuan</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-text-main mb-1">Nomor WhatsApp *</label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={prefill.whatsapp || ""}
                    required
                    maxlength={20}
                    placeholder="Contoh: 08123456789"
                    class="w-full border border-border-light rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-text-main mb-1">Alamat *</label>
                  <textarea
                    name="address"
                    required
                    maxlength={500}
                    rows={3}
                    placeholder="Alamat lengkap tempat tinggal"
                    class="w-full border border-border-light rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  >{prefill.address || ""}</textarea>
                </div>
              </div>
            </div>

            {/* Program info */}
            <div class="bg-white border border-border-light rounded-xl p-6">
              <h2 class="text-text-main font-bold mb-4">Program & Kemampuan</h2>
              <div class="flex flex-col gap-4">
                <div>
                  <label class="block text-sm font-semibold text-text-main mb-1">Program yang Dipilih *</label>
                  <select
                    name="program_type"
                    required
                    class="w-full border border-border-light rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="" disabled selected={!prefill.program_type}>Pilih program...</option>
                    {PROGRAM_OPTIONS.map((p) => (
                      <option value={p} selected={prefill.program_type === p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-text-main mb-1">Kemampuan Al-Quran Saat Ini *</label>
                  <select
                    name="quran_level"
                    required
                    class="w-full border border-border-light rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="" disabled selected={!prefill.quran_level}>Pilih level...</option>
                    {LEVEL_OPTIONS.map((l) => (
                      <option value={l} selected={prefill.quran_level === l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Wali info */}
            <div class="bg-white border border-border-light rounded-xl p-6">
              <h2 class="text-text-main font-bold mb-1">Data Wali / Orang Tua</h2>
              <p class="text-text-secondary text-xs mb-4">Jika pendaftar sudah dewasa, isi dengan data sendiri.</p>
              <div class="flex flex-col gap-4">
                <div>
                  <label class="block text-sm font-semibold text-text-main mb-1">Nama Wali *</label>
                  <input
                    type="text"
                    name="wali_name"
                    value={prefill.wali_name || ""}
                    required
                    maxlength={100}
                    placeholder="Nama lengkap wali / orang tua"
                    class="w-full border border-border-light rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-text-main mb-1">Kontak Wali (WhatsApp) *</label>
                  <input
                    type="text"
                    name="wali_contact"
                    value={prefill.wali_contact || ""}
                    required
                    maxlength={100}
                    placeholder="Nomor WhatsApp wali"
                    class="w-full border border-border-light rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div class="bg-white border border-border-light rounded-xl p-6">
              <h2 class="text-text-main font-bold mb-4">Motivasi / Catatan Tambahan</h2>
              <textarea
                name="notes"
                maxlength={1000}
                rows={4}
                placeholder="Ceritakan motivasi Anda bergabung, atau hal lain yang ingin disampaikan (opsional)"
                class="w-full border border-border-light rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              >{prefill.notes || ""}</textarea>
            </div>

            <button
              type="submit"
              class="w-full py-3 bg-primary text-white font-black rounded-xl text-base hover:bg-primary-dark transition-colors shadow-sm"
            >
              Kirim Pendaftaran
            </button>
          </form>
        </div>
      </main>
    </Layout>
  );
};
