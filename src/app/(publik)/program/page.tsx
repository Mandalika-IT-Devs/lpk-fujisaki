import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { CabangProgram } from "@/components/cabang-program";
import { daftarBidangKerjaDiSitusPublik } from "@/server/bidang-kerja";
import { daftarProgramDiSitusPublik } from "@/server/program";

export const metadata: Metadata = {
  title: "Program",
  description:
    "Program pelatihan menuju Jepang di LPKS Fujisaki Gakuin Center, batas usianya, dan bidang kerja yang bisa kamu pilih.",
};

const JUDUL_BAGIAN =
  "max-w-[22ch] font-papan text-headline-bagian text-balance lg:text-headline-bagian-lebar";

/** Tulang garis di samping daftar program: sisi kiri di HP, sisi kanan di layar lebar. */
const TULANG_GARIS =
  "relative pl-15 before:absolute before:inset-y-0 before:left-4.5 before:w-tebal-jalur before:bg-jalur lg:pr-14 lg:pl-0 lg:before:right-0 lg:before:left-auto";

/**
 * Halaman Program (PRD §3.1): program aktif sebagai cabang dari garis jalur, dan bidang kerja aktif.
 * Program dan bidang kerja yang nonaktif tidak tampil (PRD §4.3). Isinya dibaca dari database pada setiap
 * permintaan, jadi perubahan Admin langsung terlihat.
 */
export default async function HalamanProgram() {
  await connection();
  const [daftarProgram, daftarBidangKerja] = await Promise.all([
    daftarProgramDiSitusPublik(),
    daftarBidangKerjaDiSitusPublik(),
  ]);

  return (
    <main className="wadah pt-8 pb-pad lg:pt-12 lg:pb-pad-lebar">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Program
      </h1>
      <p className="mt-3 max-w-[60ch] text-teks-2">
        Setiap program bercabang dari jalur yang sama dan melewati enam tahap
        yang sama, dari pendaftaran di Cilacap sampai berangkat ke Jepang.
        Tahap-tahapnya ada di <Link href="/alur-program">Alur Program</Link>.
      </p>
      {daftarProgram.length > 0 ? (
        <div className={`mt-7 ${TULANG_GARIS}`}>
          <CabangProgram daftar={daftarProgram} tingkatJudul={2} />
        </div>
      ) : (
        <p className="mt-7 max-w-[60ch]">
          Belum ada program yang dibuka saat ini. Tanyakan program berikutnya ke
          kantor lembaga di Kesugihan, Cilacap.
        </p>
      )}
      {daftarBidangKerja.length > 0 && (
        <section
          aria-labelledby="judul-bidang-kerja"
          className="mt-12 lg:mt-16"
        >
          <h2 id="judul-bidang-kerja" className={JUDUL_BAGIAN}>
            Bidang kerja
          </h2>
          <p className="mt-3 max-w-[60ch] text-teks-2">
            Bidang kerja di Jepang yang bisa kamu pilih saat mendaftar.
          </p>
          <ul className="mt-4 max-w-[46ch]">
            {daftarBidangKerja.map(({ id, nama }) => (
              <li
                key={id}
                className="border-t border-garis py-2 first:border-t-0"
              >
                {nama}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
