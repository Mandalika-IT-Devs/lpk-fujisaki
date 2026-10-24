"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";
import {
  type HasilPeriksaRentangUsia,
  periksaRentangUsia,
} from "@/domain/program-dan-bidang-kerja";
import { bolehMembukaMenu } from "@/domain/panel-pegawai";
import { bacaId } from "@/lib/baca-id";
import { tambahProgram, ubahProgram } from "@/server/program";
import { pastikanPegawai } from "../../penjaga";
import type { Pesan } from "../pesan-tindakan";
import {
  ISIAN_KOSONG,
  type IsianFormulirProgram,
  keIsianFormulir,
} from "./isian-formulir";

// Mengelola program hanya untuk Admin (PRD §2.2, §4.1). Kewenangan diperiksa di server pada setiap tindakan,
// dengan aturan yang sama seperti menu Program. Program tidak pernah dihapus, hanya dinonaktifkan (§4.3).

const ALAMAT_DAFTAR = "/panel/program";

export type KeadaanFormulirProgram = {
  pesan: Pesan | null;
  isian: IsianFormulirProgram;
};

const teksWajib = (pesan: string) => z.string(pesan).trim().min(1, pesan);

// Usia dalam tahun penuh (PRD §6.3): bilangan bulat 0 atau lebih, paling banyak tiga digit.
const usiaTahun = (pesan: string) =>
  z
    .string(pesan)
    .trim()
    .regex(/^\d{1,3}$/, pesan)
    .transform(Number);

const skemaProgram = z.object({
  nama: teksWajib(
    "Nama program belum diisi. Isi dengan nama program, misalnya Tokutei Ginou (SSW).",
  ),
  deskripsi: teksWajib(
    "Deskripsi belum diisi. Tulis penjelasan singkat tentang program ini.",
  ),
  syarat: teksWajib(
    "Syarat belum diisi. Tulis syarat untuk mengikuti program ini.",
  ),
  lamaPelatihan: teksWajib(
    "Lama pelatihan belum diisi. Isi dengan teks bebas, misalnya 6–8 bulan.",
  ),
  usiaMinimal: usiaTahun(
    "Usia minimal belum benar. Isi dengan bilangan bulat tahun tanpa koma, misalnya 18.",
  ),
  usiaMaksimal: usiaTahun(
    "Usia maksimal belum benar. Isi dengan bilangan bulat tahun tanpa koma, misalnya 30.",
  ),
});

function bacaIsian(formulir: FormData): IsianFormulirProgram {
  const teks = (nama: string) => String(formulir.get(nama) ?? "");
  return {
    nama: teks("nama"),
    deskripsi: teks("deskripsi"),
    syarat: teks("syarat"),
    lamaPelatihan: teks("lamaPelatihan"),
    usiaMinimal: teks("usiaMinimal"),
    usiaMaksimal: teks("usiaMaksimal"),
  };
}

function pesanRentangUsia(
  hasil: Extract<HasilPeriksaRentangUsia, { sah: false }>,
): string {
  return `Usia minimal ${hasil.usiaMinimal} tahun lebih besar dari usia maksimal ${hasil.usiaMaksimal} tahun. Ubah salah satunya supaya usia minimal tidak lebih dari usia maksimal, lalu simpan lagi.`;
}

const PESAN_GANGGUAN =
  "Program belum tersimpan karena gangguan di server. Coba simpan lagi beberapa saat lagi; bila tetap gagal, hubungi pengelola server lembaga.";

const PESAN_PROGRAM_TIDAK_DIKENAL =
  "Program yang dipilih tidak ditemukan. Buka lagi halaman Program, lalu pilih programnya dari daftar.";

type HasilPeriksaIsian =
  | {
      sah: true;
      program: z.infer<typeof skemaProgram>;
    }
  | { sah: false; pesan: string };

/** Bentuk setiap isian diperiksa Zod, lalu rentang usianya diperiksa aturan domain (PRD §6.3). */
function periksaIsian(
  hasilBentuk: ReturnType<typeof skemaProgram.safeParse>,
): HasilPeriksaIsian {
  if (!hasilBentuk.success) {
    return { sah: false, pesan: hasilBentuk.error.issues[0].message };
  }
  const rentang = periksaRentangUsia(hasilBentuk.data);
  if (!rentang.sah) return { sah: false, pesan: pesanRentangUsia(rentang) };
  return { sah: true, program: hasilBentuk.data };
}

function ditolak(
  isian: IsianFormulirProgram,
  teks: string,
): KeadaanFormulirProgram {
  return { pesan: { jenis: "peringatan", teks }, isian };
}

