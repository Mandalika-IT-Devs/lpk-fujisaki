"use server";

import {
  type KeadaanAturKataSandi,
  PESAN_TAUTAN_ATUR_ULANG_TIDAK_BERLAKU,
  simpanKataSandiDariTautan,
} from "@/app/panel/kata-sandi-dari-tautan";

const PESAN_GANGGUAN =
  "Kata sandi baru belum tersimpan karena gangguan di server. Coba lagi beberapa saat lagi; bila tetap gagal, hubungi lembaga lewat halaman Kontak.";

/**
 * Pemilik akun mengatur kata sandi baru dari tautan di email lupa kata sandi (PRD §5.4). Sama dengan aksi atur ulang
 * pegawai, kecuali pesan gangguan server yang menunjuk halaman Kontak.
 */
export async function aturKataSandiBaruAkun(
  _keadaan: KeadaanAturKataSandi,
  formulir: FormData,
): Promise<KeadaanAturKataSandi> {
  return simpanKataSandiDariTautan(
    formulir,
    PESAN_TAUTAN_ATUR_ULANG_TIDAK_BERLAKU,
    PESAN_GANGGUAN,
  );
}
