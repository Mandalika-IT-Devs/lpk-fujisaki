import type { Metadata } from "next";
import { MASA_BERLAKU_TAUTAN_ATUR_KATA_SANDI_PEGAWAI_BARU_JAM } from "@/domain/akun";
import { daftarPegawai } from "@/server/akun-pegawai";
import { metadataMenu, pastikanBolehMembuka } from "../../penjaga";
import { DaftarPegawai } from "./daftar-pegawai";
import { FormulirBuatAkun } from "./formulir-buat-akun";

const KUNCI_MENU = "akun-pegawai";

const GAYA_JUDUL_BAGIAN =
  "max-w-[22ch] font-papan text-headline-bagian text-balance lg:text-headline-bagian-lebar";

export function generateMetadata(): Promise<Metadata> {
  return metadataMenu(KUNCI_MENU);
}

/** Admin mengelola akun pegawai (PRD §5.5): daftar pegawai, mengubah peran dan status, dan membuat akun. */
export default async function HalamanAkunPegawai() {
  const menu = await pastikanBolehMembuka(KUNCI_MENU);
  const daftar = await daftarPegawai();

  return (
    <div className="grid gap-10">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        {menu.nama}
      </h1>
      <section aria-labelledby="judul-daftar-pegawai" className="grid gap-4">
        <h2 id="judul-daftar-pegawai" className={GAYA_JUDUL_BAGIAN}>
          Daftar pegawai
        </h2>
        <p className="max-w-[60ch] text-teks-2">
          Pegawai nonaktif tidak bisa masuk. Akunnya tetap disimpan, supaya
          riwayat perubahan tetap menunjuk orang yang benar.
        </p>
        <DaftarPegawai daftar={daftar} />
      </section>
      <section aria-labelledby="judul-buat-akun" className="grid gap-4">
        <h2 id="judul-buat-akun" className={GAYA_JUDUL_BAGIAN}>
          Buat akun pegawai
        </h2>
        <p className="max-w-[60ch] text-teks-2">
          Pegawai baru menerima email untuk mengatur kata sandinya. Tautan di
          email itu berlaku{" "}
          {MASA_BERLAKU_TAUTAN_ATUR_KATA_SANDI_PEGAWAI_BARU_JAM} jam.
        </p>
        <FormulirBuatAkun />
      </section>
    </div>
  );
}
