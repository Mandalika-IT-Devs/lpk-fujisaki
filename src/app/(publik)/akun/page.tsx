import type { Metadata } from "next";
import Link from "next/link";
import { ChipStatus } from "@/components/chip-status";
import { KodeStasiun, nomorStasiun } from "@/components/kode-stasiun";
import { ALAMAT_FORMULIR_PENDAFTARAN } from "@/components/tautan-situs";
import { TombolUtama } from "@/components/tombol";
import { TAHAP } from "@/domain/tahap";
import { formatTanggal } from "@/lib/format";
import {
  bacaPendaftaranBerjalan,
  bacaPendaftaranDitutup,
  type PendaftaranBerjalan,
  type PendaftaranDitutup,
} from "@/server/pendaftaran";
import { pastikanPemilikAkun } from "../penjaga-akun";
import { keluarAkun } from "./aksi";
import {
  LABEL_ISIAN,
  type NamaIsian,
} from "./formulir-pendaftaran/isian-formulir";
import { PengingatVerifikasiEmail } from "./pengingat-verifikasi-email";

export const metadata: Metadata = { title: "Akunmu" };

/**
 * Halaman akun pemilik akun (issue T11, T13, T16): pendaftaran Berjalan miliknya, atau ajakan mengisi formulir
 * pendaftaran bila tidak ada; pendaftaran miliknya yang Ditutup beserta alasannya (PRD §2.3, ▶ Keputusan OD-14); dan
 * pengingat verifikasi email selama emailnya belum terverifikasi (§5.3). Halaman ini hanya untuk pemilik akun (§2.2).
 */
export default async function HalamanAkun() {
  const pemilikAkun = await pastikanPemilikAkun();
  const [pendaftaran, ditutup] = await Promise.all([
    bacaPendaftaranBerjalan(pemilikAkun.id),
    bacaPendaftaranDitutup(pemilikAkun.id),
  ]);

  return (
    <main className="wadah pt-8 pb-pad lg:pt-12 lg:pb-pad-lebar">
      <div className="grid max-w-2xl gap-6">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="grid gap-1">
            <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
              Halo, {pemilikAkun.nama}
            </h1>
            <p className="text-teks-2">Masuk sebagai {pemilikAkun.email}</p>
          </div>
          <form action={keluarAkun}>
            <button
              type="submit"
              className="cursor-pointer rounded-sudut px-3 py-2.5 font-bold text-jalur hover:bg-jalur-pucat hover:text-jalur-tua"
            >
              Keluar
            </button>
          </form>
        </div>

        {!pemilikAkun.emailTerverifikasi && (
          <PengingatVerifikasiEmail email={pemilikAkun.email} />
        )}

        {pendaftaran ? (
          <KartuPendaftaran pendaftaran={pendaftaran} />
        ) : (
          <section
            aria-labelledby="judul-formulir-pendaftaran"
            className="grid gap-4 rounded-sudut bg-dasar p-4 shadow-papan lg:p-6"
          >
            <div className="grid gap-1">
              <h2
                id="judul-formulir-pendaftaran"
                className="font-papan text-title-kecil"
              >
                Isi formulir pendaftaran
              </h2>
              {ditutup.length > 0 ? (
                <p className="max-w-[60ch]">
                  Pendaftaranmu sudah ditutup, tetapi kamu bisa mendaftar lagi.
                  Formulir dimulai dari isian pendaftaranmu yang terakhir, atau
                  dari draf yang sudah kamu simpan. Periksa isiannya, lalu kirim
                  untuk mendapat nomor pendaftaran baru.
                </p>
              ) : (
                <p className="max-w-[60ch]">
                  Pilih program dan isi data dirimu. Formulir bisa disimpan
                  sebagai draf dan dilanjutkan kapan saja, lalu dikirim bila
                  sudah lengkap.
                </p>
              )}
            </div>
            <TombolUtama
              href={ALAMAT_FORMULIR_PENDAFTARAN}
              className="justify-self-start"
            >
              Isi formulir pendaftaran
            </TombolUtama>
          </section>
        )}

        {ditutup.length > 0 && <DaftarPendaftaranDitutup ditutup={ditutup} />}
      </div>
    </main>
  );
}

/**
 * Pendaftaran pemilik akun yang Ditutup, dari yang paling baru dikirim (PRD §2.3, ▶ Keputusan OD-14): nomor
 * pendaftaran, program, chip status Ditutup, dan alasan penutupannya, tanpa keterangan penutupan.
 */
