"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";
import { bolehMembukaMenu } from "@/domain/panel-pegawai";
import {
  type HasilPeriksaStatistikLembaga,
  periksaStatistikLembaga,
} from "@/domain/statistik-lembaga";
import { formatAngka } from "@/lib/format";
import {
  daftarBidangKerjaAktif,
  simpanStatistikLembaga,
} from "@/server/statistik-lembaga";
import { pastikanPegawai } from "../../penjaga";
import type { Pesan } from "../pesan-tindakan";
import {
  type IsianFormulirStatistik,
  isiPerLevel,
  keIsianFormulir,
} from "./isian-formulir";

// Mengisi statistik lembaga hanya untuk Admin (PRD §2.2, §3.3). Kewenangan diperiksa di server pada setiap
// penyimpanan, dengan aturan yang sama seperti menu Statistik lembaga.

const ALAMAT = "/panel/statistik-lembaga";

export type KeadaanFormulirStatistik = {
  pesan: Pesan | null;
  isian: IsianFormulirStatistik;
};

// Isian jumlah siswa per bidang kerja bernama "bidangKerja-<id>" (formulir-statistik.tsx).
const NAMA_ISIAN_BIDANG_KERJA = /^bidangKerja-([1-9]\d{0,8})$/;

const TERBESAR = 999_999_999;

const pesanAngka = (nama: string, contoh: string) =>
  `${nama} belum benar. Isi dengan bilangan bulat 0 atau lebih, tanpa titik atau koma, misalnya ${contoh}.`;

const pesanTerlaluBesar = (nama: string) =>
  `${nama} terlalu besar. Isi paling banyak ${formatAngka(TERBESAR)}.`;

/**
 * Semua angka statistik adalah bilangan bulat 0 atau lebih (PRD §3.3). Angka paling besar 999.999.999 supaya muat
 * di kolom integer PostgreSQL.
 */
const angka = (nama: string, contoh: string) =>
  z
    .string(pesanAngka(nama, contoh))
    .trim()
    .regex(/^\d+$/, pesanAngka(nama, contoh))
    .transform(Number)
    .pipe(z.number().max(TERBESAR, pesanTerlaluBesar(nama)));

const CONTOH_JUMLAH_SISWA = "124";
const jumlahSiswa = (nama: string) =>
  angka(`Jumlah siswa ${nama}`, CONTOH_JUMLAH_SISWA);

/**
 * Bentuk isian; urutannya sama dengan urutan formulir, jadi pesan yang tampil adalah isian salah yang paling atas.
 * Nama bidang kerja belum diketahui di sini, jadi pesan untuk isian per bidang kerja disusun sesudah daftar bidang
 * kerja aktif dibaca (pesanBentuk).
 */
const skemaStatistik = z.object({
  dataPer: z.iso.date(
    "Tanggal data per belum benar. Pilih tanggal angka-angka ini dihitung, misalnya 28-08-2025.",
  ),
  perLevel: z.object({
    N5: jumlahSiswa("N5"),
    N4: jumlahSiswa("N4"),
    N3: jumlahSiswa("N3"),
    N2: jumlahSiswa("N2"),
  }),
  perBidangKerja: z.record(z.string(), jumlahSiswa("bidang kerja")),
  alumniDiJepang: angka("Jumlah alumni di Jepang", "1214"),
});

function bacaIsian(formulir: FormData): IsianFormulirStatistik {
  const teks = (nama: string) => {
    const nilai = formulir.get(nama);
    return typeof nilai === "string" ? nilai : "";
  };
  const perBidangKerja: Record<number, string> = {};
  for (const [nama, nilai] of formulir.entries()) {
    const cocok = NAMA_ISIAN_BIDANG_KERJA.exec(nama);
    if (cocok && typeof nilai === "string") {
      perBidangKerja[Number(cocok[1])] = nilai;
    }
  }
  return {
    dataPer: teks("dataPer"),
    perLevel: isiPerLevel((level) => teks(`siswa-${level}`)),
    perBidangKerja,
    alumniDiJepang: teks("alumniDiJepang"),
  };
}

/** Formulir berisi tepat satu isian untuk setiap bidang kerja aktif (PRD §3.3). */
function lengkapUntukBidangKerjaAktif(
  isian: IsianFormulirStatistik,
  bidangKerjaAktif: readonly { id: number }[],
): boolean {
  const idIsian = Object.keys(isian.perBidangKerja).map(Number);
  return (
    idIsian.length === bidangKerjaAktif.length &&
    bidangKerjaAktif.every(({ id }) => idIsian.includes(id))
  );
}

