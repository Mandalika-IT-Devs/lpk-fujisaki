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

/** Tombol utama yang mengirim formulirnya. */
export function TombolKirim({ children }: { children: ReactNode }) {
  return (
    <button type="submit" className={cn(GAYA_UTAMA, "cursor-pointer")}>
      {children}
      <IkonPanahKanan />
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
  const bentuk =
    "inline-flex h-12.5 items-center justify-center gap-2 rounded-sudut border-2 bg-dasar px-5 font-sans text-tombol-kedua no-underline";

  if (nonaktif) {
    return (
      <a
        role="link"
        aria-disabled="true"
        className={cn(
          bentuk,
          "cursor-not-allowed border-garis text-lewat hover:text-lewat",
          className,
        )}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        bentuk,
        "border-jalur text-jalur hover:bg-jalur-pucat hover:text-jalur-tua",
        TRANSISI,
        className,
      )}
    >
      {children}
    </Link>
  );
}
