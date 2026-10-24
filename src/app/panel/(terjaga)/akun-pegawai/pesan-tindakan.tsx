import { Kabar, Peringatan } from "../../akses-pegawai";
import type { Pesan } from "./aksi";

/** Hasil tindakan terakhir di halaman Akun pegawai: kabar bila berhasil, peringatan bila ditolak atau gagal. */
export function PesanTindakan({ pesan }: { pesan: Pesan | null }) {
  if (!pesan) return null;
  if (pesan.jenis === "kabar") return <Kabar>{pesan.teks}</Kabar>;
  return <Peringatan>{pesan.teks}</Peringatan>;
}
