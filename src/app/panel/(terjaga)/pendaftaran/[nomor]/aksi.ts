"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import type { IsianWajib } from "@/domain/formulir-pendaftaran";
import { bolehMembukaMenu } from "@/domain/panel-pegawai";
import { bacaPilihanUbahIsian } from "@/server/formulir-pendaftaran";
import { bacaPendaftaran, ubahIsianPendaftaran } from "@/server/pendaftaran";
import { bacaSekarang } from "@/server/waktu";
import {
  bacaIsianFormulir,
  type GalatIsian,
  galatIsianDitolak,
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
  /** Hasil tindakan terakhir; perubahan yang ditolak membawa satu pesan untuk setiap sebabnya. */
  pesan: Pesan[];
  /** Isian hasil proses terakhir, atau null sebelum formulir pertama kali diproses (isian dari halaman dipakai). */
  isian: IsianFormulirPendaftaran | null;
  galat: GalatIsian;
  /** Kunci baru setiap kali formulir diproses, supaya isian dipasang ulang dari isian hasil proses terakhir. */
  versi: string;
};

const PESAN_TIDAK_ADA =
  "Pendaftaran ini tidak ditemukan. Buka lagi daftar pendaftaran, lalu pilih pendaftarannya dari daftar.";

const PESAN_GANGGUAN =
  "Perubahan belum disimpan karena gangguan di server. Coba simpan lagi beberapa saat lagi; bila tetap gagal, hubungi pengelola server lembaga.";

const peringatan = (teks: string): Pesan => ({ jenis: "peringatan", teks });

/** Pesan untuk setiap sebab perubahan ditolak sesudah bentuk isiannya benar, dalam urutan formulir. */
function pesanDitolak(ditolak: {
  belumDiisi: readonly IsianWajib[];
  tanggalLahirTidakBenar: boolean;
}): Pesan[] {
  const pesan: Pesan[] = [];
  if (ditolak.belumDiisi.length > 0) {
    pesan.push(
      peringatan(
        `Perubahan belum disimpan karena isian wajib berikut belum diisi: ${ditolak.belumDiisi.map((nama) => LABEL_ISIAN[nama]).join(", ")}. Isi isian yang ditandai, lalu simpan lagi.`,
      ),
    );
  }
  if (ditolak.tanggalLahirTidakBenar) {
    pesan.push(
      peringatan(
        "Perubahan belum disimpan karena tanggal lahir jatuh sesudah hari ini. Periksa lagi tanggal lahirnya, lalu simpan lagi.",
      ),
    );
  }
  return pesan;
}

/**
 * Pegawai menyimpan perubahan isian formulir sebuah pendaftaran. Keadaan sebelumnya yang dikirim browser tidak dipakai:
 * semua yang dibutuhkan dibaca dari isian formulir dan database.
 */
export async function simpanIsianPendaftaran(
  _sebelum: unknown,
  formulir: FormData,
): Promise<KeadaanUbahIsian> {
  const pegawai = await pastikanPegawai();
  const nomor = skemaNomorPendaftaran.safeParse(formulir.get("nomor"));
  const isian = bacaIsianFormulir(formulir);
  if (!bolehMembukaMenu(pegawai.peran, "pendaftaran")) forbidden();

  const versi = randomUUID();
  const ditolak = (pesan: Pesan[], galat: GalatIsian = {}) => ({
    pesan,
    isian,
    galat,
    versi,
  });
  if (!nomor.success) return ditolak([peringatan(PESAN_TIDAK_ADA)]);

  try {
    const tercatat = await bacaPendaftaran(nomor.data);
    if (!tercatat) return ditolak([peringatan(PESAN_TIDAK_ADA)]);
    const pilihan = keIdPilihan(await bacaPilihanUbahIsian(tercatat.isian));
    const bentuk = periksaDrafFormulirPendaftaran(isian, pilihan);
    if (!bentuk.sah) {
      return ditolak(
        [
          peringatan(
            `Perubahan belum disimpan karena isian berikut belum benar: ${labelIsianSalah(bentuk.galat)}. Perbaiki isian yang ditandai, lalu simpan lagi.`,
          ),
        ],
        bentuk.galat,
      );
    }
    const hasil = await ubahIsianPendaftaran(
      nomor.data,
      bentuk.draf,
      bacaSekarang(),
    );
    if (hasil.hasil === "tidak-ada") {
      return ditolak([peringatan(PESAN_TIDAK_ADA)]);
    }
    if (hasil.hasil === "ditolak") {
      return ditolak(pesanDitolak(hasil), galatIsianDitolak(hasil));
    }
    revalidatePath(alamatPendaftaran(nomor.data));
    // Isian tampil seperti yang tersimpan, sama seperti saat halaman dibuka lagi; misalnya nomor HP dalam bentuk
    // ternormalisasi (§5.2).
    return {
      pesan: [
        {
          jenis: "kabar",
          teks: `Perubahan isian formulir ${nomor.data} sudah disimpan dan terlihat oleh pemilik akunnya.`,
        },
      ],
      isian: keIsianFormulir(bentuk.draf, pilihan),
      galat: {},
      versi,
    };
  } catch (galat) {
    console.error(galat);
    return ditolak([peringatan(PESAN_GANGGUAN)]);
  }
}
