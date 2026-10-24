/**
 * Akun: pegawai dan pemilik akun (PRD §2.1, §5).
 */

/** Panjang kata sandi paling sedikit, untuk semua akun (PRD §5.1). */
export const PANJANG_MINIMAL_KATA_SANDI = 8;

/** Peran pegawai (PRD §2.2). */
export type Peran = "admin" | "staf";

/** Pegawai punya peran dan status aktif; pemilik akun tidak punya keduanya. */
export type Akun =
  | { jenis: "pegawai"; peran: Peran; aktif: boolean }
  | { jenis: "pemilik_akun" };

export function kataSandiCukupPanjang(kataSandi: string): boolean {
  return kataSandi.length >= PANJANG_MINIMAL_KATA_SANDI;
}

/** Pegawai nonaktif tidak bisa masuk (PRD §5.5). */
export function bolehMasuk(akun: Akun): boolean {
  return akun.jenis === "pemilik_akun" || akun.aktif;
}
