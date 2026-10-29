"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Pesan } from "@/app/panel/(terjaga)/pesan-tindakan";
import { ALAMAT_MASUK } from "@/components/tautan-situs";
import { MASA_BERLAKU_TAUTAN_VERIFIKASI_EMAIL_JAM } from "@/domain/akun";
import { auth, kirimTautanVerifikasiEmail } from "@/server/auth";
import { kirimEmail } from "@/server/email";
import { pastikanPemilikAkun } from "../penjaga-akun";

export type KeadaanKirimUlang = { pesan: Pesan | null };

/** Keluar dari akun: sesi dihapus, lalu kembali ke halaman masuk. */
export async function keluarAkun() {
  await auth.api.signOut({ headers: await headers() });
  redirect(ALAMAT_MASUK);
}

/**
 * Pemilik akun yang emailnya belum terverifikasi meminta tautan verifikasi baru (PRD §5.3). Tautan baru berlaku
 * 24 jam sejak dikirim.
 */
export async function kirimUlangTautanVerifikasi(): Promise<KeadaanKirimUlang> {
  const pemilikAkun = await pastikanPemilikAkun();
  if (pemilikAkun.emailTerverifikasi) {
    return {
      pesan: {
        jenis: "kabar",
        teks: "Emailmu sudah terverifikasi, jadi tidak perlu tautan baru.",
      },
    };
  }

  try {
    await kirimTautanVerifikasiEmail({ auth, kirimEmail }, pemilikAkun);
  } catch (galat) {
    console.error(galat);
    return {
      pesan: {
        jenis: "peringatan",
        teks: "Tautan verifikasi baru belum terkirim karena gangguan di server. Coba lagi beberapa saat lagi; bila tetap gagal, hubungi lembaga lewat halaman Kontak.",
      },
    };
  }
  return {
    pesan: {
      jenis: "kabar",
      teks: `Tautan verifikasi baru sudah kami kirim ke ${pemilikAkun.email}. Tautan berlaku ${MASA_BERLAKU_TAUTAN_VERIFIKASI_EMAIL_JAM} jam. Bila email belum masuk dalam beberapa menit, periksa folder spam.`,
    },
  };
}
