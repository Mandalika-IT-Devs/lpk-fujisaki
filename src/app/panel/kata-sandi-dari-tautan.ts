import { isAPIError } from "better-auth/api";
import { z } from "zod";
import {
  kataSandiCukupPanjang,
  MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM,
  PANJANG_MINIMAL_KATA_SANDI,
} from "@/domain/akun";
import { auth } from "@/server/auth";

// Menyimpan kata sandi dari tautan di email. Dipakai dua halaman yang tautannya berbeda masa berlakunya:
// atur ulang kata sandi (PRD §5.4, 1 jam) dan atur kata sandi pegawai baru (PRD §5.5, 24 jam).
// Token keduanya diperiksa resetPassword Better Auth (src/server/auth.ts).

export type KeadaanAturKataSandi =
  | { hasil: "belum" }
  | { hasil: "berhasil" }
  | { hasil: "galat"; pesan: string; perluTautanBaru: boolean };

const PESAN_KATA_SANDI_PENDEK = `Kata sandi baru kurang dari ${PANJANG_MINIMAL_KATA_SANDI} karakter. Pakai kata sandi minimal ${PANJANG_MINIMAL_KATA_SANDI} karakter.`;
const PESAN_KATA_SANDI_PANJANG =
  "Kata sandi baru terlalu panjang. Pakai kata sandi yang lebih pendek.";
/** Pesan tautan atur ulang kata sandi (PRD §5.4) yang ditolak, untuk halaman atur ulang pegawai dan pemilik akun. */
export const PESAN_TAUTAN_ATUR_ULANG_TIDAK_BERLAKU = `Tautan atur ulang kata sandi ini tidak berlaku lagi, karena sudah lewat ${MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM} jam, sudah pernah dipakai, atau tidak lengkap. Minta tautan baru di halaman Lupa kata sandi, lalu buka tautan dari email terbaru.`;
const PESAN_GANGGUAN =
  "Kata sandi baru belum tersimpan karena gangguan di server. Coba lagi beberapa saat lagi; bila tetap gagal, hubungi Admin lembaga.";

/**
 * Pegawai atau pemilik akun menyimpan kata sandi dari tautan di email; kata sandi lama, bila ada, tidak berlaku lagi.
 * `pesanTautanTidakBerlaku` menyebut masa berlaku tautan halaman pemakainya. `pesanGangguan` menyebut ke mana
 * meminta bantuan bila server gangguan; bawaannya untuk pegawai.
 */
export async function simpanKataSandiDariTautan(
  formulir: FormData,
  pesanTautanTidakBerlaku: string,
  pesanGangguan: string = PESAN_GANGGUAN,
): Promise<KeadaanAturKataSandi> {
  const isian = z
    .object({
      token: z.string(pesanTautanTidakBerlaku).min(1, pesanTautanTidakBerlaku),
      kataSandiBaru: z
        .string(PESAN_KATA_SANDI_PENDEK)
        .refine(kataSandiCukupPanjang, PESAN_KATA_SANDI_PENDEK),
    })
    .safeParse({
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
        pesan: pesanTautanTidakBerlaku,
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
    return { hasil: "galat", pesan: pesanGangguan, perluTautanBaru: false };
  }
  return { hasil: "berhasil" };
}
