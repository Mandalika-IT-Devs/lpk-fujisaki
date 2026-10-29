import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { IkonPanahKiri } from "@/components/ikon";
import { KodeStasiun, nomorStasiun } from "@/components/kode-stasiun";
import { type JenisTanda, TandaStatus } from "@/components/tanda-status";
import type { StatusLangkah } from "@/domain/pendaftaran";
import { bolehMenghapusPermanen } from "@/domain/penghapusan";
import { alasanPenutupanDiTahap, bisaDitutup } from "@/domain/penutupan";
import { TAHAP } from "@/domain/tahap";
import { bacaPilihanUbahIsian } from "@/server/formulir-pendaftaran";
import { bacaLangkahPendaftaran, bacaPendaftaran } from "@/server/pendaftaran";
import {
  keIdPilihan,
  keIsianFormulir,
} from "@/app/(publik)/akun/formulir-pendaftaran/isian-formulir";
import {
  metadataMenu,
  pastikanBolehMembuka,
  pastikanPegawai,
} from "../../../penjaga";
import { skemaNomorPendaftaran } from "../alamat-pendaftaran";
import { ALAMAT_DAFTAR_PENDAFTARAN } from "../saringan";
import { FormulirHapusPermanen } from "./formulir-hapus-permanen";
import { FormulirTutupPendaftaran } from "./formulir-tutup-pendaftaran";
import { FormulirUbahIsian } from "./formulir-ubah-isian";

const KUNCI_MENU = "pendaftaran";

const GAYA_JUDUL_BAGIAN =
  "max-w-[22ch] font-papan text-headline-bagian text-balance lg:text-headline-bagian-lebar";

export async function generateMetadata({
  params,
}: PageProps<"/panel/pendaftaran/[nomor]">): Promise<Metadata> {
  const nomor = skemaNomorPendaftaran.safeParse((await params).nomor);
  return metadataMenu(
    KUNCI_MENU,
    nomor.success ? `Pendaftaran ${nomor.data}` : "Pendaftaran",
  );
}

/** Tanda status setiap status langkah (docs/DESIGN.md, Tanda Status). */
const TANDA_LANGKAH: Record<StatusLangkah, JenisTanda> = {
  Belum: "belum",
  Selesai: "selesai",
  "Tidak berlaku": "tidak-berlaku",
};

/** Satu baris ringkasan: label kecil di atas isinya, seperti rincian program di situs publik. */
function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-garis py-3">
      <dt className="text-keterangan font-semibold text-teks-2">{label}</dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  );
}

/**
 * Halaman satu pendaftaran untuk Staf dan Admin (PRD §11.2, bagian isian formulir dan penutupan): nomor pendaftaran,
 * status, tahap, langkah tahap 1 beserta statusnya (hanya untuk dibaca), isian formulir pendaftaran yang bisa diubah
 * pegawai (§2.2, §6.5), dan penutupan (§7.5). Program dan bidang kerja yang tercatat tetap bisa dipilih meski sudah
 * dinonaktifkan (§4.3), dan ditandai nonaktif. Pendaftaran Berjalan bisa ditutup dari sini; pendaftaran yang Ditutup
 * menampilkan alasan dan keterangan penutupannya, tanpa cara membukanya kembali. Hanya Admin yang melihat bagian hapus
 * permanen (§2.2, §12.5).
 */
