"use client";

import { useActionState } from "react";
import { IkonSeru } from "@/components/ikon";
import { TombolKirimKedua } from "@/components/tombol";
import { cn } from "@/lib/utils";
import { GAYA_ISIAN, GAYA_LABEL } from "../../../akses-pegawai";
import { PesanTindakan } from "../../pesan-tindakan";
import { hapusPermanenDariPanel } from "./aksi";

// Isian yang salah memakai gaya yang sama seperti formulir tutup pendaftaran: border navy, dan pesan di bawah isian
// dengan ikon tanda seru dan teks navy; tidak memakai oranye.
const GAYA_KONFIRMASI = cn(GAYA_ISIAN, "aria-invalid:border-navy");

const ID_KONFIRMASI = "hapus-permanen-konfirmasi";

/**
 * Formulir Admin untuk menghapus permanen pemilik pendaftaran `nomor` beserta semua pendaftarannya (PRD §12.5), dengan
 * konfirmasi berupa nomor pendaftaran itu atau email akun pemiliknya. Konfirmasi diperiksa di server, jadi pemeriksaan
 * bawaan browser dimatikan. Tombolnya tombol kedua, karena tombol utama halaman ini menyimpan isian formulir
 * pendaftaran.
 */
export function FormulirHapusPermanen({
  nomor,
  idJudul,
}: {
  nomor: string;
  /** Id judul bagian yang menamai formulir ini. */
  idJudul: string;
}) {
  const [keadaan, kirim] = useActionState(hapusPermanenDariPanel, {
    pesan: null,
    konfirmasi: "",
    galat: null,
    versi: "awal",
  });
  const penjelas = `penjelas-${ID_KONFIRMASI}`;
  const idGalat = `galat-${ID_KONFIRMASI}`;

  return (
    <form
      action={kirim}
      noValidate
      aria-labelledby={idJudul}
      className="grid gap-6"
    >
      <input type="hidden" name="nomor" value={nomor} />
      {/* Isian dipasang ulang dengan kunci versi, supaya ketikan yang ditolak tetap terisi sesudah formulir diproses. */}
      <div key={keadaan.versi} className="grid gap-1">
        <label htmlFor={ID_KONFIRMASI} className={GAYA_LABEL}>
          Konfirmasi penghapusan
        </label>
        <input
          id={ID_KONFIRMASI}
          name="konfirmasi"
          type="text"
          defaultValue={keadaan.konfirmasi}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={keadaan.galat ? true : undefined}
          aria-describedby={keadaan.galat ? `${penjelas} ${idGalat}` : penjelas}
          className={GAYA_KONFIRMASI}
        />
        <p id={penjelas} className="text-keterangan text-teks-2">
          Ketik nomor pendaftaran {nomor} atau email akun pemiliknya.
        </p>
        {keadaan.galat && (
          <p
            id={idGalat}
            className="flex items-start gap-2 text-body-kecil font-medium text-navy"
          >
            <span className="mt-px">
              <IkonSeru />
            </span>
            <span>{keadaan.galat}</span>
          </p>
        )}
      </div>
      <div className="grid gap-4">
        <PesanTindakan pesan={keadaan.pesan} />
        <div>
          <TombolKirimKedua>Hapus permanen</TombolKirimKedua>
        </div>
      </div>
    </form>
  );
}
