/**
 * Program dan bidang kerja yang dikelola Admin (PRD §4).
 */

/** Batas usia program dalam tahun penuh; kedua batas termasuk (PRD §4.1, §6.3). */
export type RentangUsia = { usiaMinimal: number; usiaMaksimal: number };

export type HasilPeriksaRentangUsia =
  | { sah: true }
  | {
      sah: false;
      alasan: "minimal-melebihi-maksimal";
      usiaMinimal: number;
      usiaMaksimal: number;
    };

/**
 * Usia memenuhi syarat bila usia minimal ≤ usia ≤ usia maksimal (PRD §6.3), jadi usia minimal sebuah program
 * tidak boleh lebih besar dari usia maksimalnya. Hasil yang ditolak membawa kedua angka untuk pesannya.
 */
export function periksaRentangUsia(
  rentang: RentangUsia,
): HasilPeriksaRentangUsia {
  const { usiaMinimal, usiaMaksimal } = rentang;
  if (usiaMinimal > usiaMaksimal) {
    return {
      sah: false,
      alasan: "minimal-melebihi-maksimal",
      usiaMinimal,
      usiaMaksimal,
    };
  }
  return { sah: true };
}

/**
 * Program dan bidang kerja tidak pernah dihapus, hanya dinonaktifkan. Yang nonaktif tidak tampil di situs publik,
 * dan tampil lagi setelah Admin mengaktifkannya kembali (PRD §4.3). Urutan daftar dipertahankan.
 */
export function tampilDiSitusPublik<T extends { aktif: boolean }>(
  daftar: readonly T[],
): T[] {
  return daftar.filter((isi) => isi.aktif);
}
