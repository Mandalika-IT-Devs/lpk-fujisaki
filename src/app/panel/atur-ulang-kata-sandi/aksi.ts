"use server";

import { MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM } from "@/domain/akun";
import {
  type KeadaanAturKataSandi,
  simpanKataSandiDariTautan,
} from "../kata-sandi-dari-tautan";

const PESAN_TAUTAN_TIDAK_BERLAKU = `Tautan atur ulang kata sandi ini tidak berlaku lagi, karena sudah lewat ${MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM} jam, sudah pernah dipakai, atau tidak lengkap. Minta tautan baru di halaman Lupa kata sandi, lalu buka tautan dari email terbaru.`;

/** Pegawai mengatur kata sandi baru dari tautan di email lupa kata sandi (PRD §5.4). */
export async function aturKataSandiBaru(
  _keadaan: KeadaanAturKataSandi,
  formulir: FormData,
): Promise<KeadaanAturKataSandi> {
  return simpanKataSandiDariTautan(formulir, PESAN_TAUTAN_TIDAK_BERLAKU);
}
