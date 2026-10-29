/**
 * Akun: pegawai dan pemilik akun (PRD §2.1, §5).
 */

/** Panjang kata sandi paling sedikit, untuk semua akun (PRD §5.1). */
export const PANJANG_MINIMAL_KATA_SANDI = 8;

/** Lama tautan verifikasi email berlaku sejak dikirim, dalam jam (PRD §5.3). */
export const MASA_BERLAKU_TAUTAN_VERIFIKASI_EMAIL_JAM = 24;

/** Lama tautan atur ulang kata sandi berlaku sejak diminta, dalam jam (PRD §5.4). */
export const MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM = 1;

/** Lama tautan atur kata sandi untuk pegawai baru berlaku sejak akunnya dibuat, dalam jam (PRD §5.5). */
export const MASA_BERLAKU_TAUTAN_ATUR_KATA_SANDI_PEGAWAI_BARU_JAM = 24;

/** Peran pegawai (PRD §2.2). */
export type Peran = "admin" | "staf";

/** Pegawai punya peran dan status aktif; pemilik akun tidak punya keduanya. */
export type Akun =
  | { jenis: "pegawai"; peran: Peran; aktif: boolean }
  | { jenis: "pemilik_akun" };

export function kataSandiCukupPanjang(kataSandi: string): boolean {
  return kataSandi.length >= PANJANG_MINIMAL_KATA_SANDI;
}

/** Pegawai nonaktif tidak bisa masuk (PRD §5.5). */
export function bolehMasuk(akun: Akun): boolean {
  return akun.jenis === "pemilik_akun" || akun.aktif;
}

/**
 * Akun calon peserta dibuat oleh pengunjung, yaitu orang yang belum masuk ke akun mana pun (PRD §2.2).
 * `akunMasuk` adalah akun yang sedang masuk, atau null bila belum ada.
 */
export function bolehMembuatAkunCalonPeserta(akunMasuk: Akun | null): boolean {
  return akunMasuk === null;
}

/**
 * Halaman akun hanya untuk pemilik akun, yang melihat pendaftarannya sendiri (PRD §2.2). Pegawai tidak punya
 * pendaftaran; mereka bekerja di panel pegawai.
 */
export function bolehMembukaHalamanAkun(akun: Akun): boolean {
  return akun.jenis === "pemilik_akun";
}

/**
 * Satu email hanya untuk satu akun, termasuk akun pegawai, dan email dibandingkan tanpa membedakan huruf besar
 * dan kecil (PRD §5.1). Email disimpan dan dicari dalam bentuk ini.
 */
export function normalkanEmail(email: string): string {
  return email.toLowerCase();
}

/** Pegawai dengan peran dan status aktifnya, seperti di daftar akun pegawai (PRD §5.5). */
export type Pegawai = { id: string; peran: Peran; aktif: boolean };

export type HasilPeriksaPerubahanPegawai =
  | { boleh: true; adminAktifSesudah: number }
  | { boleh: false; alasan: "admin-terakhir"; adminAktifSesudah: 0 };

/**
 * Sistem selalu menyisakan minimal satu Admin aktif (PRD §5.5): perubahan peran atau status seorang pegawai
 * ditolak bila sesudahnya tidak ada lagi Admin aktif. Jadi Admin terakhir tidak bisa dinonaktifkan atau
 * diturunkan menjadi Staf. Hasilnya membawa jumlah Admin aktif sesudah perubahan.
 */
export function periksaPerubahanPegawai(
  daftarPegawai: readonly Pegawai[],
  sesudah: Pegawai,
): HasilPeriksaPerubahanPegawai {
  const adminAktifSesudah = daftarPegawai
    .map((pegawai) => (pegawai.id === sesudah.id ? sesudah : pegawai))
    .filter((pegawai) => pegawai.peran === "admin" && pegawai.aktif).length;
  if (adminAktifSesudah === 0) {
    return { boleh: false, alasan: "admin-terakhir", adminAktifSesudah: 0 };
  }
  return { boleh: true, adminAktifSesudah };
}
