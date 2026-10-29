/**
 * Batas usia pendaftaran (PRD §6.3). Dipakai konter cek usia di Beranda, dan dipakai ulang saat formulir
 * pendaftaran dikirim.
 */

import type { RentangUsia } from "./program-dan-bidang-kerja";
import { type Tanggal, tanggalWib } from "./waktu-wib";

function kabisat(tahun: number): boolean {
  return (tahun % 4 === 0 && tahun % 100 !== 0) || tahun % 400 === 0;
}

function jumlahHari(tahun: number, bulan: number): number {
  if (bulan === 2) return kabisat(tahun) ? 29 : 28;
  return [4, 6, 9, 11].includes(bulan) ? 30 : 31;
}

/** Membaca YYYY-MM-DD; undefined bila teksnya bukan tanggal kalender, misalnya 30 Februari. */
function bacaTanggal(teks: string): Tanggal | undefined {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(teks);
  if (!cocok) return undefined;
  const [tahun, bulan, hari] = cocok.slice(1).map(Number);
  if (bulan < 1 || bulan > 12) return undefined;
  if (hari < 1 || hari > jumlahHari(tahun, bulan)) return undefined;
  return { tahun, bulan, hari };
}

function tulisTanggal({ tahun, bulan, hari }: Tanggal): string {
  const dua = (angka: number) => String(angka).padStart(2, "0");
  return `${String(tahun).padStart(4, "0")}-${dua(bulan)}-${dua(hari)}`;
}

function sebelum(a: Tanggal, b: Tanggal): boolean {
  if (a.tahun !== b.tahun) return a.tahun < b.tahun;
  if (a.bulan !== b.bulan) return a.bulan < b.bulan;
  return a.hari < b.hari;
}

/** Ulang tahun pada sebuah tahun. Lahir 29 Februari berulang tahun pada 1 Maret di tahun bukan kabisat. */
function ulangTahun(lahir: Tanggal, tahun: number): Tanggal {
  if (lahir.bulan === 2 && lahir.hari === 29 && !kabisat(tahun)) {
    return { tahun, bulan: 3, hari: 1 };
  }
  return { tahun, bulan: lahir.bulan, hari: lahir.hari };
}

/** Usia dalam tahun penuh pada sebuah tanggal; usia bertambah tepat pada tanggal ulang tahun. */
function hitungUsia(lahir: Tanggal, pada: Tanggal): number {
  const usia = pada.tahun - lahir.tahun;
  return sebelum(pada, ulangTahun(lahir, pada.tahun)) ? usia - 1 : usia;
}

type IsianPeriksaBatasUsia = RentangUsia & {
  /** Tanggal lahir YYYY-MM-DD. */
  tanggalLahir: string;
  /** Saat formulir dikirim; di konter cek usia, saat ini. */
  dikirimPada: Date;
};

/** Bahan hitung yang dibawa hasil, supaya tampilan bisa menyebut usia dan rentang program. */
type BahanHitungBatasUsia = RentangUsia & {
  tanggalKirimWib: string;
  usia: number;
};

export type HasilPeriksaBatasUsia =
  | (BahanHitungBatasUsia & { memenuhi: true })
  | (BahanHitungBatasUsia & {
      memenuhi: false;
      alasan: "terlalu-muda";
      /** Ulang tahun ke-(usia minimal), YYYY-MM-DD. */
      bolehMendaftarMulai: string;
    })
  | (BahanHitungBatasUsia & { memenuhi: false; alasan: "terlalu-tua" })
  | {
      memenuhi: false;
      alasan: "tanggal-lahir-tidak-benar";
      tanggalKirimWib: string;
    };

/**
 * Tanggal lahir yang benar: tanggal kalender yang tidak jatuh sesudah tanggal WIB `pada`. Hasilnya tanggal itu, atau
 * undefined bila tidak benar.
 */
function bacaTanggalLahir(teks: string, pada: Tanggal): Tanggal | undefined {
  const lahir = bacaTanggal(teks);
  return lahir && !sebelum(pada, lahir) ? lahir : undefined;
}

/**
 * Tanggal lahir YYYY-MM-DD benar bila berupa tanggal kalender dan tidak jatuh sesudah tanggal WIB `pada`, misalnya
 * tanggal formulir dikirim (§6.3), atau hari ini saat pegawai mengubah isian formulir yang sudah dikirim.
 */
export function tanggalLahirBenar(tanggalLahir: string, pada: Date): boolean {
  return bacaTanggalLahir(tanggalLahir, tanggalWib(pada)) !== undefined;
}

/**
 * Usia dihitung dalam tahun penuh pada tanggal kirim WIB, dan memenuhi syarat bila
 * usia minimal ≤ usia ≤ usia maksimal; kedua batas termasuk (PRD §6.3).
 * Bila terlalu muda, hasilnya membawa tanggal mulai boleh mendaftar: ulang tahun ke-(usia minimal).
 * Tanggal lahir yang bukan tanggal kalender, atau yang jatuh sesudah tanggal kirim, tidak benar.
 */
export function periksaBatasUsia(
  isian: IsianPeriksaBatasUsia,
): HasilPeriksaBatasUsia {
  const { usiaMinimal, usiaMaksimal } = isian;
  const tanggalKirim = tanggalWib(isian.dikirimPada);
  const tanggalKirimWib = tulisTanggal(tanggalKirim);
  const lahir = bacaTanggalLahir(isian.tanggalLahir, tanggalKirim);
  if (!lahir) {
    return {
      memenuhi: false,
      alasan: "tanggal-lahir-tidak-benar",
      tanggalKirimWib,
    };
  }

  const usia = hitungUsia(lahir, tanggalKirim);
  const bahan = { tanggalKirimWib, usia, usiaMinimal, usiaMaksimal };
  if (usia < usiaMinimal) {
    return {
      ...bahan,
      memenuhi: false,
      alasan: "terlalu-muda",
      bolehMendaftarMulai: tulisTanggal(
        ulangTahun(lahir, lahir.tahun + usiaMinimal),
      ),
    };
  }
  if (usia > usiaMaksimal) {
    return { ...bahan, memenuhi: false, alasan: "terlalu-tua" };
  }
  return { ...bahan, memenuhi: true };
}
