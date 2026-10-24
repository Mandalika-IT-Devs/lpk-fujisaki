"use server";

import { MASA_BERLAKU_TAUTAN_ATUR_KATA_SANDI_PEGAWAI_BARU_JAM } from "@/domain/akun";
import {
  type KeadaanAturKataSandi,
  simpanKataSandiDariTautan,
} from "../kata-sandi-dari-tautan";

const PESAN_TAUTAN_TIDAK_BERLAKU = `Tautan atur kata sandi ini tidak berlaku lagi, karena sudah lewat ${MASA_BERLAKU_TAUTAN_ATUR_KATA_SANDI_PEGAWAI_BARU_JAM} jam, sudah pernah dipakai, atau tidak lengkap. Minta tautan baru di halaman Lupa kata sandi, lalu buka tautan dari email terbaru.`;

/** Pegawai baru mengatur kata sandinya dari tautan di email yang dikirim saat Admin membuat akunnya (PRD §5.5). */
export async function aturKataSandiPegawaiBaru(
  _keadaan: KeadaanAturKataSandi,
  formulir: FormData,
): Promise<KeadaanAturKataSandi> {
  return simpanKataSandiDariTautan(formulir, PESAN_TAUTAN_TIDAK_BERLAKU);
}
