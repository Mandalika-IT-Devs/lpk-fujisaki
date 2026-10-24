"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { IkonMenu } from "./ikon";
import { MENU_UTAMA } from "./tautan-situs";

const GAYA_TAUTAN =
  "font-semibold text-navy no-underline hover:text-jalur hover:underline aria-[current=page]:text-jalur";

/** Menu utama untuk layar ≥ 1024px. */
export function MenuLebar() {
  const halaman = usePathname();
  return (
    <nav aria-label="Menu utama" className="hidden gap-7 lg:flex">
      {MENU_UTAMA.map(({ href, nama }) => (
        <Link
          key={href}
          href={href}
          aria-current={halaman === href ? "page" : undefined}
          className={GAYA_TAUTAN}
        >
          {nama}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Menu buka-tutup untuk layar < 1024px. Memakai <details>, jadi sudah bisa dibuka sebelum JavaScript termuat.
 * Setelah tautannya dipilih, menu ditutup karena tata letak tidak dimuat ulang saat pindah halaman.
 */
export function MenuHp() {
  const menu = useRef<HTMLDetailsElement>(null);
  const halaman = usePathname();
  return (
    <details ref={menu} className="relative lg:hidden">
      <summary
        aria-label="Buka menu"
        className="grid size-11 cursor-pointer list-none place-items-center rounded-sudut text-navy hover:bg-jalur-pucat [&::-webkit-details-marker]:hidden"
      >
        <IkonMenu />
      </summary>
      <nav
        aria-label="Menu utama"
        className="absolute top-13 right-0 z-10 grid w-60 rounded-sudut border border-garis bg-dasar p-2 shadow-papan"
      >
        {MENU_UTAMA.map(({ href, nama }) => (
          <Link
            key={href}
            href={href}
            aria-current={halaman === href ? "page" : undefined}
            onClick={() => menu.current?.removeAttribute("open")}
            className={`${GAYA_TAUTAN} rounded-sudut-kecil p-3`}
          >
            {nama}
          </Link>
        ))}
      </nav>
    </details>
  );
}
