"use server";

import { isAPIError } from "better-auth/api";
import { z } from "zod";
import {
  kataSandiCukupPanjang,
  MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM,
  PANJANG_MINIMAL_KATA_SANDI,
} from "@/domain/akun";
import { auth } from "@/server/auth";

export type KeadaanAturUlang =
  | { hasil: "belum" }
  | { hasil: "berhasil" }
  | { hasil: "galat"; pesan: string; perluTautanBaru: boolean };

const PESAN_TAUTAN_TIDAK_BERLAKU = `Tautan atur ulang kata sandi ini tidak berlaku lagi, karena sudah lewat ${MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM} jam, sudah pernah dipakai, atau tidak lengkap. Minta tautan baru di halaman Lupa kata sandi, lalu buka tautan dari email terbaru.`;
const PESAN_KATA_SANDI_PENDEK = `Kata sandi baru kurang dari ${PANJANG_MINIMAL_KATA_SANDI} karakter. Pakai kata sandi minimal ${PANJANG_MINIMAL_KATA_SANDI} karakter.`;
const PESAN_KATA_SANDI_PANJANG =
  "Kata sandi baru terlalu panjang. Pakai kata sandi yang lebih pendek.";
const PESAN_GANGGUAN =
  "Kata sandi baru belum tersimpan karena gangguan di server. Coba lagi beberapa saat lagi; bila tetap gagal, hubungi Admin lembaga.";

const skemaAturUlang = z.object({
  token: z
    .string(PESAN_TAUTAN_TIDAK_BERLAKU)
    .min(1, PESAN_TAUTAN_TIDAK_BERLAKU),
  kataSandiBaru: z
    .string(PESAN_KATA_SANDI_PENDEK)
    .refine(kataSandiCukupPanjang, PESAN_KATA_SANDI_PENDEK),
});

/** Pegawai mengatur kata sandi baru dari tautan di email; kata sandi lama tidak berlaku lagi (PRD §5.4). */
export async function aturKataSandiBaru(
  _keadaan: KeadaanAturUlang,
  formulir: FormData,
): Promise<KeadaanAturUlang> {
  const isian = skemaAturUlang.safeParse({
    token: formulir.get("token"),
    kataSandiBaru: formulir.get("kataSandiBaru"),
  });
  if (!isian.success) {
    const masalah = isian.error.issues[0];
    return {
      hasil: "galat",
      pesan: masalah.message,
      perluTautanBaru: masalah.path[0] === "token",
    };
  }

  try {
    await auth.api.resetPassword({
      body: { token: isian.data.token, newPassword: isian.data.kataSandiBaru },
    });
  } catch (galat) {
    const kode = isAPIError(galat) ? galat.body?.code : undefined;
    if (kode === "INVALID_TOKEN" || kode === "USER_NOT_FOUND") {
      return {
        hasil: "galat",
        pesan: PESAN_TAUTAN_TIDAK_BERLAKU,
        perluTautanBaru: true,
      };
    }
    if (kode === "PASSWORD_TOO_LONG") {
      return {
        hasil: "galat",
        pesan: PESAN_KATA_SANDI_PANJANG,
        perluTautanBaru: false,
      };
    }
    console.error(galat);
    return { hasil: "galat", pesan: PESAN_GANGGUAN, perluTautanBaru: false };
  }
  return { hasil: "berhasil" };
}
