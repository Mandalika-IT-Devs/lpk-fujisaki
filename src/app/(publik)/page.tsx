import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { CabangProgram } from "@/components/cabang-program";
import { GaleriFoto } from "@/components/galeri-foto";
import { nomorStasiun } from "@/components/kode-stasiun";
import { PapanStasiun } from "@/components/papan-stasiun";
import { PetaJalur } from "@/components/peta-jalur";
import { type JenisTanda, TandaStatus } from "@/components/tanda-status";
import { ALAMAT_DAFTAR } from "@/components/tautan-situs";
import { TombolUtama } from "@/components/tombol";
import { TombolWhatsApp } from "@/components/tombol-whatsapp";
import { LEVEL, type Level } from "@/domain/statistik-lembaga";
import { TAHAP, type Tahap } from "@/domain/tahap";
import { formatAngka, formatTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import { daftarFotoGaleri, type FotoGaleri } from "@/server/foto-galeri";
import { bacaKontak, type Kontak } from "@/server/kontak";
import { daftarProgramDiSitusPublik, type Program } from "@/server/program";
import {
  bacaStatistikLembagaDiSitusPublik,
  type StatistikLembagaDiSitusPublik,
} from "@/server/statistik-lembaga";
import { bacaSekarang } from "@/server/waktu";
import { KonterCekUsia } from "./konter-cek-usia";

export const metadata: Metadata = {
  title: { absolute: "LPKS Fujisaki Gakuin Center – Dari Cilacap ke Jepang" },
  description:
    "Pelatihan bahasa Jepang dan pengiriman kerja ke Jepang dari Cilacap, lewat enam tahap yang bisa kamu pantau sendiri.",
};

const [TAHAP_1, TAHAP_2, , , TAHAP_5] = TAHAP;

/** Beranda menampilkan tiga foto galeri terbaru (issue T09). */
const JUMLAH_FOTO_DI_BERANDA = 3;

const JUDUL_BAGIAN =
  "max-w-[22ch] font-papan text-headline-bagian text-balance lg:text-headline-bagian-lebar";

/**
 * Beranda (docs/design/prototipe/beranda.html). Garis jalur 12px menjadi tulang halaman:
 * dari peta jalur enam stasiun, garis turun di sisi kiri (HP) atau kanan (layar lebar) bagian berikutnya.
 * Program aktif (untuk konter cek usia dan bagian program), statistik lembaga, tiga foto galeri terbaru, dan kontak
 * dibaca dari database pada setiap permintaan, jadi perubahan Admin langsung terlihat (PRD §3.1, §3.3, §3.4, §3.5,
 * §4.3). Jam server juga dibaca pada setiap permintaan, sebagai "sekarang" bagi konter cek usia. Angka statistik tampil
 * di stasiun yang relevan: FG 02, FG 03, dan FG 06. Garis berakhir di lingkaran ujung pada loket kontak.
 */
export default async function HalamanBeranda() {
  await connection();
  const [daftarProgram, statistik, daftarFoto, kontak] = await Promise.all([
    daftarProgramDiSitusPublik(),
    bacaStatistikLembagaDiSitusPublik(),
    daftarFotoGaleri(JUMLAH_FOTO_DI_BERANDA),
    bacaKontak(),
  ]);
  const sekarang = bacaSekarang();

  return (
    <main>
      <Pembuka daftarProgram={daftarProgram} sekarang={sekarang} />
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
            isiTambahan={(tahap) => (
              <IsiStasiun tahap={tahap} statistik={statistik} />
            )}
          />
        </div>
      </section>
      <BagianPantau />
      {daftarProgram.length > 0 && <BagianProgram daftar={daftarProgram} />}
      <BagianGaleri
        daftar={daftarFoto}
        sesudahProgram={daftarProgram.length > 0}
      />
      <BagianLoket kontak={kontak} />
    </main>
  );
}

/**
 * Pembuka: judul, papan stasiun FG 01, lalu konter cek usia dengan tombol utama, semuanya terlihat di 390×844 tanpa
 * menggulir. Di layar lebar papan di kolom kiri dan konter di kolom kanan (docs/DESIGN.md, Layout).
 */
function Pembuka({
  daftarProgram,
  sekarang,
}: {
  daftarProgram: readonly Program[];
  sekarang: Date;
}) {
  return (
    <section aria-labelledby="judul" className="pt-3.5 pb-2 lg:pt-6">
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
        <KonterCekUsia
          daftarProgram={daftarProgram.map(
            ({ id, nama, usiaMinimal, usiaMaksimal }) => ({
              id,
              nama,
              usiaMinimal,
              usiaMaksimal,
            }),
          )}
          sekarang={sekarang}
        />
      </div>
    </section>
  );
}

/**
 * Isi tambahan setiap stasiun peta jalur: siswa per level di FG 02, siswa per bidang kerja di FG 03, dan papan
 * kedatangan FG 06 dengan jumlah alumni. Tanpa statistik lembaga, hanya papan kedatangan yang tampil.
 */
function IsiStasiun({
  tahap,
  statistik,
}: {
  tahap: Tahap;
  statistik: StatistikLembagaDiSitusPublik | undefined;
}) {
  if (tahap.nomor === TAHAP.length) {
    return (
      <>
        <PapanKedatangan alumniDiJepang={statistik?.alumniDiJepang} />
        {statistik && (
          <p className="mt-2 text-keterangan text-teks-2">
            Data per {formatTanggal(statistik.dataPer)}.
          </p>
        )}
      </>
    );
  }
  if (!statistik) return null;
  if (tahap.nomor === 2) return <SiswaPerLevel statistik={statistik} />;
  if (tahap.nomor === 3 && statistik.perBidangKerja.length > 0) {
    return <SiswaPerBidangKerja perBidangKerja={statistik.perBidangKerja} />;
  }
  return null;
}

const GAYA_DATA = "mt-3.5 max-w-105 lg:max-w-none";
const GAYA_JUDUL_DATA = "text-keterangan font-semibold text-teks-2";

/** Tingkatan warna grafik batang dari N5 ke N2 (docs/DESIGN.md, Colors). */
const WARNA_LEVEL: Record<Level, string> = {
  N5: "bg-jalur-muda",
  N4: "bg-jalur-sedang",
  N3: "bg-jalur",
  N2: "bg-jalur-tua",
};

/** Lebar sebuah bagian terhadap keseluruhan, dalam persen; 0 bila keseluruhannya 0. */
function persen(bagian: number, keseluruhan: number): string {
  return `${keseluruhan === 0 ? 0 : (bagian / keseluruhan) * 100}%`;
}

/** FG 02: total siswa dari aturan domain, grafik batang bertingkat per level, dan legendanya. */
function SiswaPerLevel({
  statistik,
}: {
  statistik: StatistikLembagaDiSitusPublik;
}) {
  const { perLevel, totalSiswa } = statistik;
  return (
    <div className={GAYA_DATA}>
      <p className={GAYA_JUDUL_DATA}>
        Siswa di kelas sekarang: {formatAngka(totalSiswa)}
      </p>
      <div
        role="img"
        aria-label={LEVEL.map(
          (level) => `${level} ${formatAngka(perLevel[level])} siswa`,
        ).join(", ")}
        className="my-2 flex h-3.5 overflow-hidden rounded-batang bg-jalur-pucat"
      >
        {LEVEL.map((level) => (
          <span
            key={level}
            className={cn("h-full", WARNA_LEVEL[level])}
            style={{ width: persen(perLevel[level], totalSiswa) }}
          />
        ))}
      </div>
      <ul
        aria-label="Siswa per level"
        className="flex flex-wrap gap-x-3.5 gap-y-1 text-body-kecil lg:text-keterangan"
      >
        {LEVEL.map((level) => (
          <li key={level} className="inline-flex items-center gap-1.5">
            <i
              aria-hidden="true"
              className={cn("size-2.5 rounded-batang", WARNA_LEVEL[level])}
            />
            {level} {formatAngka(perLevel[level])}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** FG 03: jumlah siswa per bidang kerja aktif, dengan batang minat sepanjang angka terbesar. */
function SiswaPerBidangKerja({
  perBidangKerja,
}: {
  perBidangKerja: StatistikLembagaDiSitusPublik["perBidangKerja"];
}) {
  const terbanyak = Math.max(...perBidangKerja.map((b) => b.jumlahSiswa));
  return (
    <div className={GAYA_DATA}>
      <p id="judul-minat" className={GAYA_JUDUL_DATA}>
        Bidang kerja yang paling diminati siswa
      </p>
      <ul aria-labelledby="judul-minat" className="mt-2 grid gap-1.5">
        {perBidangKerja.map(({ bidangKerjaId, nama, jumlahSiswa }) => (
          <li
            key={bidangKerjaId}
            className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-body-kecil lg:text-keterangan"
          >
            <span>{nama}</span>
            <b className="font-bold">{formatAngka(jumlahSiswa)}</b>
            <i
              aria-hidden="true"
              className="col-span-full h-1.5 rounded-batang bg-jalur-muda"
              style={{ width: persen(jumlahSiswa, terbanyak) }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Papan kedatangan FG 06, pasangan papan Cilacap, dengan jumlah alumni di Jepang dari statistik lembaga. */
function PapanKedatangan({ alumniDiJepang }: { alumniDiJepang?: number }) {
  const bukti =
    alumniDiJepang === undefined
      ? undefined
      : {
          angka: `${formatAngka(alumniDiJepang)} alumni`,
          teks: "sudah tiba di sini sejak 2019.",
        };
  return (
    <PapanStasiun
      tiba
      label={[
        "Papan stasiun FG 06 Jepang, tujuan akhir.",
        bukti && `${bukti.angka} ${bukti.teks}`,
        "Sebelumnya: magang kerja, FG 05.",
      ]
        .filter(Boolean)
        .join(" ")}
      bukti={bukti}
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

const ANGKA = [
  "Nol",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
];

/** Program aktif sebagai cabang dari garis jalur. Judulnya menyebut jumlah program aktif, misalnya "Empat program". */
function BagianProgram({ daftar }: { daftar: readonly Program[] }) {
  const jumlah = ANGKA[daftar.length] ?? String(daftar.length);
  return (
    <section
      id="program"
      aria-labelledby="judul-program"
      className="py-pad lg:py-pad-lebar"
    >
      <div className="wadah">
        <div className={TULANG_GARIS}>
          <h2 id="judul-program" className={JUDUL_BAGIAN}>
            {jumlah} program, satu jalur
          </h2>
          <p className="mt-3 max-w-[60ch] text-teks-2">
            Setiap program bercabang dari jalur yang sama dan melewati enam
            stasiun yang sama.
          </p>
          <CabangProgram daftar={daftar} tingkatJudul={3} className="mt-7" />
        </div>
      </div>
    </section>
  );
}

/**
 * Galeri di Beranda (docs/design/prototipe/beranda.html, bagian galeri): tiga foto terbaru, atau tiga bingkai kosong
 * berlabel selama belum ada foto (OD-06). Di HP foto bergeser mendatar dengan snap (kolom 78%), di layar lebar menjadi
 * tiga kolom. Sesudah bagian program, jarak atasnya sudah diberi bagian program.
 */
function BagianGaleri({
  daftar,
  sesudahProgram,
}: {
  daftar: readonly FotoGaleri[];
  sesudahProgram: boolean;
}) {
  return (
    <section
      id="galeri"
      aria-labelledby="judul-galeri"
      className={cn(
        "pb-pad lg:pb-pad-lebar",
        !sesudahProgram && "pt-pad lg:pt-pad-lebar",
      )}
    >
      <div className="wadah">
        <div className={TULANG_GARIS}>
          <h2 id="judul-galeri" className={JUDUL_BAGIAN}>
            Kegiatan di lembaga
          </h2>
          <p className="mt-3 max-w-[60ch] text-teks-2">
            {daftar.length > 0 ? (
              <>
                Foto kegiatan terbaru di lembaga. Foto lainnya ada di halaman{" "}
                <Link href="/galeri">Galeri</Link>.
              </>
            ) : (
              "Foto kegiatan tampil di sini setelah lembaga memilih foto yang orangnya sudah setuju dipublikasikan."
            )}
          </p>
          <GaleriFoto
            daftar={daftar}
            sizes="(min-width: 1024px) 360px, 78vw"
            className="mt-7 -mr-tepi grid auto-cols-[78%] grid-flow-col gap-3 overflow-x-auto pr-tepi pb-2 snap-x snap-mandatory lg:mr-0 lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible lg:pr-0 lg:pb-0"
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Ujung garis di loket: garis turun dari bagian sebelumnya dan berhenti di pusat lingkaran ujung (30px dari atas),
 * di sisi kiri (HP) atau kanan (layar lebar).
 */
const GARIS_KE_UJUNG =
  "relative pl-15 before:absolute before:-top-pad before:left-4.5 before:h-[calc(var(--spacing-pad)+30px)] before:w-tebal-jalur before:bg-jalur lg:pr-14 lg:pl-0 lg:before:-top-pad-lebar lg:before:right-0 lg:before:left-auto lg:before:h-[calc(var(--spacing-pad-lebar)+30px)]";

/**
 * Loket di ujung garis (docs/design/prototipe/beranda.html, bagian kontak): alamat dari kontak lembaga, tombol utama
 * "Daftar sekarang" yang diulang dari konter, dan tombol "Chat WhatsApp" ke nomor WhatsApp kantor (PRD §3.5).
 */
function BagianLoket({ kontak }: { kontak: Kontak | undefined }) {
  return (
    <section
      id="kontak"
      aria-labelledby="judul-kontak"
      className="bg-jalur-pucat pt-pad pb-18 lg:pt-pad-lebar"
    >
      <div className="wadah">
        <div
          className={cn(
            GARIS_KE_UJUNG,
            "grid gap-5 lg:grid-cols-[7fr_5fr] lg:items-end",
          )}
        >
          <span
            aria-hidden="true"
            className="absolute top-2.5 left-1 z-1 size-10 rounded-bulat border-7 border-jalur bg-dasar shadow-[0_0_0_4px_var(--color-dasar),0_0_0_8px_var(--color-jalur)] lg:-right-3.5 lg:left-auto"
          />
          <div>
            <h2 id="judul-kontak" className={JUDUL_BAGIAN}>
              Datang ke loket kami di Kesugihan
            </h2>
            {kontak && (
              <p className="mt-3 max-w-[34ch] text-body-lebar">
                {kontak.alamat}
              </p>
            )}
          </div>
          <TombolWhatsApp
            nomor={kontak?.nomorWhatsApp ?? null}
            aksiLain={
              <TombolUtama href={ALAMAT_DAFTAR}>Daftar sekarang</TombolUtama>
            }
            className="lg:justify-items-end lg:text-right"
          />
        </div>
      </div>
    </section>
  );
}
