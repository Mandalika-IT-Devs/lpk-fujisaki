import type { Metadata } from "next";
import { headers } from "next/headers";
import { forbidden, notFound, redirect } from "next/navigation";
import { cache } from "react";
import type { Peran } from "@/domain/akun";
import {
  bolehMembukaMenu,
  bolehMembukaPanelPegawai,
  cariMenuPanelPegawai,
  type MenuPanelPegawai,
} from "@/domain/panel-pegawai";
import { auth, keAkun } from "@/server/auth";

// Penjaga akses panel pegawai di server. Setiap halaman panel memanggilnya sendiri, karena tata letak
// tidak dirender ulang saat berpindah halaman (docs Next.js, "Layouts and auth checks").

export const ALAMAT_MASUK_PEGAWAI = "/panel/masuk";

export type PegawaiMasuk = { nama: string; peran: Peran };

/** Pegawai aktif yang sedang masuk, atau null bila pengunjung, pemilik akun, atau pegawai nonaktif. */
const bacaPegawaiMasuk = cache(async (): Promise<PegawaiMasuk | null> => {
  const sesi = await auth.api.getSession({ headers: await headers() });
  if (!sesi) return null;
  const akun = keAkun(sesi.user);
  if (akun.jenis !== "pegawai" || !bolehMembukaPanelPegawai(akun)) {
    return null;
  }
  return { nama: sesi.user.name, peran: akun.peran };
});

/** Panel menolak siapa pun yang bukan pegawai aktif: mereka diarahkan ke halaman masuk pegawai. */
export async function pastikanPegawai(): Promise<PegawaiMasuk> {
  const pegawai = await bacaPegawaiMasuk();
  if (!pegawai) redirect(ALAMAT_MASUK_PEGAWAI);
  return pegawai;
}

/** Halaman menu panel: menu yang tidak dikenal tidak ada (404), menu yang bukan haknya ditolak (403). */
export async function pastikanBolehMembuka(
  kunci: string,
): Promise<MenuPanelPegawai> {
  const pegawai = await pastikanPegawai();
  const menu = cariMenuPanelPegawai(kunci);
  if (!menu) notFound();
  if (!bolehMembukaMenu(pegawai.peran, menu.kunci)) forbidden();
  return menu;
}

/**
 * Judul halaman menu panel: `judul` (bawaannya nama menu), atau "Akses ditolak" bila menu itu bukan hak pegawai
 * yang masuk. Halaman di bawah sebuah menu, misalnya Ubah program, memberi judulnya sendiri.
 */
export async function metadataMenu(
  kunci: string,
  judul?: string,
): Promise<Metadata> {
  const pegawai = await bacaPegawaiMasuk();
  const menu = cariMenuPanelPegawai(kunci);
  if (!pegawai || !menu) return {};
  const boleh = bolehMembukaMenu(pegawai.peran, menu.kunci);
  return { title: boleh ? (judul ?? menu.nama) : "Akses ditolak" };
}
