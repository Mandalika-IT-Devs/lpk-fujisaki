"use client";

import { useActionState } from "react";
import { TombolKirim } from "@/components/tombol";
import type { PilihanFormulirPendaftaran } from "@/server/formulir-pendaftaran";
import { BagianIsianFormulir } from "@/app/(publik)/akun/formulir-pendaftaran/bagian-isian-formulir";
import type { IsianFormulirPendaftaran } from "@/app/(publik)/akun/formulir-pendaftaran/isian-formulir";
import { PesanTindakan } from "../../pesan-tindakan";
import { simpanIsianPendaftaran } from "./aksi";

/**
 * Formulir pegawai untuk mengubah isian formulir sebuah pendaftaran yang sudah dikirim (PRD §2.2, §6.5), dengan isian
 * yang sama seperti formulir pemilik akun. Semua isian diperiksa di server, jadi pemeriksaan bawaan browser dimatikan
 * supaya setiap isian yang salah ditandai dengan pesan yang sama seperti di formulir pemilik akun.
 */
export function FormulirUbahIsian({
  nomor,
  awal,
  pilihan,
  idJudul,
}: {
  nomor: string;
  awal: IsianFormulirPendaftaran;
  pilihan: PilihanFormulirPendaftaran;
  /** Id judul bagian yang menamai formulir ini. */
  idJudul: string;
}) {
  const [keadaan, kirim] = useActionState(simpanIsianPendaftaran, {
    pesan: null,
    isian: awal,
    galat: {},
    versi: 0,
  });

  return (
    <form
      action={kirim}
      noValidate
      aria-labelledby={idJudul}
      className="grid gap-8"
    >
      <input type="hidden" name="nomor" value={nomor} />
      {/* React mengatur ulang formulir sesudah setiap action, dan select kembali ke pilihan saat pertama dipasang.
          Isian dipasang ulang dengan kunci versi, supaya setiap isian berangkat dari isian hasil proses terakhir. */}
      <div key={keadaan.versi} className="grid gap-8">
        <BagianIsianFormulir
          isian={keadaan.isian}
          galat={keadaan.galat}
          pilihan={pilihan}
          tingkatJudul="h3"
        />
      </div>
      <div className="grid gap-4">
        <PesanTindakan pesan={keadaan.pesan} />
        <div>
          <TombolKirim>Simpan perubahan</TombolKirim>
        </div>
      </div>
    </form>
  );
}
