import type { Metadata } from "next";
import type { ReactNode } from "react";
import { nomorStasiun } from "@/components/kode-stasiun";
import { PapanStasiun } from "@/components/papan-stasiun";
import { PetaJalur } from "@/components/peta-jalur";
import { type JenisTanda, TandaStatus } from "@/components/tanda-status";
import { TAHAP } from "@/domain/tahap";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "LPKS Fujisaki Gakuin Center – Dari Cilacap ke Jepang" },
  description:
    "Pelatihan bahasa Jepang dan pengiriman kerja ke Jepang dari Cilacap, lewat enam tahap yang bisa kamu pantau sendiri.",
};

const [TAHAP_1, TAHAP_2, , , TAHAP_5] = TAHAP;

const JUDUL_BAGIAN =
  "max-w-[22ch] font-papan text-headline-bagian text-balance lg:text-headline-bagian-lebar";

/**
 * Beranda (docs/design/prototipe/beranda.html). Garis jalur 12px menjadi tulang halaman:
 * dari peta jalur enam stasiun, garis turun di sisi kiri (HP) atau kanan (layar lebar) bagian berikutnya.
 */
export default function HalamanBeranda() {
  return (
    <main>
      <Pembuka />
      <section
        id="alur"
        aria-labelledby="judul-alur"
        className="pb-pad lg:pt-8 lg:pb-pad-lebar"
      >
        <div className="wadah">
          <PetaJalur
            kepala={
              <div className="lg:grid lg:grid-cols-[auto_1fr] lg:items-end lg:gap-x-10 lg:gap-y-2">
                <h2
                  id="judul-alur"
                  className={cn(
                    JUDUL_BAGIAN,
                    "lg:max-w-none lg:text-headline-alur-lebar",
                  )}
                >
                  Enam stasiun dari Cilacap ke Jepang
                </h2>
                <p className="mt-3 max-w-[60ch] text-teks-2 lg:mt-0 lg:max-w-[64ch] lg:text-body-sedang">
                  Semua program melewati enam stasiun yang sama. Setelah
                  mendaftar, kamu dan orang tuamu bisa melihat sendiri stasiun
                  mana yang sudah dilewati.
                </p>
              </div>
            }
            isiTambahan={(tahap) =>
              tahap.nomor === TAHAP.length && <PapanKedatangan />
            }
          />
        </div>
      </section>
      <BagianPantau />
      {/* Program (T06), Galeri (T09), dan Kontak (T08) menyusul di sini, dengan garis jalur tetap menjadi tulangnya. */}
    </main>
  );
}

function Pembuka() {
  return (
    <section aria-labelledby="judul" className="pt-3.5 pb-2 lg:pt-6">
      {/* Kolom kanan di layar lebar disediakan untuk konter cek usia (T10). */}
      <div className="wadah grid gap-3.5 lg:grid-cols-[7fr_5fr] lg:items-end lg:gap-10">
        <div className="grid gap-3.5 lg:gap-5">
          <h1
            id="judul"
            className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar"
          >
            Dari Cilacap ke Jepang, lewat jalur yang bisa kamu pantau sendiri.
          </h1>
          <PapanStasiun
            label="Papan stasiun FG 01 Cilacap, stasiun awal: pendaftaran dan seleksi. Berikutnya: belajar bahasa Jepang, FG 02."
            nomor={nomorStasiun(TAHAP_1.nomor)}
            nama="Cilacap"
            sub={`Stasiun awal · ${TAHAP_1.nama}`}
            berikutnya={{
              nomor: nomorStasiun(TAHAP_2.nomor),
              nama: TAHAP_2.nama,
            }}
          />
        </div>
      </div>
    </section>
  );
}

/** Papan kedatangan FG 06, pasangan papan Cilacap. Angka alumni ditambahkan oleh statistik lembaga (T07). */
function PapanKedatangan() {
  return (
    <PapanStasiun
      tiba
      label="Papan stasiun FG 06 Jepang, tujuan akhir. Sebelumnya: magang kerja, FG 05."
      nomor={nomorStasiun(TAHAP.length)}
      nama="Jepang"
      sub={
        <>
          <span lang="ja" className="font-jp font-bold">
            日本
          </span>{" "}
          · Tujuan akhir
        </>
      }
      sebelumnya={{ nomor: nomorStasiun(TAHAP_5.nomor), nama: TAHAP_5.nama }}
      className="mt-3.5 max-w-105 lg:max-w-none"
    />
  );
}

const ARTI_TANDA: { jenis: JenisTanda; nama: string; arti: string }[] = [
  {
    jenis: "selesai",
    nama: "Selesai",
    arti: "Langkah atau tahap yang sudah kamu lewati.",
  },
  {
    jenis: "sekarang",
    nama: "Sedang berjalan",
    arti: "Tahap tempatmu sekarang, dan langkah berikutnya.",
  },
  { jenis: "belum", nama: "Belum", arti: "Langkah yang masih menunggu." },
  {
    jenis: "tidak-berlaku",
    nama: "Tidak berlaku",
    arti: "Langkah yang tidak dibutuhkan programmu.",
  },
];

