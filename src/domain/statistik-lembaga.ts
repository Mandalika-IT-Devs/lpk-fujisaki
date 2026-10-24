/**
 * Statistik lembaga yang diisi Admin secara manual (PRD §3.3, ADR-0005). Angkanya tidak dihitung dari data
 * pendaftaran; sistem hanya menjumlahkan total siswa dan memeriksa kecocokannya dengan jumlah per bidang kerja.
 */

/** Level bahasa Jepang yang dicatat statistik lembaga, dari N5 sampai N2. */
export const LEVEL = ["N5", "N4", "N3", "N2"] as const;

export type Level = (typeof LEVEL)[number];

export type SiswaPerLevel = Record<Level, number>;

export type IsianStatistikLembaga = {
  perLevel: SiswaPerLevel;
  /** Satu angka untuk setiap bidang kerja aktif. */
  perBidangKerja: readonly number[];
  alumniDiJepang: number;
};

/** Hasil pemeriksaan beserta kedua angka yang dibandingkan, supaya pesan penolakan bisa menyebut keduanya. */
export type HasilPeriksaStatistikLembaga = {
  totalSiswa: number;
  jumlahPerBidangKerja: number;
  sah: boolean;
};

/** Total siswa = jumlah siswa N5 + N4 + N3 + N2 (PRD §3.3). Total ini dihitung sistem, bukan diisi. */
export function hitungTotalSiswa(perLevel: SiswaPerLevel): number {
  return LEVEL.reduce((jumlah, level) => jumlah + perLevel[level], 0);
}

/**
 * Penyimpanan statistik lembaga ditolak bila jumlah siswa per bidang kerja tidak sama dengan total siswa,
 * karena keduanya menghitung siswa yang sama (PRD §3.3).
 */
export function periksaStatistikLembaga(
  isian: IsianStatistikLembaga,
): HasilPeriksaStatistikLembaga {
  const totalSiswa = hitungTotalSiswa(isian.perLevel);
  const jumlahPerBidangKerja = isian.perBidangKerja.reduce(
    (jumlah, angka) => jumlah + angka,
    0,
  );
  return {
    totalSiswa,
    jumlahPerBidangKerja,
    sah: jumlahPerBidangKerja === totalSiswa,
  };
}
