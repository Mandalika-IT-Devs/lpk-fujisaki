"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, KODE_AKUN_NONAKTIF, PESAN_AKUN_NONAKTIF } from "@/server/auth";

export type KeadaanMasuk = { pesan: string | null; email: string };

const PESAN_KATA_SANDI_KOSONG = "Kata sandi belum diisi. Isi kata sandimu.";

const skemaMasuk = z.object({
  email: z.email(
    "Email belum benar. Isi dengan email akun pegawaimu, misalnya nama@contoh.com.",
  ),
  kataSandi: z.string(PESAN_KATA_SANDI_KOSONG).min(1, PESAN_KATA_SANDI_KOSONG),
});

const PESAN_SALAH =
  "Email atau kata sandi salah. Periksa lagi keduanya, lalu coba masuk kembali.";
const PESAN_GANGGUAN =
  "Masuk gagal karena gangguan di server. Coba lagi beberapa saat lagi; bila tetap gagal, hubungi Admin lembaga.";

/** Masuk pegawai dengan email dan kata sandi. Pegawai nonaktif ditolak oleh src/server/auth.ts. */
export async function masukPegawai(
  _keadaan: KeadaanMasuk,
  formulir: FormData,
): Promise<KeadaanMasuk> {
  const email = String(formulir.get("email") ?? "");
  const isian = skemaMasuk.safeParse({
    email,
    kataSandi: formulir.get("kataSandi"),
  });
  if (!isian.success) {
    return { pesan: isian.error.issues[0].message, email };
  }

  try {
    await auth.api.signInEmail({
      body: { email: isian.data.email, password: isian.data.kataSandi },
      headers: await headers(),
    });
  } catch (galat) {
    if (isAPIError(galat)) {
      const nonaktif = galat.body?.code === KODE_AKUN_NONAKTIF;
      return { pesan: nonaktif ? PESAN_AKUN_NONAKTIF : PESAN_SALAH, email };
    }
    console.error(galat);
    return { pesan: PESAN_GANGGUAN, email };
  }
  redirect("/panel");
}
