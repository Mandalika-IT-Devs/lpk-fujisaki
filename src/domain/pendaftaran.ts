/**
 * Pendaftaran: perjalanan satu orang dalam satu program, sejak formulir pendaftarannya dikirim (PRD §6.5–§6.6,
 * §7.1–§7.2, §7.6).
 */

import {
  type HasilPeriksaBatasUsia,
  periksaBatasUsia,
  tanggalLahirBenar,
} from "./batas-usia";
import { ISIAN_WAJIB, type IsianWajib } from "./formulir-pendaftaran";
import type { RentangUsia } from "./program-dan-bidang-kerja";
import { TAHAP } from "./tahap";
import { tanggalWib, tulisTanggal } from "./waktu-wib";

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

/**
 * Alasan tanggal lahir ditolak saat pegawai mengubah isian: jatuh sesudah hari ini (§6.3), atau tidak sesudah hari ini
 * tetapi jatuh sesudah tanggal kirim pendaftaran itu (§11.2), beserta tanggal kirim WIB-nya (YYYY-MM-DD).
 */
export type TanggalLahirDitolak =
  | { alasan: "sesudah-hari-ini" }
  | { alasan: "sesudah-tanggal-kirim"; tanggalKirimWib: string };

export type HasilPeriksaUbahIsian<F> =
  | { sah: true; formulir: FormulirLengkap<F> }
  | {
      sah: false;
      belumDiisi: IsianWajib[];
      /** Alasan tanggal lahir ditolak, atau null bila tanggal lahirnya benar atau belum diisi. */
      tanggalLahirDitolak: TanggalLahirDitolak | null;
    };

function periksaTanggalLahirUbahIsian(
  tanggalLahir: string | null,
  waktu: { sekarang: Date; dikirimPada: Date },
): TanggalLahirDitolak | null {
  if (tanggalLahir === null) return null;
  if (!tanggalLahirBenar(tanggalLahir, waktu.sekarang)) {
    return { alasan: "sesudah-hari-ini" };
  }
  if (!tanggalLahirBenar(tanggalLahir, waktu.dikirimPada)) {
    return {
      alasan: "sesudah-tanggal-kirim",
      tanggalKirimWib: tulisTanggal(tanggalWib(waktu.dikirimPada)),
    };
  }
  return null;
}

/**
 * Pegawai mengubah isian formulir pendaftaran yang sudah dikirim (PRD §2.2, §6.5) dengan pemeriksaan yang sama seperti
 * formulir pemilik akun: semua isian wajib terisi (§6.1), dan tanggal lahir tidak jatuh sesudah hari ini (WIB), sama
 * seperti tanggal lahir yang tidak benar saat formulir dikirim (§6.3). Tanggal lahir juga tidak boleh jatuh sesudah
 * tanggal kirim WIB pendaftaran itu, karena orang itu belum lahir saat pendaftarannya dikirim (§11.2, ▶ Keputusan
 * 2026-10-30); tanggal lahir tepat pada tanggal kirim boleh. Usia di luar rentang batas usia program tidak menolak
 * perubahan; pegawai hanya diberi peringatan (peringatanBatasUsiaUbahIsian, §11.2). Bila ditolak, hasilnya menyebut
 * isian wajib yang belum diisi dan alasan tanggal lahirnya ditolak.
 */
export function periksaUbahIsian<F extends FormulirDiperiksa>(
  formulir: F,
  waktu: {
    sekarang: Date;
    /** Saat formulir pendaftaran itu dikirim. */
    dikirimPada: Date;
  },
): HasilPeriksaUbahIsian<F> {
  const isianWajib = periksaIsianWajib(formulir);
  const tanggalLahirDitolak = periksaTanggalLahirUbahIsian(
    formulir.tanggalLahir,
    waktu,
  );
  if (isianWajib.lengkap && tanggalLahirDitolak === null) {
    return { sah: true, formulir: isianWajib.formulir };
  }
  return {
    sah: false,
    belumDiisi: isianWajib.lengkap ? [] : isianWajib.belumDiisi,
    tanggalLahirDitolak,
  };
}

/** Tanggal lahir dan program pada isian formulir sebuah pendaftaran. */
type IsianBatasUsia = { tanggalLahir: string; programId: number };

