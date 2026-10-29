"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { bolehMembukaMenu } from "@/domain/panel-pegawai";
import { bacaPilihanUbahIsian } from "@/server/formulir-pendaftaran";
import { bacaPendaftaran, ubahIsianPendaftaran } from "@/server/pendaftaran";
import {
  bacaIsianFormulir,
  type GalatIsian,
  galatIsianWajib,
  type IsianFormulirPendaftaran,
  keIdPilihan,
  keIsianFormulir,
  LABEL_ISIAN,
  labelIsianSalah,
  periksaDrafFormulirPendaftaran,
} from "@/app/(publik)/akun/formulir-pendaftaran/isian-formulir";
import { pastikanPegawai } from "../../../penjaga";
import type { Pesan } from "../../pesan-tindakan";
import {
  alamatPendaftaran,
  skemaNomorPendaftaran,
} from "../alamat-pendaftaran";

// Mengubah isian formulir pendaftaran yang sudah dikirim hanya untuk Staf dan Admin (PRD §2.2, §6.5). Kewenangan
// diperiksa di server pada setiap tindakan, jadi permintaan langsung dari pemilik akun atau pengunjung juga ditolak.
// Isian diperiksa dengan aturan dan pesan yang sama seperti formulir pemilik akun (isian-formulir.ts).

export type KeadaanUbahIsian = {
  pesan: Pesan | null;
  isian: IsianFormulirPendaftaran;
  galat: GalatIsian;
  /** Naik setiap kali formulir diproses, supaya isian dipasang ulang dari isian hasil proses terakhir. */
  versi: number;
};

const PESAN_TIDAK_ADA =
  "Pendaftaran ini tidak ditemukan. Buka lagi daftar pendaftaran, lalu pilih pendaftarannya dari daftar.";

const PESAN_GANGGUAN =
  "Perubahan belum disimpan karena gangguan di server. Coba simpan lagi beberapa saat lagi; bila tetap gagal, hubungi pengelola server lembaga.";

/** Pegawai menyimpan perubahan isian formulir sebuah pendaftaran. */
export async function simpanIsianPendaftaran(
  sebelum: KeadaanUbahIsian,
  formulir: FormData,
): Promise<KeadaanUbahIsian> {
  const pegawai = await pastikanPegawai();
  const nomor = skemaNomorPendaftaran.safeParse(formulir.get("nomor"));
  const isian = bacaIsianFormulir(formulir);
  if (!bolehMembukaMenu(pegawai.peran, "pendaftaran")) forbidden();

  const versi = sebelum.versi + 1;
  const ditolak = (teks: string, galat: GalatIsian = {}) => ({
    pesan: { jenis: "peringatan" as const, teks },
    isian,
    galat,
    versi,
  });
  if (!nomor.success) return ditolak(PESAN_TIDAK_ADA);

  try {
    const tercatat = await bacaPendaftaran(nomor.data);
    if (!tercatat) return ditolak(PESAN_TIDAK_ADA);
    const pilihan = keIdPilihan(await bacaPilihanUbahIsian(tercatat.isian));
    const bentuk = periksaDrafFormulirPendaftaran(isian, pilihan);
    if (!bentuk.sah) {
      return ditolak(
        `Perubahan belum disimpan karena isian berikut belum benar: ${labelIsianSalah(bentuk.galat)}. Perbaiki isian yang ditandai, lalu simpan lagi.`,
        bentuk.galat,
      );
    }
    const hasil = await ubahIsianPendaftaran(nomor.data, bentuk.draf);
    if (hasil.hasil === "tidak-ada") return ditolak(PESAN_TIDAK_ADA);
    if (hasil.hasil === "ditolak") {
      return ditolak(
        `Perubahan belum disimpan karena isian wajib berikut belum diisi: ${hasil.belumDiisi.map((nama) => LABEL_ISIAN[nama]).join(", ")}. Isi isian yang ditandai, lalu simpan lagi.`,
        galatIsianWajib(hasil.belumDiisi),
      );
    }
    revalidatePath(alamatPendaftaran(nomor.data));
    // Isian tampil seperti yang tersimpan, sama seperti saat halaman dibuka lagi; misalnya nomor HP dalam bentuk
    // ternormalisasi (§5.2).
    return {
      pesan: {
        jenis: "kabar",
        teks: `Perubahan isian formulir ${nomor.data} sudah disimpan dan terlihat oleh pemilik akunnya.`,
      },
      isian: keIsianFormulir(bentuk.draf, pilihan),
      galat: {},
      versi,
    };
  } catch (galat) {
    console.error(galat);
    return ditolak(PESAN_GANGGUAN);
  }
}
