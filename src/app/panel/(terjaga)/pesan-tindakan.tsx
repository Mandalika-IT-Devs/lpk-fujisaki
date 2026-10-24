import { Kabar, Peringatan } from "../akses-pegawai";

/** Hasil sebuah tindakan di panel pegawai: kabar bila berhasil, peringatan bila ditolak atau gagal. */
export type Pesan = { jenis: "kabar" | "peringatan"; teks: string };

/** Hasil tindakan terakhir di halaman kelola panel pegawai. */
export function PesanTindakan({ pesan }: { pesan: Pesan | null }) {
  if (!pesan) return null;
  if (pesan.jenis === "kabar") return <Kabar>{pesan.teks}</Kabar>;
  return <Peringatan>{pesan.teks}</Peringatan>;
}