/** Peringatan batas usia untuk pegawai: usia di luar rentang, beserta usia dan rentang usia programnya. */
export type PeringatanBatasUsia = RentangUsia &
  Extract<BatasUsiaTidakMemenuhi, { usia: number }>;

/**
 * Saat pegawai mengubah tanggal lahir atau program sebuah pendaftaran, batas usia program sesudah diubah (§6.3)
 * diperiksa terhadap tanggal kirim pendaftaran itu (PRD §11.2, ▶ Keputusan 2026-10-30). Bila usia di luar rentang,
 * hasilnya peringatan beserta usia dan rentangnya; perubahan tetap boleh disimpan. Tanpa peringatan bila usia di dalam
 * rentang, atau bila tanggal lahir dan program tidak berubah. Tanggal lahir yang jatuh sesudah tanggal kirim tidak
 * sampai ke sini, karena perubahan itu sudah ditolak periksaUbahIsian.
 */
export function peringatanBatasUsiaUbahIsian(keadaan: {
  /** Tanggal lahir dan program yang tersimpan sebelum diubah. */
  tersimpan: IsianBatasUsia;
  /** Tanggal lahir dan program sesudah diubah. */
  diubah: IsianBatasUsia;
  /** Batas usia program sesudah diubah. */
  rentangUsia: RentangUsia;
  /** Saat formulir pendaftaran itu dikirim. */
  dikirimPada: Date;
}): PeringatanBatasUsia | null {
  const { tersimpan, diubah } = keadaan;
  if (
    diubah.tanggalLahir === tersimpan.tanggalLahir &&
    diubah.programId === tersimpan.programId
  ) {
    return null;
  }
  const batasUsia = periksaBatasUsia({
    tanggalLahir: diubah.tanggalLahir,
    dikirimPada: keadaan.dikirimPada,
    ...keadaan.rentangUsia,
  });
  if (batasUsia.memenuhi) return null;
  if (batasUsia.alasan === "tanggal-lahir-tidak-benar") {
    throw new Error(
      "peringatanBatasUsiaUbahIsian butuh tanggal lahir yang tidak jatuh sesudah tanggal kirim. Periksa perubahannya dengan periksaUbahIsian lebih dulu, lalu panggil lagi hanya bila perubahan itu sah.",
    );
  }
  return { ...keadaan.rentangUsia, ...batasUsia };
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

/**
 * Pengiriman yang ditolak menyimpan isian formulir pendaftarannya sebagai draf, supaya isian itu tidak hilang (PRD
 * §6.2, ▶ Keputusan 2026-10-30), misalnya bila email belum terverifikasi atau usia di luar rentang. Kecualinya: selama
 * akun itu punya pendaftaran Berjalan, isian formulirnya terkunci (§6.5), jadi tidak ada draf yang disimpan.
 * `gagal` adalah syarat kirim yang gagal; bentuk setiap isian yang terisi sudah diperiksa lebih dulu, dan isian yang
 * bentuknya salah tidak pernah sampai ke pemeriksaan syarat kirim.
 */
export function drafDisimpanSaatDitolak(
  gagal: readonly SyaratKirimGagal[],
): boolean {
  return !gagal.some(({ syarat }) => syarat === "satu-pendaftaran-berjalan");
}

/**
 * Isian awal formulir pendaftaran pemilik akun (PRD §6.2, §6.6): draf yang pernah disimpan, atau, bila belum ada
 * draf, isian pendaftaran Ditutup miliknya yang paling baru dikirim, supaya ia bisa mendaftar ulang dari isian lama.
 * Draf lebih dulu dipakai, karena draf hanya bisa disimpan sesudah pendaftaran terakhirnya ditutup (draf dihapus saat
 * formulir dikirim), jadi draf selalu lebih baru daripada isian lama. Tanpa keduanya, tidak ada isian awal.
 */
export function isianAwalFormulirPendaftaran<I>(keadaan: {
  draf: I | undefined;
  pendaftaran: readonly {
    status: StatusPendaftaran;
    dikirimPada: Date;
    isian: I;
  }[];
}): I | undefined {
  if (keadaan.draf !== undefined) return keadaan.draf;
  const [terbaru] = keadaan.pendaftaran
    .filter(({ status }) => status === "Ditutup")
    .toSorted((a, b) => b.dikirimPada.getTime() - a.dikirimPada.getTime());
  return terbaru?.isian;
}
