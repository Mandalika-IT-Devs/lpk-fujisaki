import type { Metadata } from "next";
import { pastikanPemilikAkun } from "../../penjaga-akun";

export const metadata: Metadata = { title: "Formulir pendaftaran" };

/**
 * Tempat sementara bagi halaman formulir pendaftaran (PRD §6): tujuan ajakan "Isi formulir pendaftaran" di halaman
 * akun. Halaman ini hanya berisi judulnya sampai formulirnya dibangun di T12, sama seperti halaman daftar akun
 * sebelum T11.
 */
export default async function HalamanFormulirPendaftaran() {
  await pastikanPemilikAkun();

  return (
    <main className="wadah pt-8 pb-pad lg:pt-12 lg:pb-pad-lebar">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Formulir pendaftaran
      </h1>
    </main>
  );
}