/** Pesan isian salah yang paling atas; isian per bidang kerja disebut dengan nama bidang kerjanya. */
function pesanBentuk(
  galat: z.ZodError,
  bidangKerjaAktif: readonly { id: number; nama: string }[],
): string {
  const [masalah] = galat.issues;
  const [kelompok, kunci] = masalah.path;
  if (kelompok !== "perBidangKerja") return masalah.message;
  const bidangKerja = bidangKerjaAktif.find(({ id }) => id === Number(kunci));
  const nama = `Jumlah siswa ${bidangKerja?.nama ?? "bidang kerja"}`;
  return masalah.code === "too_big"
    ? pesanTerlaluBesar(nama)
    : pesanAngka(nama, CONTOH_JUMLAH_SISWA);
}

function pesanTidakCocok(hasil: HasilPeriksaStatistikLembaga): string {
  return `Jumlah siswa per bidang kerja ${formatAngka(hasil.jumlahPerBidangKerja)} tidak sama dengan total siswa ${formatAngka(hasil.totalSiswa)} (N5 + N4 + N3 + N2). Ubah angka per bidang kerja atau per level supaya keduanya sama, lalu simpan lagi.`;
}

function ditolak(
  isian: IsianFormulirStatistik,
  teks: string,
): KeadaanFormulirStatistik {
  return { pesan: { jenis: "peringatan", teks }, isian };
}

/**
 * Admin menyimpan statistik lembaga. Penyimpanan ditolak bila jumlah siswa per bidang kerja tidak sama dengan
 * total siswa, dengan pesan yang menyebut kedua angka (PRD §3.3).
 */
export async function simpanStatistik(
  _keadaan: KeadaanFormulirStatistik,
  formulir: FormData,
): Promise<KeadaanFormulirStatistik> {
  const pegawai = await pastikanPegawai();
  const isian = bacaIsian(formulir);
  const hasilBentuk = skemaStatistik.safeParse(isian);
  if (!bolehMembukaMenu(pegawai.peran, "statistik-lembaga")) forbidden();

  const bidangKerjaAktif = await daftarBidangKerjaAktif();
  if (!lengkapUntukBidangKerjaAktif(isian, bidangKerjaAktif)) {
    // Bidang kerja ditambahkan atau dinonaktifkan sejak formulir dibuka. Halaman dirender ulang, jadi formulir
    // langsung memuat isian untuk bidang kerja aktif yang sekarang.
    revalidatePath(ALAMAT);
    return ditolak(
      isian,
      "Daftar bidang kerja aktif berubah sejak halaman ini dibuka, jadi statistik belum disimpan. Formulir sudah diperbarui: isi angka setiap bidang kerja, lalu simpan lagi.",
    );
  }
  if (!hasilBentuk.success) {
    return ditolak(isian, pesanBentuk(hasilBentuk.error, bidangKerjaAktif));
  }
  const { data } = hasilBentuk;
  const statistik = {
    dataPer: data.dataPer,
    perLevel: data.perLevel,
    alumniDiJepang: data.alumniDiJepang,
    perBidangKerja: bidangKerjaAktif.map(({ id }) => ({
      bidangKerjaId: id,
      jumlahSiswa: data.perBidangKerja[id],
    })),
  };
  const hasil = periksaStatistikLembaga({
    perLevel: statistik.perLevel,
    perBidangKerja: statistik.perBidangKerja.map((b) => b.jumlahSiswa),
    alumniDiJepang: statistik.alumniDiJepang,
  });
  if (!hasil.sah) return ditolak(isian, pesanTidakCocok(hasil));

  try {
    await simpanStatistikLembaga(statistik);
    revalidatePath(ALAMAT);
    return {
      pesan: {
        jenis: "kabar",
        teks: `Statistik lembaga sudah disimpan dan tampil di Beranda. Total siswa ${formatAngka(hasil.totalSiswa)}.`,
      },
      isian: keIsianFormulir(statistik, bidangKerjaAktif),
    };
  } catch (galat) {
    console.error(galat);
    return ditolak(
      isian,
      "Statistik lembaga belum tersimpan karena gangguan di server. Coba simpan lagi beberapa saat lagi; bila tetap gagal, hubungi pengelola server lembaga.",
    );
  }
}
