import type { Metadata } from "next";
import { bolehMembukaMenu, cariMenuPanelPegawai } from "@/domain/panel-pegawai";
import { bacaPegawaiMasuk, pastikanBolehMembuka } from "../../penjaga";

// Halaman kosong berjudul untuk menu panel yang belum dibangun. Tiket yang membangun sebuah menu
// membuat rute tetapnya sendiri (misalnya panel/(terjaga)/program/page.tsx), yang didahulukan Next.js
// atas rute ini, dan memanggil pastikanBolehMembuka() dengan kunci menunya.

export async function generateMetadata({
  params,
}: PageProps<"/panel/[menu]">): Promise<Metadata> {
  const pegawai = await bacaPegawaiMasuk();
  const menu = cariMenuPanelPegawai((await params).menu);
  if (!pegawai || !menu) return {};
  const boleh = bolehMembukaMenu(pegawai.peran, menu.kunci);
  return { title: boleh ? menu.nama : "Akses ditolak" };
}

export default async function HalamanMenuPanel({
  params,
}: PageProps<"/panel/[menu]">) {
  const menu = await pastikanBolehMembuka((await params).menu);
  return (
    <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
      {menu.nama}
    </h1>
  );
}
