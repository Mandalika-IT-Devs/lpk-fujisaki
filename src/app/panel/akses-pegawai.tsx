import Link from "next/link";
import type { ReactNode } from "react";
import { IkonCentang, IkonSeru } from "@/components/ikon";

// Bagian bersama halaman akses pegawai di luar penjaga panel: masuk, lupa kata sandi, atur ulang kata sandi,
// dan atur kata sandi pegawai baru. Isian dan pesannya juga dipakai halaman Akun pegawai di panel, serta halaman
// akun pemilik akun di situs publik (src/app/(publik)/akses-akun.tsx).

// Isian (docs/DESIGN.md, Inputs / Fields): tinggi 48px, border 2px garis, fokus border jalur dengan halo jalur-muda.
export const GAYA_ISIAN =
  "h-12 w-full rounded-sudut border-2 border-garis bg-dasar px-3 font-medium text-navy hover:border-jalur-muda focus-visible:border-jalur focus-visible:ring-3 focus-visible:ring-jalur-muda focus-visible:outline-none";
export const GAYA_LABEL = "text-body-kecil font-semibold";

// Tautan teks dengan target sentuh 44px (docs/DESIGN.md, Do's).
export const GAYA_TAUTAN = "inline-flex min-h-11 items-center";

const GAYA_KOTAK_PESAN =
  "flex gap-2 rounded-sudut bg-jalur-pucat px-3.5 py-3 text-body-kecil text-navy";

/** Pesan kesalahan isian atau tindakan yang gagal. */
export function Peringatan({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className={GAYA_KOTAK_PESAN}>
      <IkonSeru />
      <p>{children}</p>
    </div>
  );
}

/** Kabar bahwa permintaan sudah diproses (docs/DESIGN.md, Jawaban langsung "Memenuhi": teks navy, ikon jalur). */
export function Kabar({ children }: { children: ReactNode }) {
  return (
    <div role="status" className={GAYA_KOTAK_PESAN}>
      <span className="text-jalur">
        <IkonCentang />
      </span>
      <p>{children}</p>
    </div>
  );
}

/** Kartu di atas latar jalur-pucat dengan merek, satu h1, dan pengantarnya. */
export function KartuAksesPegawai({
  judul,
  pengantar,
  children,
}: {
  judul: string;
  pengantar: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-jalur-pucat px-tepi py-pad">
      <div className="mx-auto grid max-w-md gap-6 rounded-sudut bg-dasar p-4 shadow-papan lg:p-6">
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
        <div className="grid gap-1">
          <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
            {judul}
          </h1>
          <p className="text-teks-2">{pengantar}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
