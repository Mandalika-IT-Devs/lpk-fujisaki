"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Menu panel pegawai. Daftarnya sudah disaring menurut peran di server. */
export function MenuPanel({
  menu,
}: {
  menu: readonly { alamat: string; nama: string }[];
}) {
  const halaman = usePathname();
  return (
    <nav aria-label="Menu panel pegawai">
      <ul className="flex flex-wrap gap-1 lg:grid">
        {menu.map(({ alamat, nama }) => (
          <li key={alamat}>
            <Link
              href={alamat}
              aria-current={halaman === alamat ? "page" : undefined}
              className="block rounded-sudut-kecil px-3 py-2.5 font-semibold text-navy no-underline hover:bg-jalur-pucat hover:text-jalur aria-[current=page]:bg-jalur-pucat aria-[current=page]:text-jalur"
            >
              {nama}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
