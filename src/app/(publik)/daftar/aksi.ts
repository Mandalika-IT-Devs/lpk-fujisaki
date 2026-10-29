"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ALAMAT_AKUN, ALAMAT_MASUK } from "@/components/tautan-situs";
import {
  bolehMembuatAkunCalonPeserta,
  kataSandiCukupPanjang,
  PANJANG_MINIMAL_KATA_SANDI,
} from "@/domain/akun";
import { normalkanNomorWhatsApp } from "@/domain/nomor-whatsapp";
import { buatAkunCalonPeserta } from "@/server/akun-calon-peserta";
import { auth } from "@/server/auth";
import { bacaSekarang } from "@/server/waktu";
import { bacaAkunMasuk } from "../penjaga-akun";

/** Isian formulir daftar akun seperti yang diketik, kecuali kata sandi, supaya isian tetap ada bila ditolak. */
type IsianDaftarAkun = {
  nama: string;
  email: string;
  nomorWhatsApp: string;
  setuju: boolean;
};

export type KeadaanDaftarAkun = {
  pesan: string | null;
  isian: IsianDaftarAkun;
};

const PESAN_NAMA = "Nama lengkap belum diisi. Isi nama lengkapmu.";
const PESAN_EMAIL =
  "Email belum benar. Isi alamat email lengkap, misalnya nama@contoh.com.";
// Hanya nomor HP Indonesia yang diterima (PRD §5.2, ▶ Keputusan OD-09).
const PESAN_NOMOR_WHATSAPP =
  "Nomor WhatsApp belum benar. Isi nomor HP Indonesia 10 sampai 13 digit yang diawali 08 atau +62 8, misalnya 0812-3456-7890. Nomor luar negeri dan nomor telepon rumah tidak diterima.";
const PESAN_KATA_SANDI = `Kata sandi kurang dari ${PANJANG_MINIMAL_KATA_SANDI} karakter. Pakai kata sandi minimal ${PANJANG_MINIMAL_KATA_SANDI} karakter.`;
const PESAN_PERSETUJUAN =
  "Persetujuan pemrosesan data belum dicentang. Baca Kebijakan Privasi, lalu centang persetujuannya untuk membuat akun.";
const PESAN_EMAIL_DIPAKAI =
  "Email ini sudah dipakai akun lain. Masuk dengan email itu, atau pakai email lain.";
const PESAN_NOMOR_DIPAKAI =
  "Nomor WhatsApp ini sudah dipakai akun lain. Pakai nomor WhatsApp lain, atau masuk ke akun yang memakai nomor ini.";
const PESAN_GANGGUAN =
  "Akun belum dibuat karena gangguan di server. Coba lagi beberapa saat lagi; bila tetap gagal, hubungi lembaga lewat halaman Kontak.";

/**
 * Bentuk isian; urutannya sama dengan urutan formulir, jadi pesan yang tampil adalah isian salah yang paling atas.
 * Nomor WhatsApp diperiksa dan dinormalkan dengan aturan domain (PRD §5.2).
 */
const skemaDaftarAkun = z.object({
  nama: z.string(PESAN_NAMA).trim().min(1, PESAN_NAMA),
  email: z.string(PESAN_EMAIL).trim().pipe(z.email(PESAN_EMAIL)),
  nomorWhatsApp: z
    .string(PESAN_NOMOR_WHATSAPP)
    .transform(normalkanNomorWhatsApp)
    .refine((nomor) => nomor.sah, PESAN_NOMOR_WHATSAPP)
    .transform((nomor) => nomor.dinormalkan),
  kataSandi: z
    .string(PESAN_KATA_SANDI)
    .refine(kataSandiCukupPanjang, PESAN_KATA_SANDI),
  // Kotak centang yang dicentang dikirim sebagai "on" (PRD §5.1, §12.1).
  setuju: z.literal("on", PESAN_PERSETUJUAN),
});

function bacaIsian(formulir: FormData): IsianDaftarAkun {
  const teks = (nama: string) => {
    const nilai = formulir.get(nama);
    return typeof nilai === "string" ? nilai : "";
  };
  return {
    nama: teks("nama"),
    email: teks("email"),
    nomorWhatsApp: teks("nomorWhatsApp"),
    setuju: formulir.get("setuju") === "on",
  };
}

/**
 * Pengunjung membuat akun calon peserta (PRD §5.1). Waktu persetujuan pemrosesan data dibaca dari jam server dan
 * disimpan bersama akunnya (§12.1). Sesudah akun dibuat, email verifikasi terkirim (§5.3) dan pengunjung langsung
 * masuk ke akunnya. Orang yang sudah masuk ke sebuah akun dibawa ke akunnya, karena akun dibuat oleh pengunjung (§2.2).
 */
export async function buatAkun(
  _keadaan: KeadaanDaftarAkun,
  formulir: FormData,
): Promise<KeadaanDaftarAkun> {
  const masuk = await bacaAkunMasuk();
  const isian = bacaIsian(formulir);
  const hasilBentuk = skemaDaftarAkun.safeParse({
    ...isian,
    setuju: formulir.get("setuju"),
    kataSandi: formulir.get("kataSandi"),
  });
  if (!bolehMembuatAkunCalonPeserta(masuk?.akun ?? null)) redirect(ALAMAT_AKUN);
  if (!hasilBentuk.success) {
    return { pesan: hasilBentuk.error.issues[0].message, isian };
  }
  const { nama, email, nomorWhatsApp, kataSandi } = hasilBentuk.data;

  let hasil;
  try {
    hasil = await buatAkunCalonPeserta(
      { nama, email, nomorWhatsApp, kataSandi },
      bacaSekarang(),
    );
  } catch (galat) {
    console.error(galat);
    return { pesan: PESAN_GANGGUAN, isian };
  }
  if (hasil.hasil === "email-dipakai") {
    return { pesan: PESAN_EMAIL_DIPAKAI, isian };
  }
  if (hasil.hasil === "nomor-dipakai") {
    return { pesan: PESAN_NOMOR_DIPAKAI, isian };
  }
  if (hasil.hasil === "kata-sandi-terlalu-panjang") {
    return {
      pesan: `Kata sandi terlalu panjang. Pakai kata sandi paling banyak ${hasil.panjangMaksimal} karakter.`,
      isian,
    };
  }

  try {
    await auth.api.signInEmail({
      body: { email: hasil.email, password: kataSandi },
      headers: await headers(),
    });
  } catch (galat) {
    // Akunnya sudah dibuat; pemiliknya bisa masuk sendiri di halaman masuk.
    console.error(galat);
    redirect(ALAMAT_MASUK);
  }
  redirect(ALAMAT_AKUN);
}
