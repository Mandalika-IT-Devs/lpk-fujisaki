"use client";

import { useActionState } from "react";
import type { BarisPegawai } from "@/server/akun-pegawai";
import { ubahAkunPegawai } from "./aksi";
import { PesanTindakan } from "../pesan-tindakan";

const NAMA_PERAN = { admin: "Admin", staf: "Staf" } as const;

// Tombol tindakan di baris daftar: gaya tautan Masuk (docs/DESIGN.md, Buttons), sama seperti tombol Keluar.
const GAYA_TOMBOL_BARIS =
  "min-h-11 cursor-pointer rounded-sudut px-3 py-2.5 font-bold whitespace-nowrap text-jalur hover:bg-jalur-pucat hover:text-jalur-tua";

/**
 * Daftar pegawai dengan nama, email, peran, dan status (PRD §5.5). Setiap baris punya tombol untuk mengubah
 * peran dan untuk menonaktifkan atau mengaktifkan kembali; hasilnya tampil di atas daftar.
 */
export function DaftarPegawai({ daftar }: { daftar: readonly BarisPegawai[] }) {
  const [keadaan, kirim] = useActionState(ubahAkunPegawai, { pesan: null });

  return (
    <div className="grid gap-4">
      <PesanTindakan pesan={keadaan.pesan} />
      {/* Di HP daftar bergeser ke samping di dalam bingkainya sendiri, bukan halamannya. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-navy text-body-kecil">
              <th scope="col" className="py-2 pr-4 font-semibold">
                Nama
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                Email
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                Peran
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
            {daftar.map((pegawai) => (
              <tr key={pegawai.id} className="border-b border-garis">
                <th scope="row" className="py-2 pr-4 font-semibold">
                  {pegawai.nama}
                </th>
                <td className="py-2 pr-4 whitespace-nowrap">{pegawai.email}</td>
                <td className="py-2 pr-4">{NAMA_PERAN[pegawai.peran]}</td>
                <td className="py-2 pr-4">
                  {pegawai.aktif ? "Aktif" : "Nonaktif"}
                </td>
                <td className="py-1">
                  <form action={kirim} className="flex justify-end gap-1">
                    <input type="hidden" name="id" value={pegawai.id} />
                    <button
                      type="submit"
                      name="tindakan"
                      value={
                        pegawai.peran === "admin"
                          ? "jadikan-staf"
                          : "jadikan-admin"
                      }
                      className={GAYA_TOMBOL_BARIS}
                    >
                      {pegawai.peran === "admin"
                        ? "Jadikan Staf"
                        : "Jadikan Admin"}
                      <span className="sr-only">, {pegawai.nama}</span>
                    </button>
                    <button
                      type="submit"
                      name="tindakan"
                      value={pegawai.aktif ? "nonaktifkan" : "aktifkan"}
                      className={GAYA_TOMBOL_BARIS}
                    >
                      {pegawai.aktif ? "Nonaktifkan" : "Aktifkan kembali"}
                      <span className="sr-only">, {pegawai.nama}</span>
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
