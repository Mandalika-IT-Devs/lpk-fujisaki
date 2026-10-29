/**
 * Nomor pendaftaran (PRD §6.4): kode unik yang diberikan saat formulir pendaftaran dikirim.
 */

import { tanggalWib } from "./waktu-wib";

/**
 * Tahun nomor pendaftaran: tahun WIB saat formulir dikirim. Nomor urut dihitung per tahun ini, dimulai dari 1 setiap
 * 1 Januari pukul 00.00 WIB.
 */
export function tahunNomorPendaftaran(dikirimPada: Date): number {
  return tanggalWib(dikirimPada).tahun;
}

/**
 * Nomor pendaftaran berformat FGC-TTTT-NNNN: TTTT tahun WIB saat dikirim, NNNN nomor urut pendaftaran dalam tahun
 * itu, minimal 4 digit dengan nol di depan. Urutan ke-10.000 dan seterusnya ditulis apa adanya.
 * Hasilnya membawa tahun WIB-nya sebagai bahan hitung.
 */
export function nomorPendaftaran(isian: {
  dikirimPada: Date;
  urutan: number;
}): {
  tahunWib: number;
  nomor: string;
} {
  const tahunWib = tahunNomorPendaftaran(isian.dikirimPada);
  const urutan = String(isian.urutan).padStart(4, "0");
  return { tahunWib, nomor: `FGC-${tahunWib}-${urutan}` };
}
