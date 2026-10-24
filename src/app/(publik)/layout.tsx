import type { ReactNode } from "react";
import { BarAtas } from "@/components/bar-atas";
import { KakiHalaman } from "@/components/kaki-halaman";

// Tata letak semua halaman situs publik: bar atas, isi halaman, lalu kaki halaman.
export default function TataLetakPublik({ children }: { children: ReactNode }) {
  return (
    <>
      <BarAtas />
      {children}
      <KakiHalaman />
    </>
  );
}
