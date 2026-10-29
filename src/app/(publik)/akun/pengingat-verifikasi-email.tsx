"use client";

import { useActionState } from "react";
import { PesanTindakan } from "@/app/panel/(terjaga)/pesan-tindakan";
import { kirimUlangTautanVerifikasi } from "./aksi";

/**
 * Pengingat verifikasi email di halaman akun, selama email pemilik akun belum terverifikasi (PRD §5.3), dengan
 * tombol untuk meminta tautan baru. Bentuknya catatan (docs/DESIGN.md, Cards / Containers): latar jalur-pucat dan
 * label kecil di atas isinya.
 */
export function PengingatVerifikasiEmail({ email }: { email: string }) {
  const [keadaan, kirim] = useActionState(kirimUlangTautanVerifikasi, {
    pesan: null,
  });

  return (
    <section
      aria-labelledby="judul-verifikasi-email"
      className="grid gap-3 rounded-sudut bg-jalur-pucat px-3.5 py-3"
    >
      <h2
        id="judul-verifikasi-email"
        className="text-keterangan font-semibold text-teks-2"
      >
        Email belum terverifikasi
      </h2>
      <p className="max-w-[60ch]">
        Buka tautan verifikasi yang kami kirim ke <b>{email}</b>. Sebelum
        emailmu terverifikasi, kamu sudah bisa menyusun formulir pendaftaran,
        tetapi belum bisa mengirimnya.
      </p>
      <form action={kirim}>
        <button
          type="submit"
          className="-ml-3 cursor-pointer rounded-sudut px-3 py-2.5 font-bold text-jalur hover:bg-dasar hover:text-jalur-tua"
        >
          Kirim ulang tautan verifikasi
        </button>
      </form>
      <PesanTindakan pesan={keadaan.pesan} />
    </section>
  );
}
