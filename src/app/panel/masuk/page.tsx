import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { bacaPegawaiMasuk } from "../penjaga";
import { FormulirMasuk } from "./formulir-masuk";

export const metadata: Metadata = { title: "Masuk pegawai" };

/** Halaman masuk pegawai. Pegawai yang sudah masuk langsung dibawa ke panel pegawai. */
export default async function HalamanMasukPegawai() {
  if (await bacaPegawaiMasuk()) redirect("/panel");

  return (
    <main className="min-h-dvh bg-jalur-pucat px-tepi py-pad">
      <div className="mx-auto grid max-w-md gap-6 rounded-sudut bg-dasar p-4 shadow-papan lg:p-6">
        <Link
          href="/"
          aria-label="Fujisaki Gakuin Center, ke beranda"
          className="flex items-baseline gap-2 no-underline"
        >
          <span className="font-papan text-merek text-oranye">Fujisaki</span>
          <span className="text-keterangan leading-none font-semibold text-teks-2">
            Gakuin Center
          </span>
        </Link>
        <div className="grid gap-1">
          <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
            Masuk pegawai
          </h1>
          <p className="text-teks-2">
            Untuk Admin dan Staf lembaga. Masuk dengan email dan kata sandi akun
            pegawaimu.
          </p>
        </div>
        <FormulirMasuk />
      </div>
    </main>
  );
}
