import type { Metadata } from "next";
import { daftarBidangKerja } from "@/server/bidang-kerja";
import { bacaDaftarPendaftaran } from "@/server/pendaftaran";
import { daftarProgram } from "@/server/program";
import { metadataMenu, pastikanBolehMembuka } from "../../penjaga";
import { DaftarPendaftaran } from "./daftar-pendaftaran";
import { FormulirSaringan } from "./formulir-saringan";
import {
  alamatDaftar,
  ALAMAT_DAFTAR_PENDAFTARAN,
  bacaSaringan,
} from "./saringan";

const KUNCI_MENU = "pendaftaran";

export function generateMetadata(): Promise<Metadata> {
  return metadataMenu(KUNCI_MENU);
}

/**
 * Staf dan Admin melihat semua pendaftaran (PRD §11.1): disaring menurut tahap, program, bidang kerja, dan status,
 * dicari menurut sebagian nama atau nomor pendaftaran, dari yang paling baru dikirim, dan dibagi per halaman.
 */
export default async function HalamanPendaftaran({
  searchParams,
}: PageProps<"/panel/pendaftaran">) {
  const menu = await pastikanBolehMembuka(KUNCI_MENU);
  const { saringan, halaman } = bacaSaringan(await searchParams);
  const [daftar, program, bidangKerja] = await Promise.all([
    bacaDaftarPendaftaran(saringan, halaman),
    daftarProgram(),
    daftarBidangKerja(),
  ]);
  const adaSaringan = alamatDaftar(saringan, 1) !== ALAMAT_DAFTAR_PENDAFTARAN;

  return (
    <div className="grid gap-8">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        {menu.nama}
      </h1>
      <FormulirSaringan
        saringan={saringan}
        adaSaringan={adaSaringan}
        program={program}
        bidangKerja={bidangKerja}
      />
      <DaftarPendaftaran
        daftar={daftar}
        saringan={saringan}
        adaSaringan={adaSaringan}
      />
    </div>
  );
}
