import type { Metadata } from "next";
import {
  bacaStatistikLembaga,
  daftarBidangKerjaAktif,
} from "@/server/statistik-lembaga";
import { metadataMenu, pastikanBolehMembuka } from "../../penjaga";
import { FormulirStatistik } from "./formulir-statistik";
import { keIsianFormulir } from "./isian-formulir";

const KUNCI_MENU = "statistik-lembaga";

export function generateMetadata(): Promise<Metadata> {
  return metadataMenu(KUNCI_MENU);
}

/** Admin mengisi statistik lembaga yang tampil di Beranda (PRD §3.3, ADR-0005). */
export default async function HalamanStatistikLembaga() {
  const menu = await pastikanBolehMembuka(KUNCI_MENU);
  const [statistik, bidangKerja] = await Promise.all([
    bacaStatistikLembaga(),
    daftarBidangKerjaAktif(),
  ]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
          {menu.nama}
        </h1>
        <p className="max-w-[60ch] text-teks-2">
          Angka ini diisi manual, tidak dihitung dari data pendaftaran, lalu
          tampil di Beranda. Penyimpanan ditolak bila jumlah siswa per bidang
          kerja tidak sama dengan total siswa.
        </p>
      </div>
      <FormulirStatistik
        bidangKerja={bidangKerja}
        awal={keIsianFormulir(statistik, bidangKerja)}
      />
    </div>
  );
}
