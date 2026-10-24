"use client";

import { useActionState } from "react";
import { TombolKirim } from "@/components/tombol";
import { LEVEL } from "@/domain/statistik-lembaga";
import { GAYA_ISIAN, GAYA_LABEL } from "../../akses-pegawai";
import { PesanTindakan } from "../pesan-tindakan";
import { simpanStatistik } from "./aksi";
import type { IsianFormulirStatistik } from "./isian-formulir";

const GAYA_JUDUL_KELOMPOK = "mb-1 font-papan text-title-kecil";
const GAYA_KETERANGAN = "text-keterangan text-teks-2";

/** Isian satu angka statistik: bilangan bulat 0 atau lebih (PRD §3.3). */
function IsianAngka({
  id,
  label,
  nilai,
}: {
  id: string;
  label: string;
  nilai: string;
}) {
  return (
    <div className="grid content-start gap-1">
      <label htmlFor={id} className={GAYA_LABEL}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        required
        defaultValue={nilai}
        className={GAYA_ISIAN}
      />
    </div>
  );
}

/**
 * Formulir statistik lembaga (PRD §3.3): data per, jumlah siswa per level, jumlah siswa untuk setiap bidang kerja
 * aktif, dan jumlah alumni di Jepang. Total siswa tidak diisi, karena dihitung sistem.
 */
export function FormulirStatistik({
  bidangKerja,
  awal,
}: {
  bidangKerja: readonly { id: number; nama: string }[];
  awal: IsianFormulirStatistik;
}) {
  const [keadaan, kirim] = useActionState(simpanStatistik, {
    pesan: null,
    isian: awal,
  });
  const { isian } = keadaan;

  return (
    <form action={kirim} className="grid max-w-xl gap-7">
      <div className="grid gap-1">
        <label htmlFor="dataPer" className={GAYA_LABEL}>
          Data per
        </label>
        <input
          id="dataPer"
          name="dataPer"
          type="date"
          required
          aria-describedby="keterangan-data-per"
          defaultValue={isian.dataPer}
          className={GAYA_ISIAN}
        />
        <p id="keterangan-data-per" className={GAYA_KETERANGAN}>
          Tanggal angka-angka di bawah ini dihitung.
        </p>
      </div>
      <fieldset className="grid gap-3">
        <legend className={GAYA_JUDUL_KELOMPOK}>Jumlah siswa per level</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LEVEL.map((level) => (
            <IsianAngka
              key={level}
              id={`siswa-${level}`}
              label={level}
              nilai={isian.perLevel[level]}
            />
          ))}
        </div>
        <p className={GAYA_KETERANGAN}>
          Total siswa dihitung sistem: N5 + N4 + N3 + N2.
        </p>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className={GAYA_JUDUL_KELOMPOK}>
          Jumlah siswa per bidang kerja
        </legend>
        <p className={GAYA_KETERANGAN}>
          Satu angka untuk setiap bidang kerja aktif. Jumlah semuanya harus sama
          dengan total siswa.
        </p>
        {bidangKerja.length === 0 ? (
          <p>Belum ada bidang kerja aktif.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {bidangKerja.map(({ id, nama }) => (
              <IsianAngka
                key={id}
                id={`bidangKerja-${id}`}
                label={nama}
                nilai={isian.perBidangKerja[id] ?? ""}
              />
            ))}
          </div>
        )}
      </fieldset>
      <IsianAngka
        id="alumniDiJepang"
        label="Jumlah alumni di Jepang"
        nilai={isian.alumniDiJepang}
      />
      <PesanTindakan pesan={keadaan.pesan} />
      <TombolKirim>Simpan statistik</TombolKirim>
    </form>
  );
}
