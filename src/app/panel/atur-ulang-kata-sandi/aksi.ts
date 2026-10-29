"use server";

import {
  type KeadaanAturKataSandi,
  PESAN_TAUTAN_ATUR_ULANG_TIDAK_BERLAKU,
  simpanKataSandiDariTautan,
} from "../kata-sandi-dari-tautan";

/** Pegawai mengatur kata sandi baru dari tautan di email lupa kata sandi (PRD §5.4). */
export async function aturKataSandiBaru(
  _keadaan: KeadaanAturKataSandi,
  formulir: FormData,
): Promise<KeadaanAturKataSandi> {
  return simpanKataSandiDariTautan(
    formulir,
    PESAN_TAUTAN_ATUR_ULANG_TIDAK_BERLAKU,
  );
}
