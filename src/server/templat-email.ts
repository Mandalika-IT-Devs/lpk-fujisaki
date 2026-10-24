import { MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM } from "@/domain/akun";
import type { Email } from "./email";

/** Email atur ulang kata sandi (PRD §5.4), berisi tautan yang berlaku 1 jam. */
export function templatAturUlangKataSandi({
  nama,
  tautan,
}: {
  nama: string;
  tautan: string;
}): Omit<Email, "kepada"> {
  return {
    subjek: "Atur ulang kata sandi",
    teks: [
      `Halo ${nama},`,
      "",
      "Kami menerima permintaan untuk mengatur ulang kata sandi akunmu di LPKS Fujisaki Gakuin Center. Buka tautan berikut untuk mengatur kata sandi baru:",
      "",
      tautan,
      "",
      `Tautan ini berlaku ${MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM} jam. Sesudah itu, minta tautan baru lewat halaman Lupa kata sandi.`,
      "",
      "Bila kamu tidak meminta atur ulang kata sandi, abaikan email ini. Kata sandimu tidak berubah.",
      "",
      "LPKS Fujisaki Gakuin Center",
    ].join("\n"),
  };
}
