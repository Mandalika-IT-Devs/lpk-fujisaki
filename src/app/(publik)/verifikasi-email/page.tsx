import { isAPIError } from "better-auth/api";
import type { Metadata } from "next";
import { Kabar, Peringatan } from "@/app/panel/akses-pegawai";
import { ALAMAT_AKUN } from "@/components/tautan-situs";
import { TombolUtama } from "@/components/tombol";
import { MASA_BERLAKU_TAUTAN_VERIFIKASI_EMAIL_JAM } from "@/domain/akun";
import { auth } from "@/server/auth";
import { KartuAksesAkun } from "../akses-akun";

export const metadata: Metadata = { title: "Verifikasi email" };

const PESAN_TERVERIFIKASI =
  "Emailmu sudah terverifikasi. Sesudah formulir pendaftaranmu lengkap, kamu bisa mengirimnya.";
const PESAN_TIDAK_BERLAKU = `Tautan verifikasi ini tidak berlaku lagi, karena sudah lewat ${MASA_BERLAKU_TAUTAN_VERIFIKASI_EMAIL_JAM} jam atau tidak lengkap. Buka akunmu, lalu minta tautan verifikasi baru.`;
const PESAN_GANGGUAN =
  "Emailmu belum terverifikasi karena gangguan di server. Buka lagi tautan dari email beberapa saat lagi; bila tetap gagal, buka akunmu dan minta tautan baru.";

/** Memeriksa token verifikasi email dengan verifyEmail Better Auth, yang menandai emailnya terverifikasi. */
async function verifikasi(token: string): Promise<{
  berhasil: boolean;
  pesan: string;
}> {
  if (!token) return { berhasil: false, pesan: PESAN_TIDAK_BERLAKU };
  try {
    await auth.api.verifyEmail({ query: { token } });
    return { berhasil: true, pesan: PESAN_TERVERIFIKASI };
  } catch (galat) {
    if (isAPIError(galat))
      return { berhasil: false, pesan: PESAN_TIDAK_BERLAKU };
    console.error(galat);
    return { berhasil: false, pesan: PESAN_GANGGUAN };
  }
}

/**
 * Tujuan tautan di email verifikasi (src/server/auth.ts). Membuka tautan ini memverifikasi email pemilik akun
 * (PRD §5.3). Tautan yang lewat 24 jam ditolak; pemilik akun meminta tautan baru di halaman akunnya. Tautan yang
 * dibuka lagi sesudah emailnya terverifikasi tetap menampilkan bahwa email sudah terverifikasi.
 */
export default async function HalamanVerifikasiEmail({
  searchParams,
}: PageProps<"/verifikasi-email">) {
  const { token } = await searchParams;
  const hasil = await verifikasi(typeof token === "string" ? token : "");

  return (
    <KartuAksesAkun
      judul="Verifikasi email"
      pengantar="Email terverifikasi diperlukan untuk mengirim formulir pendaftaran."
    >
      {hasil.berhasil ? (
        <Kabar>{hasil.pesan}</Kabar>
      ) : (
        <Peringatan>{hasil.pesan}</Peringatan>
      )}
      <TombolUtama href={ALAMAT_AKUN}>Buka akunmu</TombolUtama>
    </KartuAksesAkun>
  );
}
