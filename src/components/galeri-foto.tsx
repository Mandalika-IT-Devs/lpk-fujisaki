import Image from "next/image";
import { formatTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FotoGaleri } from "@/server/foto-galeri";

/** Label bingkai kosong dari docs/design/prototipe/beranda.html, bagian galeri. */
const LABEL_BINGKAI_KOSONG = [
  "Kelas bahasa Jepang",
  "Praktik perawatan lansia",
  "Kunjungan penutur asli bahasa Jepang",
];

/** Foto atau bingkai kosong di atas judulnya. */
const GAYA_FOTO = "grid content-start gap-2";

/** Bingkai foto 4:3 bersudut 6px (docs/DESIGN.md, Shapes). */
const BINGKAI = "aspect-[4/3] rounded-sudut";

/** Ikon kamera 32px bergaris 1,5 di bingkai foto kosong (docs/DESIGN.md, Bingkai Foto Kosong). */
function IkonKamera() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-8"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

/**
 * Foto galeri di situs publik (PRD §3.4): setiap foto tampil di bingkai 4:3 lewat next/image, yang mengecilkan
 * ukurannya otomatis, dengan judul dan tanggal kegiatannya. Tanpa foto, tampil tiga bingkai kosong berlabel seperti
 * di prototipe (docs/DESIGN.md, Bingkai Foto Kosong; OD-06). `sizes` adalah lebar tampil foto untuk next/image.
 */
export function GaleriFoto({
  daftar,
  sizes,
  className,
}: {
  daftar: readonly FotoGaleri[];
  sizes: string;
  className?: string;
}) {
  if (daftar.length === 0) {
    return (
      <ul aria-label="Foto kegiatan" className={className}>
        {LABEL_BINGKAI_KOSONG.map((label) => (
          <li key={label} className="snap-start">
            <figure className={GAYA_FOTO}>
              <div
                className={cn(
                  BINGKAI,
                  "grid place-items-center border-[1.5px] border-dashed border-garis bg-jalur-pucat text-lewat",
                )}
              >
                <IkonKamera />
              </div>
              <figcaption className="font-semibold">{label}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul aria-label="Foto kegiatan" className={className}>
      {daftar.map((foto) => (
        <li key={foto.id} className="snap-start">
          <figure className={GAYA_FOTO}>
            <div
              className={cn(BINGKAI, "relative overflow-hidden bg-jalur-pucat")}
            >
              <Image
                src={`/foto-galeri/${foto.namaBerkas}`}
                alt={foto.judul}
                fill
                sizes={sizes}
                className="object-cover"
              />
            </div>
            <figcaption>
              <span className="block font-semibold">{foto.judul}</span>
              <span className="block text-keterangan text-teks-2">
                {formatTanggal(foto.tanggalKegiatan)}
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
