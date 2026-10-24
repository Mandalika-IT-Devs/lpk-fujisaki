import Link from "next/link";
import { MENU_KAKI } from "./tautan-situs";

/** Kaki halaman situs publik (docs/DESIGN.md, Navigation): latar jalur, cincin fokus putih. */
export function KakiHalaman() {
  return (
    <footer className="bg-jalur pt-10 pb-7 text-dasar [&_:focus-visible]:outline-dasar">
      <div className="wadah grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="grid gap-1 text-body-kecil text-teks-di-jalur">
          <p className="mb-1 font-papan text-merek-kaki text-dasar">Fujisaki</p>
          <p>
            LPKS Fujisaki Gakuin Center ·{" "}
            <span lang="ja" className="font-jp font-bold">
              藤崎学院センター
            </span>
          </p>
          <p>
            PT Fujisaki Global Inspirasi · lembaga pelatihan kerja dan pengirim
            pekerja ke Jepang (P3MI).
          </p>
        </div>
        <nav
          aria-label="Menu kaki"
          className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-[repeat(3,auto)] sm:justify-start"
        >
          {MENU_KAKI.map(({ href, nama }) => (
            <Link
              key={href}
              href={href}
              className="font-semibold text-dasar no-underline hover:text-dasar hover:underline"
            >
              {nama}
            </Link>
          ))}
        </nav>
        <p className="border-t border-dasar/30 pt-4 text-keterangan text-teks-di-jalur lg:col-span-full">
          © 2026 PT Fujisaki Global Inspirasi
        </p>
      </div>
    </footer>
  );
}
