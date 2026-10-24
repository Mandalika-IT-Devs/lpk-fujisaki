"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { BidangKerja } from "@/server/bidang-kerja";
import { PesanTindakan } from "../pesan-tindakan";
import { ubahStatusBidangKerja } from "./aksi";

// Tindakan di baris daftar: gaya tautan Masuk (docs/DESIGN.md, Buttons), sama seperti di daftar pegawai.
// Nama bidang kerjanya ikut dibacakan pembaca layar, misalnya "Ubah Restoran".
const GAYA_TINDAKAN_BARIS =
  "inline-block min-h-11 cursor-pointer rounded-sudut px-3 py-2.5 font-bold whitespace-nowrap text-jalur no-underline hover:bg-jalur-pucat hover:text-jalur-tua";

/**
 * Semua bidang kerja dengan statusnya (PRD §4.2, §4.3). Setiap baris punya tautan Ubah dan tombol untuk
 * menonaktifkan atau mengaktifkan kembali; hasilnya tampil di atas daftar. Tidak ada tombol hapus.
 */
export function DaftarBidangKerja({
  daftar,
}: {
  daftar: readonly BidangKerja[];
}) {
  const [keadaan, kirim] = useActionState(ubahStatusBidangKerja, {
    pesan: null,
  });

  return (
    <div className="grid gap-4">
      <PesanTindakan pesan={keadaan.pesan} />
      {/* Di HP daftar bergeser ke samping di dalam bingkainya sendiri, bukan halamannya. Bingkai ini relative
          supaya teks sr-only (posisi absolut) di sel tabel ikut terpotong bingkai, tidak melebarkan halaman. */}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-navy text-body-kecil">
              <th scope="col" className="py-2 pr-4 font-semibold">
                Nama
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
            {daftar.map((bidangKerja) => (
              <tr key={bidangKerja.id} className="border-b border-garis">
                <th scope="row" className="py-2 pr-4 font-semibold">
                  {bidangKerja.nama}
                </th>
                <td className="py-2 pr-4">
                  {bidangKerja.aktif ? "Aktif" : "Nonaktif"}
                </td>
                <td className="py-1">
                  <form action={kirim} className="flex justify-end gap-1">
                    <Link
                      href={`/panel/bidang-kerja/${bidangKerja.id}`}
                      className={GAYA_TINDAKAN_BARIS}
                    >
                      Ubah<span className="sr-only"> {bidangKerja.nama}</span>
                    </Link>
                    <input type="hidden" name="id" value={bidangKerja.id} />
                    <button
                      type="submit"
                      name="tindakan"
                      value={bidangKerja.aktif ? "nonaktifkan" : "aktifkan"}
                      className={GAYA_TINDAKAN_BARIS}
                    >
                      {bidangKerja.aktif ? "Nonaktifkan" : "Aktifkan kembali"}
                      <span className="sr-only"> {bidangKerja.nama}</span>
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
