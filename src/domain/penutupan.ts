/**
 * Penutupan: berakhirnya sebuah pendaftaran sebelum berangkat (PRD §7.5).
 */

import type { StatusPendaftaran } from "./pendaftaran";
import { TAHAP } from "./tahap";

/** Alasan penutupan, dalam urutan PRD §7.5. */
export const ALASAN_PENUTUPAN = [
  "Tidak lolos seleksi",
  "Mundur",
  "Dikeluarkan",
] as const;
export type AlasanPenutupan = (typeof ALASAN_PENUTUPAN)[number];

/** Tidak lolos seleksi hanya untuk tahap pendaftaran dan seleksi (PRD §7.5). */
const TAHAP_SELEKSI = TAHAP[0].nomor;

/** Alasan penutupan yang bisa dipilih untuk pendaftaran di sebuah tahap: Tidak lolos seleksi hanya di tahap 1. */
export function alasanPenutupanDiTahap(tahap: number): AlasanPenutupan[] {
  return ALASAN_PENUTUPAN.filter(
    (alasan) => alasan !== "Tidak lolos seleksi" || tahap === TAHAP_SELEKSI,
  );
}

/**
 * Hanya pendaftaran Berjalan yang bisa ditutup (PRD §7.5). Pendaftaran yang Ditutup tidak bisa dibuka kembali atau
 * ditutup lagi, dan yang Selesai tidak bisa ditutup (§7.6).
 */
export function bisaDitutup(status: StatusPendaftaran): boolean {
  return status === "Berjalan";
}

/** Syarat penutupan yang tidak terpenuhi, beserta bahan pesannya. */
export type PenutupanGagal =
  | { syarat: "status-berjalan"; status: StatusPendaftaran }
  | { syarat: "alasan-dipilih" }
  | { syarat: "alasan-sesuai-tahap"; alasan: AlasanPenutupan; tahap: number }
  | { syarat: "keterangan-diisi" };

export type HasilPeriksaPenutupan =
  | { boleh: true; alasan: AlasanPenutupan; keterangan: string }
  | { boleh: false; gagal: PenutupanGagal[] };

/**
 * Pegawai bisa menutup pendaftaran yang berstatus Berjalan (PRD §7.5) dengan:
 * - alasan Tidak lolos seleksi (hanya di tahap 1), Mundur, atau Dikeluarkan;
 * - keterangan wajib berupa teks; keterangan yang hanya berisi spasi dianggap kosong.
 *
 * Pendaftaran yang Ditutup tidak bisa dibuka kembali atau ditutup lagi, dan yang Selesai tidak bisa ditutup (§7.6).
 * Untuk pendaftaran Berjalan, setiap syarat yang tidak terpenuhi disebut sendiri. Bila boleh, hasilnya membawa
 * keterangan yang sudah dirapikan.
 */
export function periksaPenutupan(keadaan: {
  status: StatusPendaftaran;
  tahap: number;
  /** Alasan yang dipilih, atau null bila belum dipilih. */
  alasan: AlasanPenutupan | null;
  keterangan: string;
}): HasilPeriksaPenutupan {
  const { status, tahap, alasan } = keadaan;
  // Alasan dan keterangan tidak berarti untuk pendaftaran yang sudah berakhir, jadi hanya syarat ini yang disebut.
  if (!bisaDitutup(status)) {
    return { boleh: false, gagal: [{ syarat: "status-berjalan", status }] };
  }

  const keterangan = keadaan.keterangan.trim();
  const gagal: PenutupanGagal[] = [];
  if (alasan === null) gagal.push({ syarat: "alasan-dipilih" });
  else if (!alasanPenutupanDiTahap(tahap).includes(alasan)) {
    gagal.push({ syarat: "alasan-sesuai-tahap", alasan, tahap });
  }
  if (keterangan === "") gagal.push({ syarat: "keterangan-diisi" });

  if (alasan === null || gagal.length > 0) return { boleh: false, gagal };
  return { boleh: true, alasan, keterangan };
}
