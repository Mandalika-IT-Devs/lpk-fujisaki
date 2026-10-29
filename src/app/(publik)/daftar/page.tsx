import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GAYA_TAUTAN } from "@/app/panel/akses-pegawai";
import { ALAMAT_AKUN, ALAMAT_MASUK } from "@/components/tautan-situs";
import { KartuAksesAkun } from "../akses-akun";
import { bacaAkunMasuk } from "../penjaga-akun";
import { FormulirDaftarAkun } from "./formulir-daftar-akun";

export const metadata: Metadata = {
  title: "Daftar akun",
  description:
    "Buat akun calon peserta LPKS Fujisaki Gakuin Center untuk mengisi formulir pendaftaran.",
};

/**
 * Halaman daftar akun calon peserta (PRD §3.1, §5.1), tujuan tombol utama "Daftar sekarang". Akun dibuat oleh
 * pengunjung (§2.2), jadi orang yang sudah masuk ke sebuah akun dibawa ke akunnya.
 */
export default async function HalamanDaftarAkun() {
  if (await bacaAkunMasuk()) redirect(ALAMAT_AKUN);

  return (
    <KartuAksesAkun
      judul="Daftar akun"
      pengantar="Dengan akun, kamu bisa mengisi formulir pendaftaran dan memantau pendaftaranmu sampai berangkat ke Jepang."
    >
      <FormulirDaftarAkun />
      <p className="text-body-kecil">
        Sudah punya akun?{" "}
        <Link href={ALAMAT_MASUK} className={GAYA_TAUTAN}>
          Masuk
        </Link>
      </p>
    </KartuAksesAkun>
  );
}
