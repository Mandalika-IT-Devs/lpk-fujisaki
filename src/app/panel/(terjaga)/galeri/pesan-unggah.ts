import {
  type AlasanPenolakanFotoGaleri,
  UKURAN_PALING_BESAR_FOTO_GALERI_BYTE,
} from "@/domain/foto-galeri";
import { formatAngka } from "@/lib/format";

// Pesan formulir unggah foto galeri (PRD §3.4). Dipakai formulir di browser dan Server Action yang memeriksanya ulang,
// supaya keduanya menyebut alasan yang sama.

export const PESAN_BERKAS_KOSONG =
  "Berkas foto belum dipilih. Pilih foto JPG, PNG, atau WebP yang paling besar 5 MB.";

const BATAS_UKURAN = `5 MB (${formatAngka(UKURAN_PALING_BESAR_FOTO_GALERI_BYTE)} byte)`;

/**
 * Pesan penolakan yang menyebut setiap syarat yang tidak terpenuhi, dalam urutan format, ukuran, persetujuan.
 * `ukuranByte` adalah ukuran berkas yang dipilih, supaya pesan ukuran menyebut angkanya beserta batasnya.
 */
export function pesanPenolakanFoto(
  alasan: readonly AlasanPenolakanFotoGaleri[],
  ukuranByte: number,
): string {
  const pesan: Record<AlasanPenolakanFotoGaleri, string> = {
    format: "Format berkasnya tidak didukung. Pilih foto JPG, PNG, atau WebP.",
    ukuran: `Ukuran berkasnya ${formatAngka(ukuranByte)} byte, lebih besar dari batas ${BATAS_UKURAN}. Kecilkan fotonya atau pilih foto lain.`,
    persetujuan:
      "Centang persetujuan belum diisi. Unggah foto hanya bila orang di foto sudah setuju fotonya dipublikasikan, lalu centang persetujuannya.",
  };
  return ["Foto belum diunggah.", ...alasan.map((a) => pesan[a])].join(" ");
}
