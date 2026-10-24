import type { Metadata } from "next";
import { connection } from "next/server";
import { GaleriFoto } from "@/components/galeri-foto";
import { daftarFotoGaleri } from "@/server/foto-galeri";

export const metadata: Metadata = {
  title: "Galeri",
  description:
    "Foto kegiatan di LPKS Fujisaki Gakuin Center, Kesugihan, Cilacap.",
};

/**
 * Halaman Galeri (PRD §3.1, §3.4): semua foto kegiatan, terbaru di atas. Fotonya dikelola Admin dan dibaca dari
 * database pada setiap permintaan, jadi foto yang diunggah atau dihapus langsung terlihat. Tanpa foto, tampil bingkai
 * kosong berlabel seperti di prototipe (OD-06).
 */
export default async function HalamanGaleri() {
  await connection();
  const daftar = await daftarFotoGaleri();

  return (
    <main className="wadah pt-8 pb-pad lg:pt-12 lg:pb-pad-lebar">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Galeri
      </h1>
      <p className="mt-3 max-w-[60ch] text-teks-2">
        {daftar.length > 0
          ? "Foto kegiatan di lembaga, terbaru di atas."
          : "Foto kegiatan tampil di sini setelah lembaga memilih foto yang orangnya sudah setuju dipublikasikan."}
      </p>
      <GaleriFoto
        daftar={daftar}
        sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
        className="mt-7 grid gap-x-3 gap-y-6 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-x-7"
      />
    </main>
  );
}
