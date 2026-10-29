import type { ReactNode } from "react";

/**
 * Kartu halaman akses pemilik akun di situs publik: daftar akun, masuk, lupa kata sandi, atur ulang kata sandi, dan
 * verifikasi email. Bentuknya kartu akun (docs/DESIGN.md, Cards / Containers) di atas latar jalur-pucat, seperti
 * halaman akses pegawai, tetapi di bawah bar atas situs publik, jadi tanpa merek sendiri.
 */
export function KartuAksesAkun({
  judul,
  pengantar,
  children,
}: {
  judul: string;
  pengantar: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-jalur-pucat px-tepi py-pad">
      <div className="mx-auto grid max-w-md gap-6 rounded-sudut bg-dasar p-4 shadow-papan lg:p-6">
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
