import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IkonPanahKanan, IkonPanahKiri } from "./ikon";
import { KodeStasiun } from "./kode-stasiun";

type Stasiun = { nomor: string; nama: string };

/**
 * Papan nama stasiun (docs/DESIGN.md, Cards / Containers): lencana kode besar, nama stasiun, sub-baris,
 * lalu pita jalur dengan penunjuk stasiun sebelumnya dan berikutnya.
 * Seluruh papan dibaca sebagai satu gambar lewat `label`, seperti di prototipe.
 */
export function PapanStasiun({
  label,
  nomor,
  nama,
  sub,
  sebelumnya,
  berikutnya,
  className,
}: {
  label: string;
  nomor: string;
  nama: string;
  sub: ReactNode;
  sebelumnya?: Stasiun;
  berikutnya?: Stasiun;
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
      <div className="flex items-center gap-3.5 px-4 pt-3.5 pb-3 lg:gap-4.5 lg:px-6 lg:pt-4 lg:pb-3.5">
        <KodeStasiun nomor={nomor} />
        <div>
          <p className="font-papan text-display lg:text-display-lebar">
            {nama}
          </p>
          <p className="mt-1.5 text-body-kecil text-teks-2 lg:text-body">
            {sub}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 bg-jalur px-4 py-2.25 text-body-kecil font-semibold text-dasar lg:px-6 lg:py-2.5 lg:text-body-sedang">
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
