import type { Metadata } from "next";
import { daftarBidangKerja } from "@/server/bidang-kerja";
import { metadataMenu, pastikanBolehMembuka } from "../../penjaga";
import { DaftarBidangKerja } from "./daftar-bidang-kerja";
import { FormulirBidangKerja } from "./formulir-bidang-kerja";

const KUNCI_MENU = "bidang-kerja";

const GAYA_JUDUL_BAGIAN =
  "max-w-[22ch] font-papan text-headline-bagian text-balance lg:text-headline-bagian-lebar";

export function generateMetadata(): Promise<Metadata> {
  return metadataMenu(KUNCI_MENU);
}

/** Admin mengelola bidang kerja (PRD §4.2, §4.3): daftar bidang kerja, mengubah dan menonaktifkannya, dan menambah. */
export default async function HalamanBidangKerja() {
  const menu = await pastikanBolehMembuka(KUNCI_MENU);
  const daftar = await daftarBidangKerja();

  return (
    <div className="grid gap-10">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        {menu.nama}
      </h1>
      <section
        aria-labelledby="judul-daftar-bidang-kerja"
        className="grid gap-4"
      >
        <h2 id="judul-daftar-bidang-kerja" className={GAYA_JUDUL_BAGIAN}>
          Daftar bidang kerja
        </h2>
        <p className="max-w-[60ch] text-teks-2">
          Bidang kerja tidak bisa dihapus. Bidang kerja yang dinonaktifkan tidak
          tampil di situs publik, dan tampil lagi setelah diaktifkan kembali.
        </p>
        <DaftarBidangKerja daftar={daftar} />
      </section>
      <section
        aria-labelledby="judul-tambah-bidang-kerja"
        className="grid gap-4"
      >
        <h2 id="judul-tambah-bidang-kerja" className={GAYA_JUDUL_BAGIAN}>
          Tambah bidang kerja
        </h2>
        <p className="max-w-[60ch] text-teks-2">
          Bidang kerja baru langsung aktif dan tampil di situs publik.
        </p>
        <FormulirBidangKerja />
      </section>
    </div>
  );
}
