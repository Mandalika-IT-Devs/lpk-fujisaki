import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IkonPanahKiri } from "@/components/ikon";
import { bacaId } from "@/lib/baca-id";
import { cariBidangKerja } from "@/server/bidang-kerja";
import { metadataMenu, pastikanBolehMembuka } from "../../../penjaga";
import { FormulirBidangKerja } from "../formulir-bidang-kerja";

const KUNCI_MENU = "bidang-kerja";

export function generateMetadata(): Promise<Metadata> {
  return metadataMenu(KUNCI_MENU, "Ubah bidang kerja");
}

/** Admin mengubah nama sebuah bidang kerja (PRD §4.2). */
export default async function HalamanUbahBidangKerja({
  params,
}: PageProps<"/panel/bidang-kerja/[id]">) {
  await pastikanBolehMembuka(KUNCI_MENU);
  const id = bacaId((await params).id);
  const bidangKerja = id === undefined ? undefined : await cariBidangKerja(id);
  if (!bidangKerja) notFound();

  return (
    <div className="grid gap-6">
      <Link
        href="/panel/bidang-kerja"
        className="-ml-3 inline-flex min-h-11 items-center gap-1 justify-self-start rounded-sudut px-3 py-2.5 font-bold no-underline hover:bg-jalur-pucat"
      >
        <IkonPanahKiri />
        Daftar bidang kerja
      </Link>
      <div className="grid gap-3">
        <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
          Ubah bidang kerja
        </h1>
        <p className="max-w-[60ch] text-teks-2">
          Status {bidangKerja.nama} saat ini{" "}
          {bidangKerja.aktif ? "aktif" : "nonaktif"}. Untuk menonaktifkan atau
          mengaktifkannya kembali, pakai tombol di daftar bidang kerja.
        </p>
      </div>
      <FormulirBidangKerja id={bidangKerja.id} namaAwal={bidangKerja.nama} />
    </div>
  );
}
