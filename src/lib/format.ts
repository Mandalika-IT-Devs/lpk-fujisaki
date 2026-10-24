// Cara menulis angka dan tanggal di tampilan, mengikuti kebiasaan Indonesia.

const ANGKA = new Intl.NumberFormat("id-ID");

/** Bilangan bulat dengan titik pemisah ribuan, misalnya 1214 → "1.214". */
export function formatAngka(angka: number): string {
  return ANGKA.format(angka);
}

/** Tanggal kalender YYYY-MM-DD sebagai DD-MM-YYYY (docs/DESIGN.md, The Angka Tabular Rule), tanpa konversi zona waktu. */
export function formatTanggal(tanggal: string): string {
  const [tahun, bulan, hari] = tanggal.split("-");
  return `${hari}-${bulan}-${tahun}`;
}
