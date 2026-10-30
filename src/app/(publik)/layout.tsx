import type { ReactNode } from "react";
import { BarAtas } from "@/components/bar-atas";
import { KakiHalaman } from "@/components/kaki-halaman";
import { tautanAkunDiBarAtas } from "@/domain/akun";
import { bacaAkunMasuk } from "./penjaga-akun";

/**
 * Tata letak semua halaman situs publik: bar atas, isi halaman, lalu kaki halaman.
 * Bar atas bergantung pada akun yang sedang masuk (PRD §3.1, ▶ Keputusan 2026-10-30), jadi tata letak ini membaca
 * sesi, dan semua halaman situs publik dirender per permintaan, termasuk halaman yang isinya hanya dari kode.
 */
export default async function TataLetakPublik({
  children,
}: {
  children: ReactNode;
}) {
  const masuk = await bacaAkunMasuk();

  return (
    <>
      <BarAtas tautanAkun={tautanAkunDiBarAtas(masuk?.akun ?? null)} />
      {children}
      <KakiHalaman />
    </>
  );
}