/** Admin menambah program; program baru langsung aktif dan tampil di situs publik. */
export async function tambahkanProgram(
  _keadaan: KeadaanFormulirProgram,
  formulir: FormData,
): Promise<KeadaanFormulirProgram> {
  const pegawai = await pastikanPegawai();
  const isian = bacaIsian(formulir);
  const hasilBentuk = skemaProgram.safeParse(isian);
  if (!bolehMembukaMenu(pegawai.peran, "program")) forbidden();
  const hasil = periksaIsian(hasilBentuk);
  if (!hasil.sah) return ditolak(isian, hasil.pesan);

  try {
    const program = await tambahProgram(hasil.program);
    revalidatePath(ALAMAT_DAFTAR);
    return {
      pesan: {
        jenis: "kabar",
        teks: `${program.nama} sudah ditambahkan dan tampil di situs publik.`,
      },
      isian: ISIAN_KOSONG,
    };
  } catch (galat) {
    console.error(galat);
    return ditolak(isian, PESAN_GANGGUAN);
  }
}

/** Admin mengubah isian sebuah program. */
export async function simpanPerubahanProgram(
  _keadaan: KeadaanFormulirProgram,
  formulir: FormData,
): Promise<KeadaanFormulirProgram> {
  const pegawai = await pastikanPegawai();
  const isian = bacaIsian(formulir);
  const id = bacaId(formulir.get("id"));
  const hasilBentuk = skemaProgram.safeParse(isian);
  if (!bolehMembukaMenu(pegawai.peran, "program")) forbidden();
  if (id === undefined) return ditolak(isian, PESAN_PROGRAM_TIDAK_DIKENAL);
  const hasil = periksaIsian(hasilBentuk);
  if (!hasil.sah) return ditolak(isian, hasil.pesan);

  try {
    const program = await ubahProgram(id, hasil.program);
    if (!program) return ditolak(isian, PESAN_PROGRAM_TIDAK_DIKENAL);
    revalidatePath(ALAMAT_DAFTAR);
    return {
      pesan: {
        jenis: "kabar",
        teks: `Perubahan ${program.nama} sudah disimpan.`,
      },
      isian: keIsianFormulir(program),
    };
  } catch (galat) {
    console.error(galat);
    return ditolak(isian, PESAN_GANGGUAN);
  }
}

export type KeadaanUbahStatus = { pesan: Pesan | null };

const skemaUbahStatus = z.object({
  id: z.unknown().transform(bacaId).pipe(z.number(PESAN_PROGRAM_TIDAK_DIKENAL)),
  tindakan: z.enum(
    ["nonaktifkan", "aktifkan"],
    "Tindakan untuk program ini tidak dikenali. Muat ulang halaman Program, lalu pilih tombol tindakannya lagi.",
  ),
});

const KABAR_STATUS = {
  nonaktifkan: (nama: string) =>
    `${nama} sekarang nonaktif dan tidak tampil di situs publik.`,
  aktifkan: (nama: string) =>
    `${nama} aktif kembali dan tampil lagi di situs publik.`,
};

/** Admin menonaktifkan program atau mengaktifkannya kembali (PRD §4.3). */
export async function ubahStatusProgram(
  _keadaan: KeadaanUbahStatus,
  formulir: FormData,
): Promise<KeadaanUbahStatus> {
  const pegawai = await pastikanPegawai();
  const isian = skemaUbahStatus.safeParse({
    id: formulir.get("id"),
    tindakan: formulir.get("tindakan"),
  });
  if (!bolehMembukaMenu(pegawai.peran, "program")) forbidden();
  if (!isian.success) {
    return {
      pesan: { jenis: "peringatan", teks: isian.error.issues[0].message },
    };
  }
  const { id, tindakan } = isian.data;

  try {
    const program = await ubahProgram(id, { aktif: tindakan === "aktifkan" });
    if (!program) {
      return {
        pesan: { jenis: "peringatan", teks: PESAN_PROGRAM_TIDAK_DIKENAL },
      };
    }
    revalidatePath(ALAMAT_DAFTAR);
    return {
      pesan: { jenis: "kabar", teks: KABAR_STATUS[tindakan](program.nama) },
    };
  } catch (galat) {
    console.error(galat);
    return {
      pesan: {
        jenis: "peringatan",
        teks: "Status program belum berubah karena gangguan di server. Muat ulang halaman Program, lalu coba lagi.",
      },
    };
  }
}
