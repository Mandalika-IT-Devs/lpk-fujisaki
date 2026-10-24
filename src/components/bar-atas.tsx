import Link from "next/link";
import { MenuHp, MenuLebar } from "./menu-utama";
import { ALAMAT_MASUK } from "./tautan-situs";

/**
 * Bar atas situs publik (docs/DESIGN.md, Navigation): lengket, merek di kiri, menu dan Masuk di kanan.
 * Merek berupa tulisan "Fujisaki" sampai logo resmi diserahkan (OD-06).
 */
export function BarAtas() {
  return (
    <header className="sticky top-0 z-10 border-b border-garis bg-dasar/96">
      <div className="wadah flex h-15 items-center justify-between gap-4 lg:h-17">
        <Link
          href="/"
          aria-label="Fujisaki Gakuin Center, ke beranda"
          className="flex items-baseline gap-2 no-underline"
        >
          <span className="font-papan text-merek text-oranye">Fujisaki</span>
          <span className="text-keterangan leading-none font-semibold text-teks-2">
            Gakuin Center
          </span>
        </Link>
        <MenuLebar />
        <div className="flex items-center gap-1">
          <Link
            href={ALAMAT_MASUK}
            className="rounded-sudut px-3 py-2.5 font-bold text-jalur no-underline hover:bg-jalur-pucat hover:text-jalur-tua"
          >
            Masuk
          </Link>
          <MenuHp />
        </div>
      </div>
    </header>
  );
}
