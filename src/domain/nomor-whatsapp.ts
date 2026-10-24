/**
 * Nomor WhatsApp (PRD §5.2, ▶ Keputusan OD-09). Dipakai untuk nomor WhatsApp kantor (§3.5) dan nomor WhatsApp
 * pemilik akun (§5.1).
 */

/** Hasil normalisasi beserta bentuk ternormalisasinya, supaya pesan dan penyimpanan memakai bentuk yang sama. */
export type HasilNormalisasiNomorWhatsApp = {
  sah: boolean;
  dinormalkan: string;
};

/**
 * Bentuk ternormalisasi yang sah: diawali 628 dan terdiri dari 11 sampai 14 digit, yaitu nomor HP Indonesia 10 sampai
 * 13 digit yang diawali 08. Nomor luar negeri ditolak (OD-09).
 */
const NOMOR_HP_INDONESIA = /^628\d{8,11}$/;

/**
 * Nomor dinormalkan sebelum disimpan dan dibandingkan (PRD §5.2): spasi, tanda hubung, titik, dan tanda kurung
 * dibuang, tanda + di depan dibuang, lalu awalan 0 diganti 62. Dua nomor dianggap sama bila hasil normalisasinya sama.
 */
export function normalkanNomorWhatsApp(
  nomor: string,
): HasilNormalisasiNomorWhatsApp {
  const dinormalkan = nomor
    .replace(/[\s\-.()]/g, "")
    .replace(/^\+/, "")
    .replace(/^0/, "62");
  return { sah: NOMOR_HP_INDONESIA.test(dinormalkan), dinormalkan };
}
