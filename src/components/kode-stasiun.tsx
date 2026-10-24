import { cn } from "@/lib/utils";

/** Nomor tahap 1–6 sebagai nomor dua digit pada kode stasiun, misalnya 1 → "01" (FG 01). */
export function nomorStasiun(nomorTahap: number): string {
  return String(nomorTahap).padStart(2, "0");
}

const UKURAN = {
  besar:
    "inline-grid size-13.5 shrink-0 place-items-center content-center border-3 lg:size-15",
  // Papan kedatangan FG 06: 50px di HP, 46px di layar lebar karena papan duduk di kolom FG 06.
  tiba: "inline-grid size-12.5 shrink-0 place-items-center content-center border-3 lg:size-11.5",
  kecil: "inline-flex items-baseline gap-1 border-2 px-1.5 py-0.5 align-[2px]",
};

const UKURAN_NOMOR = {
  besar: "text-kode lg:text-kode-lebar",
  // docs/DESIGN.md: 22px untuk lencana di papan kedatangan di layar lebar, yaitu ukuran token nomor.
  tiba: "text-kode lg:text-nomor",
  kecil: "text-keterangan leading-none",
};

/**
 * Lencana kode stasiun (docs/DESIGN.md, Lencana Kode Stasiun): "FG" kecil di atas nomor dua digit.
 * Ukuran besar untuk papan stasiun, ukuran tiba untuk papan kedatangan FG 06,
 * dan ukuran kecil sebaris untuk kepala stasiun dan pita.
 * `diPita` dipakai di atas pita jalur: bingkai dan teksnya putih.
 */
export function KodeStasiun({
  nomor,
  ukuran = "besar",
  diPita = false,
  className,
}: {
  nomor: string;
  ukuran?: "besar" | "tiba" | "kecil";
  diPita?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-sudut leading-none",
        UKURAN[ukuran],
        diPita
          ? "border-dasar bg-transparent text-dasar"
          : "border-jalur bg-dasar text-navy",
        className,
      )}
    >
      <small
        aria-hidden="true"
        className={cn("text-mikro", diPita ? "text-dasar" : "text-jalur")}
      >
        FG
      </small>
      <b
        aria-hidden="true"
        className={cn("font-papan font-bold", UKURAN_NOMOR[ukuran])}
      >
        {nomor}
      </b>
      <span className="sr-only">FG {nomor}</span>
    </span>
  );
}
