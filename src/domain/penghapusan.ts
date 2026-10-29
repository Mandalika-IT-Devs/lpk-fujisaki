/**
 * Penghapusan oleh Admin: akun seseorang dihapus permanen beserta semua pendaftarannya (PRD §12.5).
 */

import { normalkanEmail, type Peran } from "./akun";

/** Hanya Admin yang boleh menghapus data seseorang secara permanen (PRD §2.2, §12.5). Staf tidak. */
export function bolehMenghapusPermanen(peran: Peran): boolean {
  return peran === "admin";
}

/**
 * Sistem meminta konfirmasi dengan mengetik nomor pendaftaran atau email akun orang itu (PRD §12.5). Ketikan cocok bila
 * sama persis dengan salah satunya, tanpa spasi di ujung dan tanpa membedakan huruf besar dan kecil, karena email
 * dibandingkan dengan cara itu (§5.1). Ketikan lain, termasuk yang kosong, ditolak.
 */
export function konfirmasiPenghapusanCocok(
  ketikan: string,
  orang: { nomorPendaftaran: string; email: string },
): boolean {
  const isi = ketikan.trim();
  return (
    isi.toUpperCase() === orang.nomorPendaftaran.toUpperCase() ||
    normalkanEmail(isi) === normalkanEmail(orang.email)
  );
}
