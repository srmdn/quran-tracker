import { Hono } from "hono";
import { db } from "../db/connection.ts";
import { consumeRateLimit } from "../lib/rate-limit.ts";
import { EnrollPage } from "../views/pages/EnrollPage.tsx";
import type { Env } from "../types.ts";

const enroll = new Hono<Env>();

const VALID_PROGRAMS = [
  "Tahsin (Perbaikan Bacaan)",
  "Tilawah (Tartil & Kelancaran)",
  "Tahfidz (Hafalan Al-Quran)",
  "Murojaah (Pengulangan Hafalan)",
];

const VALID_LEVELS = [
  "Belum bisa membaca Al-Quran",
  "Bisa membaca, perlu perbaikan (tahsin)",
  "Sudah lancar membaca",
  "Hafal 1-5 juz",
  "Hafal 6-15 juz",
  "Hafal 16-29 juz",
  "Hafal 30 juz (Khatam)",
];

enroll.get("/", (c) => {
  const success = c.req.query("success") === "1";
  return c.html(<EnrollPage success={success} />);
});

enroll.post("/", async (c) => {
  // Rate limit: 3 submissions per hour per IP
  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const bucket = consumeRateLimit(`enroll:${ip}`, { max: 3, windowMs: 3_600_000 });
  if (!bucket.allowed) {
    return c.html(
      <EnrollPage error="Terlalu banyak pengiriman. Coba lagi dalam 1 jam." />,
      429
    );
  }

  const body = await c.req.parseBody();

  const fullName = ((body.full_name as string) || "").trim();
  const dob = ((body.date_of_birth as string) || "").trim();
  const gender = ((body.gender as string) || "").trim();
  const whatsapp = ((body.whatsapp as string) || "").trim();
  const address = ((body.address as string) || "").trim();
  const programType = ((body.program_type as string) || "").trim();
  const quranLevel = ((body.quran_level as string) || "").trim();
  const waliName = ((body.wali_name as string) || "").trim();
  const waliContact = ((body.wali_contact as string) || "").trim();
  const notes = ((body.notes as string) || "").trim() || null;

  const prefill: Record<string, string> = {
    full_name: fullName,
    date_of_birth: dob,
    gender,
    whatsapp,
    address,
    program_type: programType,
    quran_level: quranLevel,
    wali_name: waliName,
    wali_contact: waliContact,
    notes: notes || "",
  };

  if (!fullName || fullName.length > 100) {
    return c.html(<EnrollPage error="Nama lengkap wajib diisi (maks. 100 karakter)." prefill={prefill} />);
  }
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return c.html(<EnrollPage error="Tanggal lahir tidak valid." prefill={prefill} />);
  }
  if (gender !== "male" && gender !== "female") {
    return c.html(<EnrollPage error="Jenis kelamin tidak valid." prefill={prefill} />);
  }
  if (!whatsapp || !/^[0-9+\-\s]{6,20}$/.test(whatsapp)) {
    return c.html(<EnrollPage error="Nomor WhatsApp tidak valid (6-20 digit)." prefill={prefill} />);
  }
  if (!address || address.length > 500) {
    return c.html(<EnrollPage error="Alamat wajib diisi (maks. 500 karakter)." prefill={prefill} />);
  }
  if (!VALID_PROGRAMS.includes(programType)) {
    return c.html(<EnrollPage error="Pilih program yang valid." prefill={prefill} />);
  }
  if (!VALID_LEVELS.includes(quranLevel)) {
    return c.html(<EnrollPage error="Pilih level Al-Quran yang valid." prefill={prefill} />);
  }
  if (!waliName || waliName.length > 100) {
    return c.html(<EnrollPage error="Nama wali wajib diisi (maks. 100 karakter)." prefill={prefill} />);
  }
  if (!waliContact || waliContact.length > 100) {
    return c.html(<EnrollPage error="Kontak wali wajib diisi (maks. 100 karakter)." prefill={prefill} />);
  }
  if (notes && notes.length > 1000) {
    return c.html(<EnrollPage error="Catatan terlalu panjang (maks. 1000 karakter)." prefill={prefill} />);
  }

  db.prepare(
    `INSERT INTO enrollments (full_name, date_of_birth, gender, whatsapp, address, program_type, quran_level, wali_name, wali_contact, notes, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(fullName, dob, gender, whatsapp, address, programType, quranLevel, waliName, waliContact, notes, ip);

  return c.redirect("/enroll?success=1");
});

export { enroll as enrollRoutes };