export default async function HalamanPendaftaran({
  params,
}: PageProps<"/panel/pendaftaran/[nomor]">) {
  await pastikanBolehMembuka(KUNCI_MENU);
  const pegawai = await pastikanPegawai();
  const nomor = skemaNomorPendaftaran.safeParse((await params).nomor);
  const pendaftaran = nomor.success
    ? await bacaPendaftaran(nomor.data)
    : undefined;
  if (!pendaftaran) notFound();

  const [pilihan, langkah] = await Promise.all([
    bacaPilihanUbahIsian(pendaftaran.isian),
    bacaLangkahPendaftaran(pendaftaran.nomor),
  ]);
  const tandaiNonaktif = ({
    id,
    nama,
    aktif,
  }: {
    id: number;
    nama: string;
    aktif: boolean;
  }) => ({ id, nama: aktif ? nama : `${nama} (nonaktif)` });
  const pilihanTampil = {
    program: pilihan.program.map(tandaiNonaktif),
    bidangKerja: pilihan.bidangKerja.map(tandaiNonaktif),
  };
  const tahap = TAHAP.find(({ nomor }) => nomor === pendaftaran.tahap);
  const [tahap1] = TAHAP;
  const statusLangkah = new Map(
    langkah.map(({ kode, status }) => [kode, status]),
  );
  const { penutupan } = pendaftaran;

  return (
    <div className="grid max-w-2xl gap-10">
      <div className="grid gap-1">
        <Link
          href={ALAMAT_DAFTAR_PENDAFTARAN}
          className="-ml-3 inline-flex min-h-11 items-center gap-1 justify-self-start rounded-sudut px-3 py-2.5 font-bold no-underline hover:bg-jalur-pucat"
        >
          <IkonPanahKiri />
          Daftar pendaftaran
        </Link>
        <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
          {pendaftaran.nomor}
        </h1>
        <section aria-label="Ringkasan pendaftaran" className="mt-4">
          <dl className="grid border-t-2 border-navy sm:grid-cols-2 sm:gap-x-6">
            <Baris label="Nama lengkap">{pendaftaran.isian.namaLengkap}</Baris>
            <Baris label="Program">{pendaftaran.program}</Baris>
            <Baris label="Status">{pendaftaran.status}</Baris>
            <Baris label="Tahap">
              {tahap && (
                <span className="flex flex-wrap items-center gap-2">
                  <KodeStasiun
                    nomor={nomorStasiun(tahap.nomor)}
                    ukuran="kecil"
                  />
                  {tahap.nama}
                </span>
              )}
            </Baris>
            {penutupan && (
              <>
                <Baris label="Alasan penutupan">{penutupan.alasan}</Baris>
                <Baris label="Keterangan penutupan">
                  <span className="whitespace-pre-line">
                    {penutupan.keterangan}
                  </span>
                </Baris>
              </>
            )}
          </dl>
          {penutupan && (
            <p className="mt-3 max-w-[60ch] text-teks-2">
              Pendaftaran yang ditutup tidak bisa dibuka kembali. Pemiliknya
              bisa mengirim formulir pendaftaran baru, yang mendapat nomor
              pendaftaran baru. Keterangan penutupan hanya terlihat oleh
              pegawai.
            </p>
          )}
        </section>
      </div>

      <section aria-labelledby="judul-langkah" className="grid gap-3">
        <h2 id="judul-langkah" className={GAYA_JUDUL_BAGIAN}>
          Langkah tahap {tahap1.nomor}
        </h2>
        <p className="flex flex-wrap items-center gap-2 text-teks-2">
          <KodeStasiun nomor={nomorStasiun(tahap1.nomor)} ukuran="kecil" />
          {tahap1.nama}
        </p>
        <ul>
          {tahap1.langkah.map(({ kode, nama }) => {
            const status = statusLangkah.get(kode) ?? "Belum";
            return (
              <li
                key={kode}
                className="grid grid-cols-[24px_1fr] items-start gap-2.5 border-t border-garis py-2.5 first:border-t-0"
              >
                <TandaStatus jenis={TANDA_LANGKAH[status]} kecil />
                <p className="text-body-sedang">
                  <span className="font-semibold">{kode}</span> {nama}
                  <small className="mt-0.5 block text-keterangan text-teks-2">
                    {status}
                  </small>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="judul-isian-formulir" className="grid gap-4">
        <h2 id="judul-isian-formulir" className={GAYA_JUDUL_BAGIAN}>
          Isian formulir pendaftaran
        </h2>
        <p className="max-w-[60ch] text-teks-2">
          Pemilik akun tidak bisa mengubah isiannya sesudah formulir dikirim.
          {pendaftaran.status === "Berjalan" &&
            " Perubahan yang disimpan di sini langsung terlihat di halaman akunnya."}
        </p>
        <FormulirUbahIsian
          nomor={pendaftaran.nomor}
          awal={keIsianFormulir(pendaftaran.isian, keIdPilihan(pilihan))}
          pilihan={pilihanTampil}
          idJudul="judul-isian-formulir"
        />
      </section>

      {bisaDitutup(pendaftaran.status) && (
        <section
          aria-labelledby="judul-tutup-pendaftaran"
          className="grid gap-4"
        >
          <h2 id="judul-tutup-pendaftaran" className={GAYA_JUDUL_BAGIAN}>
            Tutup pendaftaran
          </h2>
          <p className="max-w-[60ch] text-teks-2">
            Pendaftaran yang ditutup berstatus Ditutup dan tidak bisa dibuka
            kembali. Pemiliknya bisa mengirim formulir pendaftaran baru.
          </p>
          <FormulirTutupPendaftaran
            nomor={pendaftaran.nomor}
            pilihanAlasan={alasanPenutupanDiTahap(pendaftaran.tahap)}
            idJudul="judul-tutup-pendaftaran"
          />
        </section>
      )}

      {bolehMenghapusPermanen(pegawai.peran) && (
        <section aria-labelledby="judul-hapus-permanen" className="grid gap-4">
          <h2 id="judul-hapus-permanen" className={GAYA_JUDUL_BAGIAN}>
            Hapus permanen
          </h2>
          <p className="max-w-[60ch] text-teks-2">
            Akun pemilik pendaftaran ini dihapus beserta semua pendaftarannya,
            termasuk yang sudah ditutup. Pemiliknya tidak bisa masuk lagi, dan
            penghapusan ini tidak bisa dibatalkan. Nomor pendaftarannya tidak
            dipakai ulang.
          </p>
          <FormulirHapusPermanen
            nomor={pendaftaran.nomor}
            idJudul="judul-hapus-permanen"
          />
        </section>
      )}
    </div>
  );
}
