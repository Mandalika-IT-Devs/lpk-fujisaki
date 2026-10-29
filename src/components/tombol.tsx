import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IkonPanahKanan } from "./ikon";

const TRANSISI =
  "[transition:background-color_160ms_var(--ease-papan),transform_120ms_var(--ease-papan)]";

const GAYA_UTAMA = cn(
  "inline-flex h-13.5 items-center justify-center gap-2 rounded-sudut bg-oranye px-6 font-sans text-tombol text-dasar no-underline",
  "hover:bg-oranye-tekan hover:text-dasar focus-visible:outline-navy active:translate-y-px",
  TRANSISI,
);

/**
 * Tombol utama (docs/DESIGN.md, Buttons): oranye, satu per tampilan, dengan panah di kanan.
 */
export function TombolUtama({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(GAYA_UTAMA, className)}>
      {children}
      <IkonPanahKanan />
    </Link>
  );
}

/** Nama dan nilai tombol kirim, yang ikut terkirim bersama formulirnya, untuk formulir dengan lebih dari satu tombol. */
type PropsTombolKirim = { children: ReactNode; name?: string; value?: string };

/** Tombol utama yang mengirim formulirnya. */
export function TombolKirim({ children, name, value }: PropsTombolKirim) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={cn(GAYA_UTAMA, "cursor-pointer")}
    >
      {children}
      <IkonPanahKanan />
    </button>
  );
}

const GAYA_KEDUA =
  "inline-flex h-12.5 items-center justify-center gap-2 rounded-sudut border-2 bg-dasar px-5 font-sans text-tombol-kedua no-underline";
const GAYA_KEDUA_AKTIF = cn(
  "border-jalur text-jalur hover:bg-jalur-pucat hover:text-jalur-tua",
  TRANSISI,
);

/** Tombol kedua (docs/DESIGN.md, Buttons) yang mengirim formulirnya, di samping tombol utama formulir itu. */
export function TombolKirimKedua({ children, name, value }: PropsTombolKirim) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={cn(GAYA_KEDUA, GAYA_KEDUA_AKTIF, "cursor-pointer")}
    >
      {children}
    </button>
  );
}

type PropsTombolKedua = {
  children: ReactNode;
  className?: string;
} & ({ href: string; nonaktif?: false } | { href?: never; nonaktif: true });

/**
 * Tombol kedua (docs/DESIGN.md, Buttons): putih bergaris jalur.
 * Keadaan nonaktif tidak menuju ke mana pun dan ditandai `aria-disabled`.
 */
export function TombolKedua({
  href,
  nonaktif,
  children,
  className,
}: PropsTombolKedua) {
  if (nonaktif) {
    return (
      <a
        role="link"
        aria-disabled="true"
        className={cn(
          GAYA_KEDUA,
          "cursor-not-allowed border-garis text-lewat hover:text-lewat",
          className,
        )}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cn(GAYA_KEDUA, GAYA_KEDUA_AKTIF, className)}>
      {children}
    </Link>
  );
}
