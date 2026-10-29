"use server";

import { z } from "zod";
import type { KeadaanLupaKataSandi } from "@/app/panel/lupa-kata-sandi/aksi";
import { MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM } from "@/domain/akun";
import { auth } from "@/server/auth";

const skemaPermintaan = z.object({
  email: z.email(
    "Email belum benar. Isi dengan email akunmu, misalnya nama@contoh.com.",
  ),
});

// Sama untuk email terdaftar dan tidak terdaftar, supaya halaman ini tidak membuka email mana yang punya akun.
const PESAN_DIPROSES = `Bila email itu terdaftar, tautan atur ulang kata sandi sudah kami kirim ke sana. Tautan berlaku ${MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM} jam. Bila email belum masuk dalam beberapa menit, periksa folder spam, lalu minta tautan lagi.`;

/**
 * Pemilik akun meminta tautan atur ulang kata sandi lewat email (PRD §5.4). Halaman ini terbuka untuk siapa pun.
 * Tautannya menuju halaman atur ulang sesuai jenis akun pemilik email itu (src/server/auth.ts).
 */
export async function mintaTautanAturUlangAkun(
  _keadaan: KeadaanLupaKataSandi,
  formulir: FormData,
): Promise<KeadaanLupaKataSandi> {
  const email = String(formulir.get("email") ?? "");
  const isian = skemaPermintaan.safeParse({ email });
  if (!isian.success) {
    return { hasil: "galat", pesan: isian.error.issues[0].message, email };
  }

  try {
    await auth.api.requestPasswordReset({ body: { email: isian.data.email } });
  } catch (galat) {
    // Kegagalan kirim hanya bisa terjadi untuk email terdaftar, jadi tidak ditampilkan: pesannya tetap sama.
    console.error(galat);
  }
  return { hasil: "diproses", pesan: PESAN_DIPROSES, email };
}
