// Cara menulis angka dan tanggal di tampilan, mengikuti kebiasaan Indonesia.

import { tanggalWib } from "@/domain/waktu-wib";

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

/** Tanggal WIB sebuah instan sebagai DD-MM-YYYY, misalnya saat formulir pendaftaran dikirim. */
export function formatTanggalWib(instan: Date): string {
  const { tahun, bulan, hari } = tanggalWib(instan);
  const dua = (angka: number) => String(angka).padStart(2, "0");
  return `${dua(hari)}-${dua(bulan)}-${tahun}`;
}
