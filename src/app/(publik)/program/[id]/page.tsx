import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { IkonPanahKiri } from "@/components/ikon";
import { bacaId } from "@/lib/baca-id";
import { cariProgramDiSitusPublik } from "@/server/program";

const JUDUL_BAGIAN =
  "max-w-[22ch] font-papan text-headline-bagian text-balance lg:text-headline-bagian-lebar";

/** Program aktif di alamat ini; program nonaktif atau yang tidak ada tidak tampil (PRD §4.3). */
const bacaProgram = cache(async (id: string) => {
  await connection();
  const idProgram = bacaId(id);
  return idProgram === undefined
    ? undefined
    : cariProgramDiSitusPublik(idProgram);
});

export async function generateMetadata({
  params,
}: PageProps<"/program/[id]">): Promise<Metadata> {
  const program = await bacaProgram((await params).id);
  if (!program) return { title: "Program tidak ditemukan" };
  return { title: program.nama, description: program.deskripsi };
}

/** Rincian satu program (PRD §3.1, §4.1): deskripsi, batas usia, lama pelatihan, dan syarat. */
export default async function HalamanRincianProgram({
  params,
}: PageProps<"/program/[id]">) {
  const program = await bacaProgram((await params).id);
  if (!program) notFound();

  return (
    <main className="wadah pt-5 pb-pad lg:pt-9 lg:pb-pad-lebar">
      <Link
        href="/program"
        className="-ml-3 inline-flex min-h-11 items-center gap-1 rounded-sudut px-3 py-2.5 font-bold no-underline hover:bg-jalur-pucat"
      >
        <IkonPanahKiri />
        Semua program
      </Link>
      <h1 className="mt-2 max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        {program.nama}
      </h1>
      <p className="mt-3 max-w-[60ch] whitespace-pre-line text-teks-2">
        {program.deskripsi}
      </p>
      <dl className="mt-6 grid max-w-[46ch] border-t-2 border-navy">
        <div className="border-b border-garis py-3">
          <dt className="text-keterangan font-semibold text-teks-2">
            Batas usia
          </dt>
          <dd className="mt-0.5 font-semibold">
            {program.usiaMinimal}–{program.usiaMaksimal} tahun
          </dd>
        </div>
        <div className="border-b border-garis py-3">
          <dt className="text-keterangan font-semibold text-teks-2">
            Lama pelatihan
          </dt>
          <dd className="mt-0.5 font-semibold">{program.lamaPelatihan}</dd>
        </div>
      </dl>
      <section aria-labelledby="judul-syarat" className="mt-10 lg:mt-12">
        <h2 id="judul-syarat" className={JUDUL_BAGIAN}>
          Syarat
        </h2>
        <p className="mt-3 max-w-[60ch] whitespace-pre-line">
          {program.syarat}
        </p>
      </section>
    </main>
  );
}
