"use server";

import {
  bacaPilihanFormulirPendaftaran,
  simpanDrafFormulirPendaftaran,
} from "@/server/formulir-pendaftaran";
import type { Pesan } from "@/app/panel/(terjaga)/pesan-tindakan";
import { pastikanPemilikAkun } from "../../penjaga-akun";
import {
  type GalatIsian,
  ISIAN_KOSONG,
  type IsianFormulirPendaftaran,
  keIsianFormulir,
  LABEL_ISIAN,
  type NamaIsian,
  periksaDrafFormulirPendaftaran,
} from "./isian-formulir";

export type KeadaanFormulirPendaftaran = {
  pesan: Pesan | null;
  isian: IsianFormulirPendaftaran;
  galat: GalatIsian;
};

const KABAR_DRAF_TERSIMPAN =
  "Draf tersimpan. Kamu bisa melanjutkannya kapan saja dari halaman akunmu.";

const PESAN_GANGGUAN =
  "Draf belum tersimpan karena gangguan di server. Coba simpan lagi beberapa saat lagi; bila tetap gagal, hubungi lembaga lewat halaman Kontak.";

function bacaIsian(formulir: FormData): IsianFormulirPendaftaran {
  const isian = { ...ISIAN_KOSONG };
  for (const nama of Object.keys(ISIAN_KOSONG) as NamaIsian[]) {
    const nilai = formulir.get(nama);
    isian[nama] = typeof nilai === "string" ? nilai : "";
  }
  return isian;
}

/** Ringkasan di dekat tombol simpan, yang menyebut isian yang salah dalam urutan formulir. */
function pesanIsianSalah(galat: GalatIsian): string {
  const salah = (Object.keys(LABEL_ISIAN) as NamaIsian[])
    .filter((nama) => galat[nama])
    .map((nama) => LABEL_ISIAN[nama]);
  return `Draf belum tersimpan karena isian berikut belum benar: ${salah.join(", ")}. Perbaiki isian yang ditandai, atau kosongkan, lalu simpan lagi.`;
}

/**
 * Pemilik akun menyimpan formulir pendaftarannya sebagai draf (PRD §6.2): kapan saja, juga bila belum lengkap.
 * Bentuk setiap isian yang terisi diperiksa lebih dulu; bila ada yang salah, draf belum disimpan dan setiap isian
 * yang salah ditandai. Program dan bidang kerja hanya boleh yang aktif saat disimpan (§4.3).
 */
export async function simpanDraf(
  _keadaan: KeadaanFormulirPendaftaran,
  formulir: FormData,
): Promise<KeadaanFormulirPendaftaran> {
  const pemilikAkun = await pastikanPemilikAkun();
  const isian = bacaIsian(formulir);

  try {
    const pilihan = await bacaPilihanFormulirPendaftaran();
    const idPilihan = {
      programId: pilihan.program.map((p) => p.id),
      bidangKerjaId: pilihan.bidangKerja.map((b) => b.id),
    };
    const hasil = periksaDrafFormulirPendaftaran(isian, idPilihan);
    if (!hasil.sah) {
      return {
        pesan: { jenis: "peringatan", teks: pesanIsianSalah(hasil.galat) },
        isian,
        galat: hasil.galat,
      };
    }
    await simpanDrafFormulirPendaftaran(pemilikAkun.id, hasil.draf);
    // Isian tampil seperti yang tersimpan, sama seperti saat formulir dibuka lagi; misalnya nomor HP dalam bentuk
    // ternormalisasi (§5.2).
    return {
      pesan: { jenis: "kabar", teks: KABAR_DRAF_TERSIMPAN },
      isian: keIsianFormulir(hasil.draf, idPilihan),
      galat: {},
    };
  } catch (galat) {
    console.error(galat);
    return {
      pesan: { jenis: "peringatan", teks: PESAN_GANGGUAN },
      isian,
      galat: {},
    };
  }
}
