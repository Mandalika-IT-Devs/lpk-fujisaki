/**
 * Daftar pendaftaran di panel pegawai (PRD §11.1): semua pendaftaran, dari yang paling baru dikirim.
 */

import type { StatusPendaftaran } from "./pendaftaran";

/** Bagian sebuah pendaftaran yang dibutuhkan untuk menyaring dan mengurutkan daftar. */
type PendaftaranDiDaftar = {
  nomor: string;
  /** Nama lengkap sesuai KTP dari formulir pendaftaran. */
  namaLengkap: string;
  programId: number;
  /** Bidang kerja yang diminati, atau null bila "Belum tahu". */
  bidangKerjaId: number | null;
  tahap: number;
  status: StatusPendaftaran;
  dikirimPada: Date;
};

/** Saringan daftar pendaftaran; saringan yang tidak diisi tidak menyaring apa pun. */
export type SaringanPendaftaran = {
  tahap?: number;
  programId?: number;
  /** Sebuah bidang kerja; pendaftaran yang memilih "Belum tahu" tidak cocok dengan bidang kerja mana pun. */
  bidangKerjaId?: number;
  status?: StatusPendaftaran;
  /** Sebagian nama lengkap atau nomor pendaftaran, tanpa membedakan huruf besar dan kecil. */
  cari?: string;
};

/** Sebuah saringan cocok bila tidak diisi, atau bila nilainya sama. */
function cocok<T>(saringan: T | undefined, nilai: T): boolean {
  return saringan === undefined || saringan === nilai;
}

function cocokPencarian(
  cari: string | undefined,
  pendaftaran: PendaftaranDiDaftar,
): boolean {
  if (cari === undefined) return true;
  const dicari = cari.toLowerCase();
  return [pendaftaran.namaLengkap, pendaftaran.nomor].some((teks) =>
    teks.toLowerCase().includes(dicari),
  );
}

/** Pendaftaran yang cocok dengan semua saringan yang diisi, dari yang paling baru dikirim. */
export function saringPendaftaran<P extends PendaftaranDiDaftar>(
  semua: readonly P[],
  saringan: SaringanPendaftaran,
): P[] {
  return semua
    .filter(
      (pendaftaran) =>
        cocok(saringan.tahap, pendaftaran.tahap) &&
        cocok(saringan.programId, pendaftaran.programId) &&
        cocok(saringan.bidangKerjaId, pendaftaran.bidangKerjaId) &&
        cocok(saringan.status, pendaftaran.status) &&
        cocokPencarian(saringan.cari, pendaftaran),
    )
    .toSorted((a, b) => b.dikirimPada.getTime() - a.dikirimPada.getTime());
}

/** Jumlah baris daftar pendaftaran per halaman. */
const BARIS_PER_HALAMAN = 25;

/** Satu halaman daftar, beserta bahan keterangannya: urutan baris pertama dan terakhir, dan jumlah semua baris. */
export type HalamanDaftar<T> = {
  baris: T[];
  halaman: number;
  jumlahHalaman: number;
  jumlah: number;
  dari: number;
  sampai: number;
};

/**
 * Halaman ke-`diminta` dari sebuah daftar, 25 baris per halaman. Daftar kosong tetap punya satu halaman, dan halaman
 * sesudah halaman terakhir menjadi halaman terakhir.
 */
export function bagiHalaman<T>(
  daftar: readonly T[],
  diminta: number,
): HalamanDaftar<T> {
  const jumlah = daftar.length;
  const jumlahHalaman = Math.max(1, Math.ceil(jumlah / BARIS_PER_HALAMAN));
  const halaman = Math.min(diminta, jumlahHalaman);
  const awal = (halaman - 1) * BARIS_PER_HALAMAN;
  const baris = daftar.slice(awal, awal + BARIS_PER_HALAMAN);
  return {
    baris,
    halaman,
    jumlahHalaman,
    jumlah,
    dari: baris.length > 0 ? awal + 1 : 0,
    sampai: awal + baris.length,
  };
}
