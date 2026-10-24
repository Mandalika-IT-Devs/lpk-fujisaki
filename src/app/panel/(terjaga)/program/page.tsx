import type { Metadata } from "next";
import { daftarProgram } from "@/server/program";
import { metadataMenu, pastikanBolehMembuka } from "../../penjaga";
import { DaftarProgram } from "./daftar-program";
import { FormulirProgram } from "./formulir-program";

const KUNCI_MENU = "program";

const GAYA_JUDUL_BAGIAN =
  "max-w-[22ch] font-papan text-headline-bagian text-balance lg:text-headline-bagian-lebar";

export function generateMetadata(): Promise<Metadata> {
  return metadataMenu(KUNCI_MENU);
}

/** Admin mengelola program (PRD §4.1, §4.3): daftar program, mengubah dan menonaktifkannya, dan menambah program. */
export default async function HalamanProgram() {
  const menu = await pastikanBolehMembuka(KUNCI_MENU);
  const daftar = await daftarProgram();

  return (
    <div className="grid gap-10">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        {menu.nama}
      </h1>
      <section aria-labelledby="judul-daftar-program" className="grid gap-4">
        <h2 id="judul-daftar-program" className={GAYA_JUDUL_BAGIAN}>
          Daftar program
        </h2>
        <p className="max-w-[60ch] text-teks-2">
          Program tidak bisa dihapus. Program yang dinonaktifkan tidak tampil di
          situs publik, dan tampil lagi setelah diaktifkan kembali.
        </p>
        <DaftarProgram daftar={daftar} />
      </section>
      <section aria-labelledby="judul-tambah-program" className="grid gap-4">
        <h2 id="judul-tambah-program" className={GAYA_JUDUL_BAGIAN}>
          Tambah program
        </h2>
        <p className="max-w-[60ch] text-teks-2">
          Program baru langsung aktif dan tampil di situs publik.
        </p>
        <FormulirProgram />
      </section>
    </div>
  );
}
