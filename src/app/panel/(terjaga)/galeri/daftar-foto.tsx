"use client";

import Image from "next/image";
import { type FormEvent, useActionState } from "react";
import { formatTanggal } from "@/lib/format";
import type { FotoGaleri } from "@/server/foto-galeri";
import { PesanTindakan } from "../pesan-tindakan";
import { hapusFoto } from "./aksi";

// Tindakan di baris daftar: gaya tautan Masuk (docs/DESIGN.md, Buttons), sama seperti di daftar program.
// Judul fotonya ikut dibacakan pembaca layar, misalnya "Hapus Kelas bahasa Jepang N4".
const GAYA_TINDAKAN_BARIS =
  "inline-block min-h-11 cursor-pointer rounded-sudut px-3 py-2.5 font-bold whitespace-nowrap text-jalur no-underline hover:bg-jalur-pucat hover:text-jalur-tua";

/** Foto dan berkasnya terhapus permanen, jadi Admin diminta memastikan dulu. */
function pastikanHapus(judul: string) {
  return (event: FormEvent<HTMLFormElement>) => {
    const yakin = window.confirm(
      `Hapus foto "${judul}"? Foto hilang dari halaman Galeri dan Beranda, dan berkasnya dihapus dari server. Tindakan ini tidak bisa dibatalkan.`,
    );
    if (!yakin) event.preventDefault();
  };
}

/**
 * Semua foto galeri, terbaru di atas, masing-masing dengan foto kecil, judul, tanggal kegiatan, dan tombol Hapus
 * (PRD §3.4). Hasil tindakan tampil di atas daftar. Foto tidak bisa diubah setelah diunggah.
 */
export function DaftarFoto({ daftar }: { daftar: readonly FotoGaleri[] }) {
  const [keadaan, kirim] = useActionState(hapusFoto, { pesan: null });

  return (
    <div className="grid gap-4">
      <PesanTindakan pesan={keadaan.pesan} />
      {daftar.length === 0 ? (
        <p className="max-w-[60ch]">
          Belum ada foto di galeri. Selama kosong, halaman Galeri dan Beranda
          menampilkan bingkai kosong.
        </p>
      ) : (
        <ul aria-label="Foto di galeri" className="border-t-2 border-navy">
          {daftar.map((foto) => (
            <li
              key={foto.id}
              className="grid grid-cols-[96px_1fr] items-center gap-x-4 gap-y-1 border-b border-garis py-3 sm:grid-cols-[128px_1fr_auto]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-sudut bg-jalur-pucat">
                <Image
                  src={`/foto-galeri/${foto.namaBerkas}`}
                  alt={foto.judul}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold wrap-break-word">{foto.judul}</p>
                <p className="text-keterangan text-teks-2">
                  {formatTanggal(foto.tanggalKegiatan)}
                </p>
              </div>
              <form
                action={kirim}
                onSubmit={pastikanHapus(foto.judul)}
                className="col-start-2 -ml-3 sm:col-start-3 sm:ml-0"
              >
                <input type="hidden" name="id" value={foto.id} />
                <button type="submit" className={GAYA_TINDAKAN_BARIS}>
                  Hapus<span className="sr-only"> {foto.judul}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
