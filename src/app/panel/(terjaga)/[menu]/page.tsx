import type { Metadata } from "next";
import { metadataMenu, pastikanBolehMembuka } from "../../penjaga";

// Halaman kosong berjudul untuk menu panel yang belum dibangun. Tiket yang membangun sebuah menu
// membuat rute tetapnya sendiri (misalnya panel/(terjaga)/program/page.tsx), yang didahulukan Next.js
// atas rute ini, dan memanggil pastikanBolehMembuka() dan metadataMenu() dengan kunci menunya.

export async function generateMetadata({
  params,
}: PageProps<"/panel/[menu]">): Promise<Metadata> {
  return metadataMenu((await params).menu);
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
