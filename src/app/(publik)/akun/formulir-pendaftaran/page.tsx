import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IkonPanahKiri } from "@/components/ikon";
import { ALAMAT_AKUN } from "@/components/tautan-situs";
import {
  bacaDrafFormulirPendaftaran,
  bacaPilihanFormulirPendaftaran,
} from "@/server/formulir-pendaftaran";
import { bacaPendaftaranBerjalan } from "@/server/pendaftaran";
import { GAYA_TAUTAN } from "@/app/panel/akses-pegawai";
import { pastikanPemilikAkun } from "../../penjaga-akun";
import { FormulirPendaftaran } from "./formulir-pendaftaran";
import { keIsianFormulir } from "./isian-formulir";

export const metadata: Metadata = { title: "Formulir pendaftaran" };

/**
 * Halaman formulir pendaftaran pemilik akun (PRD §6.1, §6.2), tujuan ajakan "Isi formulir pendaftaran" di halaman
 * akun. Draf yang pernah disimpan dimuat kembali. Halaman ini hanya untuk pemilik akun (§2.2). Sesudah formulir
 * dikirim, isiannya terkunci (§6.5): selama pendaftarannya Berjalan, halaman ini mengarah ke halaman akun, yang
 * menampilkan pendaftaran itu.
 */
export default async function HalamanFormulirPendaftaran() {
  const pemilikAkun = await pastikanPemilikAkun();
  if (await bacaPendaftaranBerjalan(pemilikAkun.id)) redirect(ALAMAT_AKUN);
  const [pilihan, draf] = await Promise.all([
    bacaPilihanFormulirPendaftaran(),
    bacaDrafFormulirPendaftaran(pemilikAkun.id),
  ]);
  const awal = keIsianFormulir(draf, {
    programId: pilihan.program.map((p) => p.id),
    bidangKerjaId: pilihan.bidangKerja.map((b) => b.id),
  });

  return (
    <main className="wadah pt-4 pb-pad lg:pt-8 lg:pb-pad-lebar">
      <div className="grid max-w-2xl gap-6">
        <div className="grid gap-1">
          <Link
            href={ALAMAT_AKUN}
            className={`${GAYA_TAUTAN} gap-1 justify-self-start font-bold no-underline`}
          >
            <IkonPanahKiri />
            Kembali ke akunmu
          </Link>
          <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
            Formulir pendaftaran
          </h1>
          <p className="max-w-[60ch] text-teks-2">
            Formulir bisa disimpan sebagai draf kapan saja, juga bila belum
            lengkap, lalu dilanjutkan nanti. Kirim formulir bila semua isian
            wajib sudah terisi. Sesudah dikirim, isiannya tidak bisa diubah
            lagi.
          </p>
        </div>
        <div className="rounded-sudut bg-dasar p-4 shadow-papan lg:p-6">
          <FormulirPendaftaran awal={awal} pilihan={pilihan} />
        </div>
      </div>
    </main>
  );
}
