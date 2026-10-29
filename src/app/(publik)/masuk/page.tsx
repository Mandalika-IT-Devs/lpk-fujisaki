import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GAYA_TAUTAN } from "@/app/panel/akses-pegawai";
import { FormulirMasuk } from "@/app/panel/masuk/formulir-masuk";
import {
  ALAMAT_AKUN,
  ALAMAT_DAFTAR,
  ALAMAT_LUPA_KATA_SANDI,
} from "@/components/tautan-situs";
import { KartuAksesAkun } from "../akses-akun";
import { bacaAkunMasuk } from "../penjaga-akun";
import { masukAkun } from "./aksi";

export const metadata: Metadata = { title: "Masuk" };

/** Halaman masuk pemilik akun (PRD §3.1, §5). Orang yang sudah masuk langsung dibawa ke akunnya. */
export default async function HalamanMasuk() {
  if (await bacaAkunMasuk()) redirect(ALAMAT_AKUN);

  return (
    <KartuAksesAkun
      judul="Masuk"
      pengantar="Masuk dengan email dan kata sandi akunmu untuk mengisi formulir pendaftaran dan memantau pendaftaranmu."
    >
      <FormulirMasuk aksi={masukAkun} />
      <div className="grid text-body-kecil">
        <Link href={ALAMAT_LUPA_KATA_SANDI} className={GAYA_TAUTAN}>
          Lupa kata sandi?
        </Link>
        <p>
          Belum punya akun?{" "}
          <Link href={ALAMAT_DAFTAR} className={GAYA_TAUTAN}>
            Daftar akun
          </Link>
        </p>
      </div>
    </KartuAksesAkun>
  );
}
