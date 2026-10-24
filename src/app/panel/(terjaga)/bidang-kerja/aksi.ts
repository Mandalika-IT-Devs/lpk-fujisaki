"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";
import { bolehMembukaMenu } from "@/domain/panel-pegawai";
import { bacaId } from "@/lib/baca-id";
import { tambahBidangKerja, ubahBidangKerja } from "@/server/bidang-kerja";
import { pastikanPegawai } from "../../penjaga";
import type { Pesan } from "../pesan-tindakan";

// Mengelola bidang kerja hanya untuk Admin (PRD §2.2, §4.2). Kewenangan diperiksa di server pada setiap tindakan,
// dengan aturan yang sama seperti menu Bidang kerja. Bidang kerja tidak pernah dihapus, hanya dinonaktifkan (§4.3).

const ALAMAT_DAFTAR = "/panel/bidang-kerja";

export type KeadaanFormulirBidangKerja = { pesan: Pesan | null; nama: string };

const PESAN_NAMA =
  "Nama bidang kerja belum diisi. Isi dengan nama bidang kerja, misalnya Restoran.";

const skemaNama = z.string(PESAN_NAMA).trim().min(1, PESAN_NAMA);

const PESAN_GANGGUAN =
  "Bidang kerja belum tersimpan karena gangguan di server. Coba simpan lagi beberapa saat lagi; bila tetap gagal, hubungi pengelola server lembaga.";

const PESAN_BIDANG_KERJA_TIDAK_DIKENAL =
  "Bidang kerja yang dipilih tidak ditemukan. Buka lagi halaman Bidang kerja, lalu pilih bidang kerjanya dari daftar.";

function ditolak(nama: string, teks: string): KeadaanFormulirBidangKerja {
  return { pesan: { jenis: "peringatan", teks }, nama };
}

/** Admin menambah bidang kerja; bidang kerja baru langsung aktif dan tampil di situs publik. */
export async function tambahkanBidangKerja(
  _keadaan: KeadaanFormulirBidangKerja,
  formulir: FormData,
): Promise<KeadaanFormulirBidangKerja> {
  const pegawai = await pastikanPegawai();
  const nama = String(formulir.get("nama") ?? "");
  const isian = skemaNama.safeParse(nama);
  if (!bolehMembukaMenu(pegawai.peran, "bidang-kerja")) forbidden();
  if (!isian.success) return ditolak(nama, isian.error.issues[0].message);

  try {
    const bidangKerja = await tambahBidangKerja(isian.data);
    revalidatePath(ALAMAT_DAFTAR);
    return {
      pesan: {
        jenis: "kabar",
        teks: `${bidangKerja.nama} sudah ditambahkan dan tampil di situs publik.`,
      },
      nama: "",
    };
  } catch (galat) {
    console.error(galat);
    return ditolak(nama, PESAN_GANGGUAN);
  }
}

/** Admin mengubah nama sebuah bidang kerja. */
export async function simpanPerubahanBidangKerja(
  _keadaan: KeadaanFormulirBidangKerja,
  formulir: FormData,
): Promise<KeadaanFormulirBidangKerja> {
  const pegawai = await pastikanPegawai();
  const nama = String(formulir.get("nama") ?? "");
  const id = bacaId(formulir.get("id"));
  const isian = skemaNama.safeParse(nama);
  if (!bolehMembukaMenu(pegawai.peran, "bidang-kerja")) forbidden();
  if (id === undefined) return ditolak(nama, PESAN_BIDANG_KERJA_TIDAK_DIKENAL);
  if (!isian.success) return ditolak(nama, isian.error.issues[0].message);

  try {
    const bidangKerja = await ubahBidangKerja(id, { nama: isian.data });
    if (!bidangKerja) return ditolak(nama, PESAN_BIDANG_KERJA_TIDAK_DIKENAL);
    revalidatePath(ALAMAT_DAFTAR);
    return {
      pesan: {
        jenis: "kabar",
        teks: `Perubahan ${bidangKerja.nama} sudah disimpan.`,
      },
      nama: bidangKerja.nama,
    };
  } catch (galat) {
    console.error(galat);
    return ditolak(nama, PESAN_GANGGUAN);
  }
}

export type KeadaanUbahStatus = { pesan: Pesan | null };

const skemaUbahStatus = z.object({
  id: z
    .unknown()
    .transform(bacaId)
    .pipe(z.number(PESAN_BIDANG_KERJA_TIDAK_DIKENAL)),
  tindakan: z.enum(
    ["nonaktifkan", "aktifkan"],
    "Tindakan untuk bidang kerja ini tidak dikenali. Muat ulang halaman Bidang kerja, lalu pilih tombol tindakannya lagi.",
  ),
});

const KABAR_STATUS = {
  nonaktifkan: (nama: string) =>
    `${nama} sekarang nonaktif dan tidak tampil di situs publik.`,
  aktifkan: (nama: string) =>
    `${nama} aktif kembali dan tampil lagi di situs publik.`,
};

/** Admin menonaktifkan bidang kerja atau mengaktifkannya kembali (PRD §4.3). */
export async function ubahStatusBidangKerja(
  _keadaan: KeadaanUbahStatus,
  formulir: FormData,
): Promise<KeadaanUbahStatus> {
  const pegawai = await pastikanPegawai();
  const isian = skemaUbahStatus.safeParse({
    id: formulir.get("id"),
    tindakan: formulir.get("tindakan"),
  });
  if (!bolehMembukaMenu(pegawai.peran, "bidang-kerja")) forbidden();
  if (!isian.success) {
    return {
      pesan: { jenis: "peringatan", teks: isian.error.issues[0].message },
    };
  }
  const { id, tindakan } = isian.data;

  try {
    const bidangKerja = await ubahBidangKerja(id, {
      aktif: tindakan === "aktifkan",
    });
    if (!bidangKerja) {
      return {
        pesan: { jenis: "peringatan", teks: PESAN_BIDANG_KERJA_TIDAK_DIKENAL },
      };
    }
    revalidatePath(ALAMAT_DAFTAR);
    return {
      pesan: {
        jenis: "kabar",
        teks: KABAR_STATUS[tindakan](bidangKerja.nama),
      },
    };
  } catch (galat) {
    console.error(galat);
    return {
      pesan: {
        jenis: "peringatan",
        teks: "Status bidang kerja belum berubah karena gangguan di server. Muat ulang halaman Bidang kerja, lalu coba lagi.",
      },
    };
  }
}
