import type { Metadata } from "next";
import { daftarBidangKerja } from "@/server/bidang-kerja";
import { bacaDaftarPendaftaran, bacaPendaftaran } from "@/server/pendaftaran";
import { daftarProgram } from "@/server/program";
import { Kabar } from "../../akses-pegawai";
import { metadataMenu, pastikanBolehMembuka } from "../../penjaga";
import { bacaNomorDihapus } from "./alamat-pendaftaran";
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
 * dicari menurut sebagian nama atau nomor pendaftaran, dari yang paling baru dikirim, dan dibagi per halaman. Sesudah
 * Admin menghapus permanen pemilik sebuah pendaftaran (§12.5), daftar ini menampilkan kabar penghapusannya.
 */
export default async function HalamanPendaftaran({
  searchParams,
}: PageProps<"/panel/pendaftaran">) {
  const menu = await pastikanBolehMembuka(KUNCI_MENU);
  const parameterAlamat = await searchParams;
  const { saringan, halaman } = bacaSaringan(parameterAlamat);
  const nomorDihapus = bacaNomorDihapus(parameterAlamat);
  const [daftar, program, bidangKerja, masihAda] = await Promise.all([
    bacaDaftarPendaftaran(saringan, halaman),
    daftarProgram(),
    daftarBidangKerja(),
    nomorDihapus === undefined ? undefined : bacaPendaftaran(nomorDihapus),
  ]);
  const adaSaringan = alamatDaftar(saringan, 1) !== ALAMAT_DAFTAR_PENDAFTARAN;

  return (
    <div className="grid gap-8">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        {menu.nama}
      </h1>
      {/* Kabar hanya tampil bila pendaftaran itu memang sudah tidak ada. */}
      {nomorDihapus !== undefined && masihAda === undefined && (
        <Kabar>
          Data pemilik pendaftaran {nomorDihapus} sudah dihapus permanen:
          akunnya beserta semua pendaftarannya.
        </Kabar>
      )}
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
