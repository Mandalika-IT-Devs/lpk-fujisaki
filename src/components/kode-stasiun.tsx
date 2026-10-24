import { cn } from "@/lib/utils";

/**
 * Lencana kode stasiun (docs/DESIGN.md, Lencana Kode Stasiun): "FG" kecil di atas nomor dua digit.
 * Ukuran besar untuk papan stasiun; ukuran kecil sebaris untuk kepala stasiun dan pita.
 * `diPita` dipakai di atas pita jalur: bingkai dan teksnya putih.
 */
export function KodeStasiun({
  nomor,
  ukuran = "besar",
  diPita = false,
  className,
}: {
  nomor: string;
  ukuran?: "besar" | "kecil";
  diPita?: boolean;
  className?: string;
}) {
  const kecil = ukuran === "kecil";
  return (
    <span
      className={cn(
        "rounded-sudut leading-none",
        kecil
          ? "inline-flex items-baseline gap-1 border-2 px-1.5 py-0.5 align-[2px]"
          : "inline-grid size-13.5 shrink-0 place-items-center content-center border-3 lg:size-15",
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
        className={cn(
          "font-papan font-bold",
          kecil
            ? "text-keterangan leading-none"
            : "text-kode lg:text-kode-lebar",
        )}
      >
        {nomor}
      </b>
      <span className="sr-only">FG {nomor}</span>
    </span>
  );
}
