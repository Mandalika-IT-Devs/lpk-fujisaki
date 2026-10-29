/**
 * Pendaftaran: perjalanan satu orang dalam satu program, sejak formulir pendaftarannya dikirim (PRD §6.5–§6.6,
 * §7.1–§7.2, §7.6).
 */

import { type HasilPeriksaBatasUsia, periksaBatasUsia } from "./batas-usia";
import { ISIAN_WAJIB, type IsianWajib } from "./formulir-pendaftaran";
import type { RentangUsia } from "./program-dan-bidang-kerja";
import { TAHAP } from "./tahap";

/** Status pendaftaran secara keseluruhan (PRD §7.6). */
export const STATUS_PENDAFTARAN = ["Berjalan", "Ditutup", "Selesai"] as const;
export type StatusPendaftaran = (typeof STATUS_PENDAFTARAN)[number];

/** Status setiap langkah (PRD §7.2). */
export const STATUS_LANGKAH = ["Belum", "Selesai", "Tidak berlaku"] as const;
export type StatusLangkah = (typeof STATUS_LANGKAH)[number];

/** Kode semua langkah keenam tahap, dalam urutan PRD §7.1, misalnya L1.1. */
export const KODE_LANGKAH = TAHAP.flatMap(({ langkah }) =>
  langkah.map(({ kode }) => kode),
);

/**
 * Pendaftaran yang baru dibuka saat formulir pendaftaran dikirim (PRD §6.5): berstatus Berjalan di tahap 1, dan
 * semua langkah keenam tahap berstatus Belum.
 */
export function pendaftaranBaru(): {
  status: StatusPendaftaran;
  tahap: number;
  langkah: { kode: string; status: StatusLangkah }[];
} {
  return {
    status: "Berjalan",
    tahap: TAHAP[0].nomor,
    langkah: KODE_LANGKAH.map((kode) => ({ kode, status: "Belum" })),
  };
}

/**
 * Isian formulir pendaftaran yang sudah diperiksa bentuknya; isian yang belum diisi bernilai null. Bidang kerja yang
 * diminati berisi sebuah bidang kerja atau "Belum tahu", jadi null hanya bila belum dipilih.
 */
type FormulirDiperiksa = Record<IsianWajib, unknown> & {
  tanggalLahir: string | null;
};

/** Formulir yang semua isian wajibnya terisi. */
type FormulirLengkap<F> = {
  [K in keyof F]: K extends IsianWajib ? NonNullable<F[K]> : F[K];
};

type BatasUsiaMemenuhi = Extract<HasilPeriksaBatasUsia, { memenuhi: true }>;
type BatasUsiaTidakMemenuhi = Exclude<
  HasilPeriksaBatasUsia,
  { memenuhi: true }
>;

/** Syarat kirim yang tidak terpenuhi, beserta bahan pesannya (PRD §6.2). */
export type SyaratKirimGagal =
  | { syarat: "email-terverifikasi" }
  | { syarat: "isian-wajib-terisi"; belumDiisi: IsianWajib[] }
  | { syarat: "batas-usia"; batasUsia: BatasUsiaTidakMemenuhi }
  | { syarat: "satu-pendaftaran-berjalan"; nomorPendaftaran: string };

export type HasilPeriksaIsianWajib<F> =
  | { lengkap: true; formulir: FormulirLengkap<F> }
  | { lengkap: false; belumDiisi: IsianWajib[] };

/**
 * Semua isian wajib formulir pendaftaran harus terisi (PRD §6.1, §6.2), saat formulir dikirim dan saat pegawai
 * mengubah isian formulir yang sudah dikirim (§2.2, §6.5). Isian wajib yang kosong disebut dalam urutan formulir.
 */
export function periksaIsianWajib<F extends FormulirDiperiksa>(
  formulir: F,
): HasilPeriksaIsianWajib<F> {
  const belumDiisi = ISIAN_WAJIB.filter((nama) => formulir[nama] === null);
  if (belumDiisi.length > 0) return { lengkap: false, belumDiisi };
  // Semua isian wajib sudah terbukti terisi di atas.
  return { lengkap: true, formulir: formulir as FormulirLengkap<F> };
}

export type HasilPeriksaSyaratKirim<F> =
  | { boleh: true; formulir: FormulirLengkap<F>; batasUsia: BatasUsiaMemenuhi }
  | { boleh: false; gagal: SyaratKirimGagal[] };

/**
 * Formulir pendaftaran hanya bisa dikirim bila (PRD §6.2):
 * 1. email pemilik akun sudah diverifikasi;
 * 2. semua isian wajib terisi (bentuknya sudah diperiksa lebih dulu);
 * 3. usia pada tanggal kirim WIB memenuhi batas usia program yang dipilih (§6.3);
 * 4. akun itu tidak punya pendaftaran berstatus Berjalan (§6.6).
 *
 * Setiap syarat yang tidak terpenuhi disebut sendiri, dalam urutan di atas. Batas usia hanya bisa diperiksa bila
 * tanggal lahir dan program sudah diisi.
 */
export function periksaSyaratKirim<F extends FormulirDiperiksa>(keadaan: {
  emailTerverifikasi: boolean;
  formulir: F;
  /** Batas usia program yang dipilih, atau null bila program belum dipilih. */
  rentangUsia: RentangUsia | null;
  dikirimPada: Date;
  /** Nomor pendaftaran Berjalan milik akun itu, atau null bila tidak ada. */
  nomorPendaftaranBerjalan: string | null;
}): HasilPeriksaSyaratKirim<F> {
  const { formulir, rentangUsia } = keadaan;
  const gagal: SyaratKirimGagal[] = [];

  if (!keadaan.emailTerverifikasi)
    gagal.push({ syarat: "email-terverifikasi" });

  const isianWajib = periksaIsianWajib(formulir);
  if (!isianWajib.lengkap) {
    gagal.push({
      syarat: "isian-wajib-terisi",
      belumDiisi: isianWajib.belumDiisi,
    });
  }

  let batasUsia: HasilPeriksaBatasUsia | undefined;
  if (formulir.tanggalLahir !== null && rentangUsia !== null) {
    batasUsia = periksaBatasUsia({
      tanggalLahir: formulir.tanggalLahir,
      dikirimPada: keadaan.dikirimPada,
      ...rentangUsia,
    });
    if (!batasUsia.memenuhi) gagal.push({ syarat: "batas-usia", batasUsia });
  }

  if (keadaan.nomorPendaftaranBerjalan !== null) {
    gagal.push({
      syarat: "satu-pendaftaran-berjalan",
      nomorPendaftaran: keadaan.nomorPendaftaranBerjalan,
    });
  }

  if (gagal.length > 0 || !isianWajib.lengkap) return { boleh: false, gagal };
  // Semua isian wajib terisi, jadi tanggal lahir dan program ada; batas usia hanya belum diperiksa bila pemanggil
  // tidak memberikan rentang usia program yang dipilih.
  if (!batasUsia?.memenuhi) {
    throw new Error(
      "periksaSyaratKirim butuh rentangUsia program yang dipilih bila program sudah diisi. Baca batas usia program itu, lalu panggil lagi.",
    );
  }
  return { boleh: true, formulir: isianWajib.formulir, batasUsia };
}
