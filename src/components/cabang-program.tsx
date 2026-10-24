import Link from "next/link";
import { cn } from "@/lib/utils";
import { IkonPanahKanan } from "./ikon";

/** Isi satu cabang program: nama, deskripsi, dan batas usianya (PRD §4.1). */
type ProgramDiCabang = {
  id: number;
  nama: string;
  deskripsi: string;
  usiaMinimal: number;
  usiaMaksimal: number;
};

/**
 * Program sebagai cabang dari garis jalur (docs/DESIGN.md, Layout; prototipe Beranda, bagian program): setiap baris
 * punya ruas biru 6px dari tulang garis ke baris itu, dengan titik 20px di atas tulang. Setiap baris menautkan ke
 * halaman rincian programnya.
 *
 * Pembungkusnya memasang tulang garis: ruang kiri 60px dengan garis 12px berjarak 18px dari kiri di HP, dan ruang
 * kanan 56px dengan garis di tepi kanan pada layar ≥ 1024px.
 */
export function CabangProgram({
  daftar,
  tingkatJudul,
  className,
}: {
  daftar: readonly ProgramDiCabang[];
  tingkatJudul: 2 | 3;
  className?: string;
}) {
  const Judul = tingkatJudul === 2 ? "h2" : "h3";
  return (
    <ul
      aria-label="Daftar program"
      className={cn("border-t-2 border-navy", className)}
    >
      {daftar.map((program) => (
        <li
          key={program.id}
          className={cn(
            "relative grid gap-x-3.5 gap-y-1 border-b border-garis py-5 lg:grid-cols-[1fr_auto] lg:items-start lg:py-6",
            // Ruas cabang 6px dari tulang garis ke baris ini.
            "before:absolute before:top-5.5 before:-left-9 before:h-1.5 before:w-9 before:bg-jalur",
            "lg:before:-right-12.5 lg:before:left-auto lg:before:w-12.5",
            // Titik 20px di atas tulang garis.
            "after:absolute after:top-3.75 after:-left-11.5 after:size-5 after:rounded-bulat after:border-5 after:border-jalur after:bg-dasar",
            "lg:after:-right-15 lg:after:left-auto",
          )}
        >
          <div>
            <Judul className="font-papan text-title">{program.nama}</Judul>
            <p className="mt-1 max-w-[56ch] whitespace-pre-line text-teks-2">
              {program.deskripsi}
            </p>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4.5 gap-y-1.5 text-body-kecil text-navy lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:flex-col lg:items-end lg:text-right">
            <span className="font-semibold">
              Usia {program.usiaMinimal}–{program.usiaMaksimal} tahun
            </span>
            <Link
              href={`/program/${program.id}`}
              className="inline-flex min-h-11 items-center gap-1 font-bold"
            >
              Rincian
              <span className="sr-only"> {program.nama}</span>
              <IkonPanahKanan />
            </Link>
          </p>
        </li>
      ))}
    </ul>
  );
}
