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
