import { z } from "zod";
import { ALAMAT_DAFTAR_PENDAFTARAN } from "./saringan";

// Halaman satu pendaftaran di panel pegawai ditunjuk dengan nomor pendaftarannya, misalnya
// /panel/pendaftaran/FGC-2026-0037, supaya alamatnya terbaca dan sama dengan nomor di daftar pendaftaran.

/** Nomor pendaftaran berformat FGC-TTTT-NNNN, dengan nomor urut minimal 4 digit (PRD §6.4). */
export const skemaNomorPendaftaran = z.string().regex(/^FGC-\d{4}-\d{4,}$/);

/** Alamat halaman pendaftaran dengan nomor pendaftaran tertentu. */
export function alamatPendaftaran(nomor: string): string {
  return `${ALAMAT_DAFTAR_PENDAFTARAN}/${nomor}`;
}

// Sesudah Admin menghapus permanen pemilik sebuah pendaftaran (PRD §12.5), halaman pendaftarannya tidak ada lagi, jadi
// Admin dibawa ke daftar pendaftaran. Nomor pendaftaran yang dihapus ikut di alamat, misalnya
// /panel/pendaftaran?dihapus=FGC-2026-0037, supaya daftar menampilkan kabar penghapusannya.

const PARAMETER_DIHAPUS = "dihapus";

/** Alamat daftar pendaftaran dengan kabar penghapusan permanen pendaftaran `nomor`. */
export function alamatSesudahHapusPermanen(nomor: string): string {
  return `${ALAMAT_DAFTAR_PENDAFTARAN}?${new URLSearchParams({ [PARAMETER_DIHAPUS]: nomor })}`;
}

/** Nomor pendaftaran yang baru dihapus permanen menurut parameter alamat daftar pendaftaran, atau undefined. */
export function bacaNomorDihapus(
  parameterAlamat: Record<string, string | string[] | undefined>,
): string | undefined {
  const nilai = parameterAlamat[PARAMETER_DIHAPUS];
  const nomor = skemaNomorPendaftaran.safeParse(
    Array.isArray(nilai) ? nilai[0] : nilai,
  );
  return nomor.success ? nomor.data : undefined;
}
