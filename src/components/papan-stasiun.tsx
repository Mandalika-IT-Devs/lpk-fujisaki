import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IkonPanahKanan, IkonPanahKiri } from "./ikon";
import { KodeStasiun } from "./kode-stasiun";

type Stasiun = { nomor: string; nama: string };

/** Angka bukti di papan kedatangan, misalnya "1.214 alumni", beserta kalimat sesudahnya. */
type Bukti = { angka: string; teks: string };

/**
 * Papan nama stasiun (docs/DESIGN.md, Cards / Containers): lencana kode besar, nama stasiun, sub-baris,
 * lalu pita jalur dengan penunjuk stasiun sebelumnya dan berikutnya.
 * `tiba` membuat papan kedatangan FG 06, pasangan papan Cilacap, yang lebih kecil di layar lebar
 * karena duduk di kolom FG 06. `bukti` menampilkan angka bukti (Angka bukti, berwarna jalur) di antara kepala dan pita.
 * Seluruh papan dibaca sebagai satu gambar lewat `label`, seperti di prototipe.
 */
export function PapanStasiun({
  label,
  nomor,
  nama,
  sub,
  sebelumnya,
  berikutnya,
  bukti,
  tiba = false,
  className,
}: {
  label: string;
  nomor: string;
  nama: string;
  sub: ReactNode;
  sebelumnya?: Stasiun;
  berikutnya?: Stasiun;
  bukti?: Bukti;
  tiba?: boolean;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-sudut border-[1.5px] border-garis bg-dasar text-navy shadow-papan",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3.5 px-4 pt-3.5 pb-3",
          tiba
            ? "lg:gap-3 lg:px-3.5 lg:pt-3 lg:pb-2.5"
            : "lg:gap-4.5 lg:px-6 lg:pt-4 lg:pb-3.5",
        )}
      >
        <KodeStasiun nomor={nomor} ukuran={tiba ? "tiba" : "besar"} />
        <div>
          <p
            className={cn(
              "font-papan",
              tiba
                ? "text-display-tiba lg:text-display-tiba-lebar"
                : "text-display lg:text-display-lebar",
            )}
          >
            {nama}
          </p>
          <p
            className={cn(
              "mt-1.5 text-body-kecil text-teks-2",
              tiba ? "lg:text-keterangan lg:whitespace-nowrap" : "lg:text-body",
            )}
          >
            {sub}
          </p>
        </div>
      </div>
      {bukti && (
        <p className="px-4 pb-3.5 text-body leading-[1.3] lg:px-3.5 lg:pb-3 lg:text-body-kecil">
          <b className="mb-0.5 block font-papan text-angka-bukti text-jalur lg:text-angka-bukti-lebar">
            {bukti.angka}
          </b>
          {bukti.teks}
        </p>
      )}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 bg-jalur px-4 py-2.25 text-body-kecil font-semibold text-dasar",
          tiba
            ? "lg:px-3.5 lg:py-2 lg:text-keterangan"
            : "lg:px-6 lg:py-2.5 lg:text-body-sedang",
        )}
      >
        {sebelumnya ? (
          <span className="inline-flex items-center gap-1.5">
            <IkonPanahKiri />
            {sebelumnya.nama}
            <KodeStasiun nomor={sebelumnya.nomor} ukuran="kecil" diPita />
          </span>
        ) : (
          <span className="text-teks-di-jalur">Awal jalur</span>
        )}
        {berikutnya && (
          <span className="inline-flex items-center gap-1.5">
            {berikutnya.nama}
            <KodeStasiun nomor={berikutnya.nomor} ukuran="kecil" diPita />
            <IkonPanahKanan />
          </span>
        )}
      </div>
    </div>
  );
}
