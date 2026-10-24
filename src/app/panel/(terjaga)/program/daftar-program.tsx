"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Program } from "@/server/program";
import { PesanTindakan } from "../pesan-tindakan";
import { ubahStatusProgram } from "./aksi";

// Tindakan di baris daftar: gaya tautan Masuk (docs/DESIGN.md, Buttons), sama seperti di daftar pegawai.
// Nama programnya ikut dibacakan pembaca layar, misalnya "Ubah Pelajar".
const GAYA_TINDAKAN_BARIS =
  "inline-block min-h-11 cursor-pointer rounded-sudut px-3 py-2.5 font-bold whitespace-nowrap text-jalur no-underline hover:bg-jalur-pucat hover:text-jalur-tua";

/**
 * Semua program dengan batas usia dan statusnya (PRD §4.1, §4.3). Setiap baris punya tautan Ubah dan tombol untuk
 * menonaktifkan atau mengaktifkan kembali; hasilnya tampil di atas daftar. Tidak ada tombol hapus.
 */
export function DaftarProgram({ daftar }: { daftar: readonly Program[] }) {
  const [keadaan, kirim] = useActionState(ubahStatusProgram, { pesan: null });

  return (
    <div className="grid gap-4">
      <PesanTindakan pesan={keadaan.pesan} />
      {/* Di HP daftar bergeser ke samping di dalam bingkainya sendiri, bukan halamannya. Bingkai ini relative
          supaya teks sr-only (posisi absolut) di sel tabel ikut terpotong bingkai, tidak melebarkan halaman. */}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-navy text-body-kecil">
              <th scope="col" className="py-2 pr-4 font-semibold">
                Nama
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                Batas usia
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                Status
              </th>
              <th scope="col" className="py-2">
                <span className="sr-only">Tindakan</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((program) => (
              <tr key={program.id} className="border-b border-garis">
                <th scope="row" className="py-2 pr-4 font-semibold">
                  {program.nama}
                </th>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {program.usiaMinimal}–{program.usiaMaksimal} tahun
                </td>
                <td className="py-2 pr-4">
                  {program.aktif ? "Aktif" : "Nonaktif"}
                </td>
                <td className="py-1">
                  <form action={kirim} className="flex justify-end gap-1">
                    <Link
                      href={`/panel/program/${program.id}`}
                      className={GAYA_TINDAKAN_BARIS}
                    >
                      Ubah<span className="sr-only"> {program.nama}</span>
                    </Link>
                    <input type="hidden" name="id" value={program.id} />
                    <button
                      type="submit"
                      name="tindakan"
                      value={program.aktif ? "nonaktifkan" : "aktifkan"}
                      className={GAYA_TINDAKAN_BARIS}
                    >
                      {program.aktif ? "Nonaktifkan" : "Aktifkan kembali"}
                      <span className="sr-only"> {program.nama}</span>
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
