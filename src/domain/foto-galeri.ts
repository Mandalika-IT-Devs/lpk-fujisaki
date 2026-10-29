/**
 * Syarat unggah foto galeri (PRD §3.4). Dipakai di formulir unggah, lalu diperiksa ulang di server.
 */

/** Jenis berkas yang diterima: JPG, PNG, atau WebP. */
export const JENIS_BERKAS_FOTO_GALERI: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/** Ukuran paling besar 5 MB, yaitu 5 × 1.048.576 = 5.242.880 byte. */
export const UKURAN_PALING_BESAR_FOTO_GALERI_BYTE = 5 * 1_048_576;

/** Syarat yang tidak terpenuhi, dalam urutan format, ukuran, persetujuan. */
export type AlasanPenolakanFotoGaleri = "format" | "ukuran" | "persetujuan";

export type IsianUnggahFotoGaleri = {
  /** Jenis MIME berkas, misalnya image/jpeg. */
  jenisBerkas: string;
  ukuranByte: number;
  /** Centang "Orang di foto sudah setuju fotonya dipublikasikan". */
  persetujuanOrangDiFoto: boolean;
};

/** Hasil pemeriksaan beserta semua syarat yang tidak terpenuhi, supaya setiap alasan bisa disebut. */
export type HasilPeriksaUnggahFotoGaleri = {
  diterima: boolean;
  alasan: AlasanPenolakanFotoGaleri[];
};

/**
 * Foto galeri diterima bila formatnya JPG, PNG, atau WebP, ukurannya paling besar 5.242.880 byte, dan centang
 * persetujuan orang di foto terisi (PRD §3.4). Bila beberapa syarat gagal, semua alasannya disebut.
 */
export function periksaSyaratUnggahFotoGaleri(
  isian: IsianUnggahFotoGaleri,
): HasilPeriksaUnggahFotoGaleri {
  const alasan: AlasanPenolakanFotoGaleri[] = [];
  if (!JENIS_BERKAS_FOTO_GALERI.includes(isian.jenisBerkas)) {
    alasan.push("format");
  }
  if (isian.ukuranByte > UKURAN_PALING_BESAR_FOTO_GALERI_BYTE) {
    alasan.push("ukuran");
  }
  if (!isian.persetujuanOrangDiFoto) alasan.push("persetujuan");
  return { diterima: alasan.length === 0, alasan };
}
