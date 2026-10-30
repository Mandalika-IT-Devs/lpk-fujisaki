import Link from "next/link";
import { MenuHp, MenuLebar } from "./menu-utama";
import { ALAMAT_AKUN, ALAMAT_MASUK } from "./tautan-situs";

/** Tautan akun di kanan bar atas, hasil aturan tautanAkunDiBarAtas di src/domain/akun.ts (PRD §3.1). */
const TAUTAN_AKUN = {
  masuk: { href: ALAMAT_MASUK, tulisan: "Masuk" },
  "akun-saya": { href: ALAMAT_AKUN, tulisan: "Akun saya" },
} as const;

/**
 * Bar atas situs publik (docs/DESIGN.md, Navigation): lengket, merek di kiri, menu dan tautan akun di kanan.
 * Tautan akun bergaya tautan Masuk, baik saat bertuliskan "Masuk" maupun "Akun saya".
 * Merek berupa tulisan "Fujisaki" sampai logo resmi diserahkan (OD-06).
 */
export function BarAtas({
  tautanAkun,
}: {
  tautanAkun: keyof typeof TAUTAN_AKUN;
}) {
  const { href, tulisan } = TAUTAN_AKUN[tautanAkun];
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
            href={href}
            className="rounded-sudut px-3 py-2.5 font-bold text-jalur no-underline hover:bg-jalur-pucat hover:text-jalur-tua"
          >
            {tulisan}
          </Link>
          <MenuHp />
        </div>
      </div>
    </header>
  );
}
