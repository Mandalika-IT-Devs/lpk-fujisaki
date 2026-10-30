/**
 * Tanggal WIB sebuah instan. Semua tanggal dan jam di PRD memakai WIB (UTC+7), misalnya tanggal kirim untuk batas
 * usia (§6.3) dan tahun nomor pendaftaran (§6.4).
 */

/** WIB adalah UTC+7 sepanjang tahun, tanpa waktu musim panas. */
const SELISIH_WIB_MILIDETIK = 7 * 60 * 60 * 1000;

/** Tanggal kalender, tanpa jam dan zona waktu. */
export type Tanggal = { tahun: number; bulan: number; hari: number };

/** Tanggal kalender WIB sebuah instan. */
export function tanggalWib(instan: Date): Tanggal {
  const wib = new Date(instan.getTime() + SELISIH_WIB_MILIDETIK);
  return {
    tahun: wib.getUTCFullYear(),
    bulan: wib.getUTCMonth() + 1,
    hari: wib.getUTCDate(),
  };
}

/** Tanggal kalender sebagai YYYY-MM-DD, misalnya tanggal kirim WIB yang dibawa hasil hitung sebagai bahannya. */
export function tulisTanggal({ tahun, bulan, hari }: Tanggal): string {
  const dua = (angka: number) => String(angka).padStart(2, "0");
  return `${String(tahun).padStart(4, "0")}-${dua(bulan)}-${dua(hari)}`;
}
