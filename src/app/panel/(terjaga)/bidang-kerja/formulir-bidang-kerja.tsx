"use client";

import { useActionState } from "react";
import { TombolKirim } from "@/components/tombol";
import { GAYA_ISIAN, GAYA_LABEL } from "../../akses-pegawai";
import { PesanTindakan } from "../pesan-tindakan";
import { simpanPerubahanBidangKerja, tambahkanBidangKerja } from "./aksi";

/**
 * Formulir bidang kerja dengan namanya (PRD §4.2). Tanpa `id` formulir ini menambah bidang kerja; dengan `id` ia
 * mengubah nama bidang kerja itu, dimulai dari `namaAwal`.
 */
export function FormulirBidangKerja(
  props: { id: number; namaAwal: string } | { id?: never },
) {
  const [keadaan, kirim] = useActionState(
    props.id === undefined ? tambahkanBidangKerja : simpanPerubahanBidangKerja,
    { pesan: null, nama: props.id === undefined ? "" : props.namaAwal },
  );

  return (
    <form action={kirim} className="grid max-w-md gap-5">
      {props.id !== undefined && (
        <input type="hidden" name="id" value={props.id} />
      )}
      <div className="grid gap-1">
        <label htmlFor="nama" className={GAYA_LABEL}>
          Nama bidang kerja
        </label>
        <input
          id="nama"
          name="nama"
          type="text"
          autoComplete="off"
          required
          defaultValue={keadaan.nama}
          className={GAYA_ISIAN}
        />
      </div>
      <PesanTindakan pesan={keadaan.pesan} />
      <TombolKirim>
        {props.id === undefined ? "Tambah bidang kerja" : "Simpan perubahan"}
      </TombolKirim>
    </form>
  );
}
