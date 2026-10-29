import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { type Akun, bolehMembukaHalamanAkun } from "@/domain/akun";
import { ALAMAT_MASUK } from "@/components/tautan-situs";
import { auth, keAkun } from "@/server/auth";

// Penjaga halaman akun pemilik akun di server (PRD §2.2). Setiap halaman dan Server Action akun memanggilnya sendiri,
// sama seperti penjaga panel pegawai (src/app/panel/penjaga.ts).

/** Alamat panel pegawai, tujuan pegawai yang membuka halaman akun. */
const ALAMAT_PANEL_PEGAWAI = "/panel";

export type PemilikAkunMasuk = {
  id: string;
  nama: string;
  email: string;
  emailTerverifikasi: boolean;
};

/** Akun yang sedang masuk, pegawai maupun pemilik akun, atau null bila pengunjung. */
export const bacaAkunMasuk = cache(async () => {
  const sesi = await auth.api.getSession({ headers: await headers() });
  if (!sesi) return null;
  const akun: Akun = keAkun(sesi.user);
  return {
    akun,
    id: sesi.user.id,
    nama: sesi.user.name,
    email: sesi.user.email,
    emailTerverifikasi: sesi.user.emailVerified,
  };
});

/**
 * Halaman akun hanya untuk pemilik akun. Pengunjung diarahkan ke halaman masuk, dan pegawai ke panel pegawai,
 * karena pegawai tidak punya pendaftaran.
 */
export async function pastikanPemilikAkun(): Promise<PemilikAkunMasuk> {
  const masuk = await bacaAkunMasuk();
  if (!masuk) redirect(ALAMAT_MASUK);
  if (!bolehMembukaHalamanAkun(masuk.akun)) redirect(ALAMAT_PANEL_PEGAWAI);
  const { id, nama, email, emailTerverifikasi } = masuk;
  return { id, nama, email, emailTerverifikasi };
}
