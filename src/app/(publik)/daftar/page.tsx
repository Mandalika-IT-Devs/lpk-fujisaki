import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar akun",
};

/**
 * Halaman daftar akun calon peserta (PRD §3.1, §5.1), tujuan tombol utama "Daftar sekarang". Sampai formulir
 * membuat akun dibangun (T11), halaman ini hanya berisi judulnya (issue T10).
 */
export default function HalamanDaftarAkun() {
  return (
    <main className="wadah pt-8 pb-pad lg:pt-12 lg:pb-pad-lebar">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Daftar akun
      </h1>
    </main>
  );
}