function DaftarPendaftaranDitutup({
  ditutup,
}: {
  ditutup: PendaftaranDitutup[];
}) {
  return (
    <section aria-labelledby="judul-pendaftaran-ditutup" className="grid gap-3">
      <h2
        id="judul-pendaftaran-ditutup"
        className="font-papan text-title-kecil"
      >
        Pendaftaran yang ditutup
      </h2>
      <ul className="grid gap-4">
        {ditutup.map((pendaftaran) => (
          <li
            key={pendaftaran.nomor}
            className="grid gap-3 rounded-sudut bg-dasar p-4 shadow-papan lg:p-6"
          >
            <div>
              <p className="font-papan text-nomor">{pendaftaran.nomor}</p>
              <p className="mt-1 text-body-kecil text-teks-2">
                {pendaftaran.program}
              </p>
            </div>
            <dl className="grid border-t-2 border-navy sm:grid-cols-2 sm:gap-x-6">
              <div className="border-b border-garis py-3">
                <dt className="text-keterangan font-semibold text-teks-2">
                  Status
                </dt>
                <dd className="mt-0.5">
                  <ChipStatus status={pendaftaran.status} />
                </dd>
              </div>
              <div className="border-b border-garis py-3">
                <dt className="text-keterangan font-semibold text-teks-2">
                  Alasan penutupan
                </dt>
                <dd className="mt-0.5 font-semibold">{pendaftaran.alasan}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Isian formulir pendaftaran seperti yang tersimpan, dalam urutan PRD §6.1, termasuk perubahan oleh pegawai (§6.5).
 * Program dan bidang kerja tampil dengan namanya; isian tidak wajib yang kosong bernilai null.
 */
function isianTampil({
  isian,
  program,
  bidangKerja,
}: PendaftaranBerjalan): [NamaIsian, string | null][] {
  return [
    ["namaLengkap", isian.namaLengkap],
    ["jenisKelamin", isian.jenisKelamin],
    ["tempatLahir", isian.tempatLahir],
    ["tanggalLahir", formatTanggal(isian.tanggalLahir)],
    ["kabupatenKota", isian.kabupatenKota],
    ["provinsi", isian.provinsi],
    ["pendidikanTerakhir", isian.pendidikanTerakhir],
    ["jurusanPendidikan", isian.jurusanPendidikan],
    ["programId", program],
    ["bidangKerja", bidangKerja],
    ["kemampuanBahasaJepang", isian.kemampuanBahasaJepang],
    ["pengalamanKerja", isian.pengalamanKerja],
    ["namaKontakDarurat", isian.namaKontakDarurat],
    ["hubunganKontakDarurat", isian.hubunganKontakDarurat],
    ["nomorHpKontakDarurat", isian.nomorHpKontakDarurat],
  ];
}

/**
 * Kartu akun (docs/DESIGN.md, Cards / Containers) untuk pendaftaran Berjalan (PRD §2.3): nomor pendaftaran, program,
 * chip status Berjalan, tahap saat ini dengan lencana kode stasiun, dan isian formulir pendaftarannya untuk dibaca,
 * termasuk perubahan oleh pegawai (§6.5). Langkah-langkah tahap itu tampil di M2.
 */
function KartuPendaftaran({
  pendaftaran,
}: {
  pendaftaran: PendaftaranBerjalan;
}) {
  const tahap = TAHAP.find(({ nomor }) => nomor === pendaftaran.tahap);
  return (
    <section
      aria-labelledby="judul-pendaftaran"
      className="grid gap-4 rounded-sudut bg-dasar p-4 shadow-papan lg:p-6"
    >
      <h2 id="judul-pendaftaran" className="sr-only">
        Pendaftaranmu
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-papan text-nomor">{pendaftaran.nomor}</p>
          <p className="mt-1 text-body-kecil text-teks-2">
            {pendaftaran.program}
          </p>
        </div>
        <ChipStatus status={pendaftaran.status} />
      </div>
      {tahap && (
        <p className="flex flex-wrap items-center gap-2 font-papan text-title-kecil">
          <KodeStasiun nomor={nomorStasiun(tahap.nomor)} ukuran="kecil" />
          {tahap.nama}
        </p>
      )}
      <div className="mt-2 grid gap-2">
        <h3 className="font-papan text-title-kecil">
          Isian formulir pendaftaranmu
        </h3>
        <dl className="grid border-t-2 border-navy sm:grid-cols-2 sm:gap-x-6">
          {isianTampil(pendaftaran).map(([nama, nilai]) => (
            <div key={nama} className="border-b border-garis py-3">
              <dt className="text-keterangan font-semibold text-teks-2">
                {LABEL_ISIAN[nama]}
              </dt>
              <dd className="mt-0.5 font-semibold whitespace-pre-line">
                {nilai ?? (
                  <span className="font-normal text-teks-2">Tidak diisi</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="max-w-[60ch] text-body-kecil text-teks-2">
        Isian formulir pendaftaranmu terkunci sejak dikirim. Bila ada yang perlu
        diubah, hubungi lembaga lewat halaman <Link href="/kontak">Kontak</Link>
        .
      </p>
    </section>
  );
}
