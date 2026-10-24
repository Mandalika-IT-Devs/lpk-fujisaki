import Link from "next/link";

/** Ditampilkan dengan status 404 untuk alamat rincian program yang tidak ada atau programnya nonaktif (PRD §4.3). */
export default function ProgramTidakDitemukan() {
  return (
    <main className="wadah pt-8 pb-pad lg:pt-12 lg:pb-pad-lebar">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Program tidak ditemukan
      </h1>
      <p className="mt-3 max-w-[60ch]">
        Program di alamat ini tidak ada atau sedang tidak dibuka.{" "}
        <Link href="/program">Lihat semua program</Link> untuk memilih program
        lain.
      </p>
    </main>
  );
}