/** Garis jalur sebagai tulang bagian sesudah peta: sisi kiri di HP, sisi kanan di layar lebar. */
const TULANG_GARIS =
  "relative pl-15 before:absolute before:-top-pad before:-bottom-pad before:left-4.5 before:w-tebal-jalur before:bg-jalur lg:pr-14 lg:pl-0 lg:before:-top-pad-lebar lg:before:right-0 lg:before:-bottom-pad-lebar lg:before:left-auto";

function BagianPantau() {
  return (
    <section
      id="pantau"
      aria-labelledby="judul-pantau"
      className="bg-jalur-pucat py-pad lg:py-pad-lebar"
    >
      <div className="wadah">
        <div
          className={cn(
            TULANG_GARIS,
            "grid gap-6 lg:grid-cols-[5fr_7fr] lg:items-start lg:gap-12",
          )}
        >
          <div>
            <h2 id="judul-pantau" className={JUDUL_BAGIAN}>
              Setelah mendaftar, pantau posisimu sendiri
            </h2>
            <p className="mt-3 max-w-[60ch] text-teks-2">
              Di akunmu terlihat stasiun yang sudah dilewati, langkah yang
              sedang berjalan, dan catatan dari staf. Orang tuamu bisa ikut
              melihatnya dari HP yang sama. Begini contohnya:
            </p>
            <ul aria-label="Arti tanda di akun" className="mt-5 grid gap-3">
              {ARTI_TANDA.map(({ jenis, nama, arti }) => (
                <li
                  key={jenis}
                  className="grid grid-cols-[24px_1fr] items-start gap-3"
                >
                  <TandaStatus jenis={jenis} kecil />
                  <p className="text-body-sedang">
                    <b className="block">{nama}</b>
                    <span className="text-teks-2">{arti}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <ContohAkun />
        </div>
      </div>
    </section>
  );
}

/** Contoh akun siswa di tahap 2. Semua isinya contoh, bukan data siapa pun. */
const CONTOH_POSISI: { jenis: JenisTanda; teks: string }[] = [
  { jenis: "selesai", teks: "selesai" },
  { jenis: "sekarang", teks: "tahap saat ini" },
  { jenis: "belum", teks: "belum" },
  { jenis: "belum", teks: "belum" },
  { jenis: "belum", teks: "belum" },
  { jenis: "belum", teks: "belum" },
];

const CONTOH_LANGKAH: { jenis: JenisTanda; keterangan: ReactNode }[] = [
  { jenis: "selesai", keterangan: "Selesai 12-05-2026" },
  { jenis: "selesai", keterangan: "Selesai 20-05-2026" },
  {
    jenis: "sekarang",
    keterangan: (
      <>
        <b className="font-bold text-oranye-teks">Berikutnya</b> · belum
      </>
    ),
  },
  { jenis: "belum", keterangan: "Belum" },
];

function ContohAkun() {
  return (
    <div
      role="group"
      aria-label="Contoh tampilan akun siswa"
      className="grid min-w-0 gap-4 rounded-sudut bg-dasar p-4 shadow-papan lg:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-papan text-nomor">FGC-2026-0037</p>
          <p className="mt-1 text-body-kecil text-teks-2">
            Pemagangan · Pembersihan gedung
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-pil border-2 border-jalur px-2.5 py-1.5 text-label text-jalur before:size-2 before:rounded-bulat before:bg-current">
          Berjalan
        </span>
      </div>

      <ol
        aria-label="Posisi di enam tahap"
        className="relative grid grid-cols-6 pt-1 before:absolute before:top-3.75 before:right-[8%] before:left-[8%] before:h-1.5 before:rounded-batang before:bg-jalur"
      >
        {TAHAP.map(({ nomor }, i) => (
          <li
            key={nomor}
            className={cn(
              "relative grid justify-items-center gap-1.5 text-mikro tracking-normal text-teks-2",
              CONTOH_POSISI[i].jenis === "sekarang" && "text-navy",
            )}
          >
            <TandaStatus jenis={CONTOH_POSISI[i].jenis} />
            {nomorStasiun(nomor)}
            <span className="sr-only"> {CONTOH_POSISI[i].teks}</span>
          </li>
        ))}
      </ol>

      <div>
        <p className="mb-1.5 font-papan text-title-kecil">
          Tahap {nomorStasiun(TAHAP_2.nomor)} · {TAHAP_2.nama}
        </p>
        <ul>
          {TAHAP_2.langkah.map(({ kode, nama }, i) => (
            <li
              key={kode}
              className="grid grid-cols-[24px_1fr] items-start gap-2.5 border-t border-garis py-2.5 first:border-t-0"
            >
              <TandaStatus jenis={CONTOH_LANGKAH[i].jenis} kecil />
              <p className="text-body-sedang">
                {nama}
                <small className="mt-0.5 block text-keterangan text-teks-2">
                  {CONTOH_LANGKAH[i].keterangan}
                </small>
              </p>
            </li>
          ))}
        </ul>
      </div>

      <p className="rounded-sudut bg-jalur-pucat px-3.5 py-3 text-body-kecil">
        <b className="mb-0.5 block text-keterangan font-semibold text-teks-2">
          Catatan untuk siswa
        </b>
        Pengenalan kebiasaan organisasi dimulai Senin depan pukul 08.00 di kelas
        N4-A.
      </p>
      <p className="text-mikro tracking-normal text-teks-2">
        Nama, nomor, dan tanggal di atas hanya contoh.
      </p>
    </div>
  );
}
