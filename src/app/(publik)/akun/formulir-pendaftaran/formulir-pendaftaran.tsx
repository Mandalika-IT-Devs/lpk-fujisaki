"use client";

import { useActionState } from "react";
import { TombolKirim, TombolKirimKedua } from "@/components/tombol";
import type { PilihanFormulirPendaftaran } from "@/server/formulir-pendaftaran";
import { PesanTindakan } from "@/app/panel/(terjaga)/pesan-tindakan";
import {
  type KeadaanFormulirPendaftaran,
  kirimFormulir,
  simpanDraf,
} from "./aksi";
import { BagianIsianFormulir } from "./bagian-isian-formulir";
import type { IsianFormulirPendaftaran } from "./isian-formulir";

/** Keadaan formulir di browser: keadaan dari server, ditambah versi yang naik setiap kali formulir diproses. */
type KeadaanTampil = KeadaanFormulirPendaftaran & { versi: number };

/** Nama dan nilai tombol yang ikut terkirim bersama formulir, untuk memilih tindakannya. */
const TINDAKAN = "tindakan";
const KIRIM = "kirim";

/** Tombol "Kirim formulir" mengirim formulir pendaftaran; tombol "Simpan draf" menyimpannya sebagai draf. */
async function prosesLaluNaikkanVersi(
  sebelum: KeadaanTampil,
  formulir: FormData,
): Promise<KeadaanTampil> {
  const { versi, ...keadaan } = sebelum;
  const tindakan =
    formulir.get(TINDAKAN) === KIRIM ? kirimFormulir : simpanDraf;
  return { ...(await tindakan(keadaan, formulir)), versi: versi + 1 };
}

/**
 * Formulir pendaftaran pemilik akun dengan semua isian PRD §6.1, dalam urutan tabelnya, dan tanpa isian NIK, tinggi
 * badan, atau berat badan (§12.2). Formulir bisa disimpan sebagai draf kapan saja, juga bila belum lengkap, dan dikirim
 * bila syarat kirimnya terpenuhi (§6.2).
 * Semua isian diperiksa di server, jadi pemeriksaan bawaan browser dimatikan supaya setiap isian yang salah ditandai
 * dengan pesan yang sama dalam bahasa Indonesia.
 */
export function FormulirPendaftaran({
  awal,
  pilihan,
}: {
  awal: IsianFormulirPendaftaran;
  pilihan: PilihanFormulirPendaftaran;
}) {
  const [keadaan, kirim] = useActionState(prosesLaluNaikkanVersi, {
    pesan: [],
    isian: awal,
    galat: {},
    versi: 0,
  });
  const { isian, galat } = keadaan;

  return (
    <form
      action={kirim}
      noValidate
      aria-label="Formulir pendaftaran"
      className="grid gap-8"
    >
      {/* React mengatur ulang formulir sesudah setiap action, dan select kembali ke pilihan saat pertama dipasang.
          Isian dipasang ulang dengan kunci versi, supaya setiap isian berangkat dari isian hasil simpan terakhir. */}
      <div key={keadaan.versi} className="grid gap-8">
        <BagianIsianFormulir isian={isian} galat={galat} pilihan={pilihan} />
      </div>

      <div className="grid gap-4">
        {keadaan.pesan.map((pesan) => (
          <PesanTindakan key={pesan.teks} pesan={pesan} />
        ))}
        {/* "Simpan draf" lebih dulu di urutan halaman, supaya Enter di sebuah isian menyimpan draf, bukan mengirim. */}
        <div className="flex flex-wrap items-center gap-3">
          <TombolKirimKedua name={TINDAKAN} value="simpan-draf">
            Simpan draf
          </TombolKirimKedua>
          <TombolKirim name={TINDAKAN} value={KIRIM}>
            Kirim formulir
          </TombolKirim>
        </div>
      </div>
    </form>
  );
}
