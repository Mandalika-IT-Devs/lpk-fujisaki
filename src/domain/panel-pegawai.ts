import { type Akun, bolehMasuk, type Peran } from "./akun";

/**
 * Menu panel pegawai dan siapa yang boleh membukanya (PRD §2.2).
 * Staf hanya membuka Pendaftaran; menu lainnya khusus Admin. Admin juga bisa melakukan semua tugas Staf.
 */
const MENU = [
  { kunci: "pendaftaran", nama: "Pendaftaran", khususAdmin: false },
  { kunci: "program", nama: "Program", khususAdmin: true },
  { kunci: "bidang-kerja", nama: "Bidang kerja", khususAdmin: true },
  { kunci: "statistik-lembaga", nama: "Statistik lembaga", khususAdmin: true },
  { kunci: "galeri", nama: "Galeri", khususAdmin: true },
  { kunci: "kontak", nama: "Kontak", khususAdmin: true },
  { kunci: "akun-pegawai", nama: "Akun pegawai", khususAdmin: true },
] as const;

export type MenuPanelPegawai = (typeof MENU)[number];
type KunciMenu = MenuPanelPegawai["kunci"];

/** Hanya pegawai aktif yang boleh membuka panel pegawai (PRD §2.2, §5.5). */
export function bolehMembukaPanelPegawai(akun: Akun): boolean {
  return akun.jenis === "pegawai" && bolehMasuk(akun);
}

export function bolehMembukaMenu(peran: Peran, kunci: KunciMenu): boolean {
  return (
    peran === "admin" ||
    MENU.some((menu) => menu.kunci === kunci && !menu.khususAdmin)
  );
}

/** Menu yang tampil untuk sebuah peran, dalam urutan tetap. */
export function menuPanelPegawai(peran: Peran): MenuPanelPegawai[] {
  return MENU.filter((menu) => bolehMembukaMenu(peran, menu.kunci));
}

export function cariMenuPanelPegawai(
  kunci: string,
): MenuPanelPegawai | undefined {
  return MENU.find((menu) => menu.kunci === kunci);
}
