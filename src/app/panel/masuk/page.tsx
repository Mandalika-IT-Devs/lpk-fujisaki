import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GAYA_TAUTAN, KartuAksesPegawai } from "../akses-pegawai";
import { bacaPegawaiMasuk } from "../penjaga";
import { masukPegawai } from "./aksi";
import { FormulirMasuk } from "./formulir-masuk";

export const metadata: Metadata = { title: "Masuk pegawai" };

/** Halaman masuk pegawai. Pegawai yang sudah masuk langsung dibawa ke panel pegawai. */
export default async function HalamanMasukPegawai() {
  if (await bacaPegawaiMasuk()) redirect("/panel");

  return (
    <KartuAksesPegawai
      judul="Masuk pegawai"
      pengantar="Untuk Admin dan Staf lembaga. Masuk dengan email dan kata sandi akun pegawaimu."
    >
      <FormulirMasuk aksi={masukPegawai} />
      <p className="text-body-kecil">
        <Link href="/panel/lupa-kata-sandi" className={GAYA_TAUTAN}>
          Lupa kata sandi?
        </Link>
      </p>
    </KartuAksesPegawai>
  );
}
