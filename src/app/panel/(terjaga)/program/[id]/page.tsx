import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IkonPanahKiri } from "@/components/ikon";
import { bacaId } from "@/lib/baca-id";
import { cariProgram } from "@/server/program";
import { metadataMenu, pastikanBolehMembuka } from "../../../penjaga";
import { FormulirProgram } from "../formulir-program";
import { keIsianFormulir } from "../isian-formulir";

const KUNCI_MENU = "program";

export function generateMetadata(): Promise<Metadata> {
  return metadataMenu(KUNCI_MENU, "Ubah program");
}

/** Admin mengubah nama, deskripsi, syarat, lama pelatihan, dan batas usia sebuah program (PRD §4.1). */
export default async function HalamanUbahProgram({
  params,
}: PageProps<"/panel/program/[id]">) {
  await pastikanBolehMembuka(KUNCI_MENU);
  const id = bacaId((await params).id);
  const program = id === undefined ? undefined : await cariProgram(id);
  if (!program) notFound();

  return (
    <div className="grid gap-6">
      <Link
        href="/panel/program"
        className="-ml-3 inline-flex min-h-11 items-center gap-1 justify-self-start rounded-sudut px-3 py-2.5 font-bold no-underline hover:bg-jalur-pucat"
      >
        <IkonPanahKiri />
        Daftar program
      </Link>
      <div className="grid gap-3">
        <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
          Ubah program
        </h1>
        <p className="max-w-[60ch] text-teks-2">
          Status {program.nama} saat ini {program.aktif ? "aktif" : "nonaktif"}.
          Untuk menonaktifkan atau mengaktifkannya kembali, pakai tombol di
          daftar program.
        </p>
      </div>
      <FormulirProgram id={program.id} awal={keIsianFormulir(program)} />
    </div>
  );
}
