import type { Metadata } from "next";
import { ALAMAT_FORMULIR_PENDAFTARAN } from "@/components/tautan-situs";
import { TombolUtama } from "@/components/tombol";
import { pastikanPemilikAkun } from "../penjaga-akun";
import { keluarAkun } from "./aksi";
import { PengingatVerifikasiEmail } from "./pengingat-verifikasi-email";

export const metadata: Metadata = { title: "Akunmu" };

/**
 * Halaman akun awal pemilik akun (issue T11): ajakan mengisi formulir pendaftaran, dan pengingat verifikasi email
 * selama emailnya belum terverifikasi (PRD §5.3). Halaman ini hanya untuk pemilik akun (§2.2).
 */
export default async function HalamanAkun() {
  const pemilikAkun = await pastikanPemilikAkun();

  return (
    <main className="wadah pt-8 pb-pad lg:pt-12 lg:pb-pad-lebar">
      <div className="grid max-w-2xl gap-6">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="grid gap-1">
            <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
              Halo, {pemilikAkun.nama}
            </h1>
            <p className="text-teks-2">Masuk sebagai {pemilikAkun.email}</p>
          </div>
          <form action={keluarAkun}>
            <button
              type="submit"
              className="cursor-pointer rounded-sudut px-3 py-2.5 font-bold text-jalur hover:bg-jalur-pucat hover:text-jalur-tua"
            >
              Keluar
            </button>
          </form>
        </div>

        {!pemilikAkun.emailTerverifikasi && (
          <PengingatVerifikasiEmail email={pemilikAkun.email} />
        )}

        <section
          aria-labelledby="judul-formulir-pendaftaran"
          className="grid gap-4 rounded-sudut bg-dasar p-4 shadow-papan lg:p-6"
        >
          <div className="grid gap-1">
            <h2
              id="judul-formulir-pendaftaran"
              className="font-papan text-title-kecil"
            >
              Isi formulir pendaftaran
            </h2>
            <p className="max-w-[60ch]">
              Pilih program dan isi data dirimu. Formulir bisa disimpan sebagai
              draf dan dilanjutkan kapan saja, lalu dikirim bila sudah lengkap.
            </p>
          </div>
          <TombolUtama
            href={ALAMAT_FORMULIR_PENDAFTARAN}
            className="justify-self-start"
          >
            Isi formulir pendaftaran
          </TombolUtama>
        </section>
      </div>
    </main>
  );
}
