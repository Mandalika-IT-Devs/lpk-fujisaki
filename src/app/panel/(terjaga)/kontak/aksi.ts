"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";
import { normalkanNomorWhatsApp } from "@/domain/nomor-whatsapp";
import { bolehMembukaMenu } from "@/domain/panel-pegawai";
import { type Kontak, simpanKontak } from "@/server/kontak";
import { pastikanPegawai } from "../../penjaga";
import type { Pesan } from "../pesan-tindakan";
import { type IsianFormulirKontak, keIsianFormulir } from "./isian-formulir";

// Mengelola kontak lembaga hanya untuk Admin (PRD §2.2, §3.5). Kewenangan diperiksa di server pada setiap
// penyimpanan, dengan aturan yang sama seperti menu Kontak.

const ALAMAT = "/panel/kontak";

export type KeadaanFormulirKontak = {
  pesan: Pesan | null;
  isian: IsianFormulirKontak;
};

const PESAN_ALAMAT =
  "Alamat belum diisi. Tulis alamat kantor lembaga, misalnya Desa Kesugihan, Kab. Cilacap, Jawa Tengah.";
// Hanya nomor HP Indonesia yang diterima (PRD §5.2, ▶ Keputusan OD-09).
const PESAN_NOMOR_WHATSAPP =
  "Nomor WhatsApp kantor belum benar. Isi nomor HP Indonesia 10 sampai 13 digit yang diawali 08 atau +62 8, misalnya 0812-3456-7890. Nomor luar negeri dan nomor telepon rumah tidak diterima.";
const PESAN_EMAIL =
  "Email kantor belum benar. Isi alamat email lengkap, misalnya info@lpkfujisaki.com.";
const PESAN_TAUTAN_PETA =
  "Tautan lokasi peta belum benar. Salin tautan lengkap dari aplikasi peta, yang diawali https://, atau kosongkan isian ini.";

/** Isian yang boleh kosong disimpan sebagai null. */
const kosongJadiNull = (nilai: string) => (nilai === "" ? null : nilai);

/** Tautan web http atau https dengan nama domain lengkap, supaya tautan "Lihat di peta" selalu membuka halaman web. */
const tautanWeb = z.url({
  protocol: /^https?$/,
  hostname: z.regexes.domain,
  error: PESAN_TAUTAN_PETA,
});

/**
 * Bentuk isian; urutannya sama dengan urutan formulir, jadi pesan yang tampil adalah isian salah yang paling atas.
 * Keabsahan nomor WhatsApp diperiksa aturan domain sesudah kewenangan diperiksa.
 */
const skemaKontak = z.object({
  alamat: z.string(PESAN_ALAMAT).trim().min(1, PESAN_ALAMAT),
  nomorWhatsApp: z
    .string(PESAN_NOMOR_WHATSAPP)
    .trim()
    .transform(kosongJadiNull),
  email: z.string(PESAN_EMAIL).trim().pipe(z.email(PESAN_EMAIL)),
  tautanPeta: z
    .string(PESAN_TAUTAN_PETA)
    .trim()
    .pipe(z.union([z.literal(""), tautanWeb], { error: PESAN_TAUTAN_PETA }))
    .transform(kosongJadiNull),
});

function bacaIsian(formulir: FormData): IsianFormulirKontak {
  const teks = (nama: string) => {
    const nilai = formulir.get(nama);
    return typeof nilai === "string" ? nilai : "";
  };
  return {
    alamat: teks("alamat"),
    nomorWhatsApp: teks("nomorWhatsApp"),
    email: teks("email"),
    tautanPeta: teks("tautanPeta"),
  };
}

function ditolak(
  isian: IsianFormulirKontak,
  teks: string,
): KeadaanFormulirKontak {
  return { pesan: { jenis: "peringatan", teks }, isian };
}

function pesanTersimpan(kontak: Kontak): string {
  const nomor = kontak.nomorWhatsApp
    ? `Nomor WhatsApp kantor tersimpan sebagai ${kontak.nomorWhatsApp}.`
    : "Nomor WhatsApp kantor kosong, jadi tombol Chat WhatsApp nonaktif sampai nomornya diisi.";
  return `Kontak lembaga sudah disimpan dan tampil di situs publik. ${nomor}`;
}

/**
 * Admin menyimpan kontak lembaga. Nomor WhatsApp kantor disimpan dalam bentuk ternormalisasi, dan nomor yang tidak
 * sah atau nomor luar negeri ditolak (PRD §3.5, §5.2, ▶ Keputusan OD-09).
 */
export async function simpanKontakLembaga(
  _keadaan: KeadaanFormulirKontak,
  formulir: FormData,
): Promise<KeadaanFormulirKontak> {
  const pegawai = await pastikanPegawai();
  const isian = bacaIsian(formulir);
  const hasilBentuk = skemaKontak.safeParse(isian);
  if (!bolehMembukaMenu(pegawai.peran, "kontak")) forbidden();
  if (!hasilBentuk.success) {
    return ditolak(isian, hasilBentuk.error.issues[0].message);
  }

  const { data } = hasilBentuk;
  let nomorWhatsApp: string | null = null;
  if (data.nomorWhatsApp !== null) {
    const nomor = normalkanNomorWhatsApp(data.nomorWhatsApp);
    if (!nomor.sah) return ditolak(isian, PESAN_NOMOR_WHATSAPP);
    nomorWhatsApp = nomor.dinormalkan;
  }
  const kontak: Kontak = {
    alamat: data.alamat,
    nomorWhatsApp,
    email: data.email,
    tautanPeta: data.tautanPeta,
  };

  try {
    await simpanKontak(kontak);
    revalidatePath(ALAMAT);
    return {
      pesan: { jenis: "kabar", teks: pesanTersimpan(kontak) },
      isian: keIsianFormulir(kontak),
    };
  } catch (galat) {
    console.error(galat);
    return ditolak(
      isian,
      "Kontak lembaga belum tersimpan karena gangguan di server. Coba simpan lagi beberapa saat lagi; bila tetap gagal, hubungi pengelola server lembaga.",
    );
  }
}
