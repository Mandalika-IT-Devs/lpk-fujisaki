"use client";

import { type ReactNode, useEffect, useRef } from "react";

/** Penanda 24px: pusatnya digeser 12px dari pusat titik stasiun. */
const SETENGAH_PENANDA = 12;

/**
 * Wadah peta jalur dengan penanda "kamu di sini" (docs/DESIGN.md, gerak khas).
 *
 * Penanda berjalan dari titik stasiun pertama ke titik terakhir (`data-titik`) mengikuti guliran,
 * lewat animasi `kereta-jalan` di src/app/globals.css yang hanya mengubah `translate`.
 * Komponen ini mengukur pusat kedua titik itu, lalu memasang `data-siap`.
 * Saat gerak dikurangi, peramban tidak mendukung animasi guliran, atau `berjalan` bernilai false,
 * penanda diam di titik pertama.
 */
export function JalurBerkereta({
  berjalan,
  children,
}: {
  berjalan: boolean;
  children: ReactNode;
}) {
  const jalur = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wadah = jalur.current;
    if (!wadah) return;
    let terpasang = true;

    function ukur() {
      if (!wadah) return;
      const titik = wadah.querySelectorAll("[data-titik]");
      const awal = titik[0]?.getBoundingClientRect();
      const akhir = titik[titik.length - 1]?.getBoundingClientRect();
      if (!awal || !akhir) return;
      const r = wadah.getBoundingClientRect();
      const x0 = awal.left + awal.width / 2 - r.left - SETENGAH_PENANDA;
      const y0 = awal.top + awal.height / 2 - r.top - SETENGAH_PENANDA;
      const x1 = akhir.left + akhir.width / 2 - r.left - SETENGAH_PENANDA;
      const y1 = akhir.top + akhir.height / 2 - r.top - SETENGAH_PENANDA;
      const setel = (nama: string, nilai: number) =>
        wadah.style.setProperty(nama, `${Math.round(nilai)}px`);
      setel("--kx0", x0);
      setel("--ky0", y0);
      setel("--dx", x1 - x0);
      setel("--dy", y1 - y0);
      wadah.dataset.siap = "";
    }

    ukur();
    window.addEventListener("resize", ukur);
    // Huruf yang selesai dimuat mengubah tinggi teks, jadi posisi titik diukur ulang.
    document.fonts?.ready.then(() => {
      if (terpasang) ukur();
    });
    return () => {
      terpasang = false;
      window.removeEventListener("resize", ukur);
    };
  }, []);

  return (
    <div
      ref={jalur}
      data-berjalan={berjalan ? "" : undefined}
      className="relative pl-15 [timeline-scope:--jalur] lg:pl-0"
    >
      <span
        aria-hidden="true"
        data-penanda=""
        className="pointer-events-none absolute top-(--ky0) left-(--kx0) z-3 hidden size-6 jalur-siap:block kereta-jalan:animate-kereta"
      >
        <i className="absolute inset-0 rounded-bulat border-4 border-dasar bg-oranye" />
        <span className="absolute bottom-6.5 left-px hidden rotate-180 rounded-sudut-kecil bg-oranye px-1 py-1.75 text-mikro tracking-normal whitespace-nowrap text-navy [writing-mode:vertical-rl] kereta-jalan:block lg:bottom-7.5 lg:left-1/2 lg:-translate-x-1/2 lg:rotate-none lg:px-1.75 lg:py-1.25 lg:[writing-mode:horizontal-tb]">
          Kamu di sini
        </span>
      </span>
      {children}
    </div>
  );
}
