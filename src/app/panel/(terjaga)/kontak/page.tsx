import type { Metadata } from "next";
import { bacaKontak } from "@/server/kontak";
import { metadataMenu, pastikanBolehMembuka } from "../../penjaga";
import { FormulirKontak } from "./formulir-kontak";
import { keIsianFormulir } from "./isian-formulir";

const KUNCI_MENU = "kontak";

export function generateMetadata(): Promise<Metadata> {
  return metadataMenu(KUNCI_MENU);
}

/** Admin mengelola kontak lembaga yang tampil di halaman Kontak dan di loket Beranda (PRD §3.5). */
export default async function HalamanKelolaKontak() {
  const menu = await pastikanBolehMembuka(KUNCI_MENU);
  const kontak = await bacaKontak();

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
          {menu.nama}
        </h1>
        <p className="max-w-[60ch] text-teks-2">
          Kontak ini tampil di halaman Kontak dan di loket ujung garis Beranda.
          Tombol Chat WhatsApp membuka percakapan dengan nomor WhatsApp kantor.
        </p>
      </div>
      <FormulirKontak awal={keIsianFormulir(kontak)} />
    </div>
  );
}
