"use client";

import { useActionState } from "react";
import { TombolKirim } from "@/components/tombol";
import { cn } from "@/lib/utils";
import { GAYA_ISIAN, GAYA_LABEL } from "../../akses-pegawai";
import { PesanTindakan } from "../pesan-tindakan";
import { simpanPerubahanProgram, tambahkanProgram } from "./aksi";
import { ISIAN_KOSONG, type IsianFormulirProgram } from "./isian-formulir";

// Isian teks panjang: gaya isian yang sama, tetapi tingginya mengikuti isi (docs/DESIGN.md, Inputs / Fields).
const GAYA_ISIAN_PANJANG = cn(GAYA_ISIAN, "h-auto min-h-28 py-2.5");

/**
 * Formulir program dengan nama, deskripsi, syarat, lama pelatihan, dan batas usia (PRD §4.1). Tanpa `id` formulir
 * ini menambah program; dengan `id` ia mengubah program itu, dimulai dari isian `awal`.
 */
export function FormulirProgram(
  props: { id: number; awal: IsianFormulirProgram } | { id?: never },
) {
  const [keadaan, kirim] = useActionState(
    props.id === undefined ? tambahkanProgram : simpanPerubahanProgram,
    { pesan: null, isian: props.id === undefined ? ISIAN_KOSONG : props.awal },
  );
  const { isian } = keadaan;

  return (
    <form action={kirim} className="grid max-w-xl gap-5">
      {props.id !== undefined && (
        <input type="hidden" name="id" value={props.id} />
      )}
      <div className="grid gap-1">
        <label htmlFor="nama" className={GAYA_LABEL}>
          Nama program
        </label>
        <input
          id="nama"
          name="nama"
          type="text"
          autoComplete="off"
          required
          defaultValue={isian.nama}
          className={GAYA_ISIAN}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="deskripsi" className={GAYA_LABEL}>
          Deskripsi
        </label>
        <textarea
          id="deskripsi"
          name="deskripsi"
          required
          defaultValue={isian.deskripsi}
          className={GAYA_ISIAN_PANJANG}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="syarat" className={GAYA_LABEL}>
          Syarat
        </label>
        <textarea
          id="syarat"
          name="syarat"
          required
          defaultValue={isian.syarat}
          className={GAYA_ISIAN_PANJANG}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="lamaPelatihan" className={GAYA_LABEL}>
          Lama pelatihan
        </label>
        <input
          id="lamaPelatihan"
          name="lamaPelatihan"
          type="text"
          autoComplete="off"
          required
          aria-describedby="keterangan-lama-pelatihan"
          defaultValue={isian.lamaPelatihan}
          className={GAYA_ISIAN}
        />
        <p
          id="keterangan-lama-pelatihan"
          className="text-keterangan text-teks-2"
        >
          Teks bebas, misalnya 6–8 bulan.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
        <div className="grid gap-1">
          <label htmlFor="usiaMinimal" className={GAYA_LABEL}>
            Usia minimal (tahun)
          </label>
          <input
            id="usiaMinimal"
            name="usiaMinimal"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            required
            defaultValue={isian.usiaMinimal}
            className={GAYA_ISIAN}
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="usiaMaksimal" className={GAYA_LABEL}>
            Usia maksimal (tahun)
          </label>
          <input
            id="usiaMaksimal"
            name="usiaMaksimal"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            required
            defaultValue={isian.usiaMaksimal}
            className={GAYA_ISIAN}
          />
        </div>
      </div>
      <PesanTindakan pesan={keadaan.pesan} />
      <TombolKirim>
        {props.id === undefined ? "Tambah program" : "Simpan perubahan"}
      </TombolKirim>
    </form>
  );
}
