import type { ReactNode } from "react";
import { TAHAP, type Tahap } from "@/domain/tahap";
import { cn } from "@/lib/utils";
import { JalurBerkereta } from "./jalur-berkereta";
import { KodeStasiun, nomorStasiun } from "./kode-stasiun";

/** Deskripsi singkat setiap stasiun, dari docs/design/prototipe/beranda.html. */
const KALIMAT_STASIUN: Record<number, { ringkasan: string; sorot?: string }> = {
  1: {
    ringkasan:
      "Serahkan berkas di kantor, lalu ikuti pemeriksaan fisik, psikotes, tes matematika, dan pra-MCU.",
  },
  2: {
    // Ujian yang menyelesaikan L2.4 menunggu OD-13; kalimat ini hanya menyebut jenis ujian resmi (GLOSSARY.md).
    ringkasan:
      "Kelas sesuai level, pengenalan budaya Jepang, lalu ujian JFT-Basic atau JLPT. Penutur asli bahasa Jepang rutin datang ke kelas.",
  },
  3: {
    ringkasan:
      "Pelatihan teori dan praktik sesuai bidang kerja, budaya kerja Jepang, lalu ujian keterampilan SSW.",
  },
  4: {
    ringkasan:
      "Wawancara dengan lembaga pendamping dan perusahaan penerima di Jepang, MCU, tanda tangan kontrak kerja, dan pembuatan paspor.",
    sorot:
      "Lembaga ini melatih sekaligus memberangkatkan (P3MI), jadi kamu tidak berpindah tangan.",
  },
  5: {
    ringkasan:
      "Bekerja sementara di perusahaan Indonesia yang sebidang dengan perusahaan penerimamu.",
  },
  6: {
    ringkasan:
      "Review bahasa dan percakapan selama sebulan, COE dan visa terbit, lalu berangkat.",
  },
};

/**
 * Peta jalur enam stasiun FG 01–FG 06, sama dengan enam tahap PRD §7.1 (docs/DESIGN.md, Layout dan
 * Titik Stasiun dan Peta Jalur). Garis jalur 12px tegak di kiri pada HP dan mendatar di layar ≥ 1024px,
 * lalu membelok turun di tepi kanan setelah FG 06.
 *
 * Garis turun sampai ujung bagian pembungkusnya, jadi bagian itu diberi jarak bawah `pb-pad lg:pb-pad-lebar`.
 * `kepala` berisi judul dan pengantar peta; di HP garis mulai dari tepi atas kepala.
 * `isiTambahan` menambah isi di bawah deskripsi setiap stasiun.
 * `penandaBerjalan` membuat penanda "kamu di sini" berjalan mengikuti guliran; bila false, penanda diam di FG 01.
 */
export function PetaJalur({
  kepala,
  isiTambahan,
  penandaBerjalan = true,
}: {
  kepala: ReactNode;
  isiTambahan?: (tahap: Tahap) => ReactNode;
  penandaBerjalan?: boolean;
}) {
  return (
    <JalurBerkereta berjalan={penandaBerjalan}>
      <div
        data-awal-garis=""
        className="relative pt-7 pb-8 before:absolute before:top-0 before:-bottom-4.5 before:-left-10.5 before:w-tebal-jalur before:bg-jalur lg:p-0 lg:before:hidden"
      >
        {kepala}
      </div>
      <ol className="relative [view-timeline:--jalur_block] lg:mt-10 lg:grid lg:grid-cols-[repeat(5,1fr)_1.8fr] lg:gap-7 lg:pt-15 lg:after:absolute lg:after:top-3.5 lg:after:right-0 lg:after:-bottom-pad-lebar lg:after:w-tebal-jalur lg:after:bg-jalur">
        {TAHAP.map((tahap) => {
          const { ringkasan, sorot } = KALIMAT_STASIUN[tahap.nomor];
          const terakhir = tahap.nomor === TAHAP.length;
          return (
            <li
              key={tahap.nomor}
              className={cn(
                "relative pb-10 after:absolute after:top-4.5 after:-bottom-4.5 after:-left-10.5 after:w-tebal-jalur after:bg-jalur",
                "lg:pb-0 lg:after:-top-11.5 lg:after:bottom-auto lg:after:left-4 lg:after:h-tebal-jalur lg:after:w-[calc(100%+28px)]",
                // Sesudah FG 06 garis terus turun (HP) atau membelok di tepi kanan (layar lebar).
                terakhir &&
                  "pb-0 after:-bottom-pad lg:pr-9 lg:after:w-[calc(100%-16px)]",
              )}
            >
              <span
                aria-hidden="true"
                data-titik=""
                className={cn(
                  "absolute z-1 rounded-bulat border-7 border-jalur bg-dasar",
                  terakhir
                    ? "-top-0.5 -left-14 size-10 shadow-[0_0_0_4px_var(--color-dasar),0_0_0_8px_var(--color-jalur)] lg:-top-15 lg:-left-1"
                    : "top-0.5 -left-13 size-8 lg:-top-14 lg:left-0",
                )}
              />
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 lg:min-h-7">
                <KodeStasiun nomor={nomorStasiun(tahap.nomor)} ukuran="kecil" />
                {tahap.nomor === 1 && (
                  <span className="inline-flex items-center rounded-sudut-kecil bg-oranye px-2 py-1.5 text-mikro tracking-normal text-navy kereta-jalan:sr-only">
                    Kamu di sini
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 font-papan text-title">{tahap.nama}</h3>
              <p className="mt-2 max-w-[46ch] text-teks-2 lg:text-body-sedang">
                {ringkasan}
              </p>
              {sorot && (
                <p className="mt-2 max-w-[46ch] font-semibold text-navy lg:text-body-sedang">
                  {sorot}
                </p>
              )}
              {isiTambahan?.(tahap)}
            </li>
          );
        })}
      </ol>
    </JalurBerkereta>
  );
}
