"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";
import { periksaSyaratUnggahFotoGaleri } from "@/domain/foto-galeri";
import { bolehMembukaMenu } from "@/domain/panel-pegawai";
import { bacaId } from "@/lib/baca-id";
import {
  hapusFotoGaleri,
  kenaliJenisBerkas,
  simpanFotoGaleri,
} from "@/server/foto-galeri";
import { pastikanPegawai } from "../../penjaga";
import type { Pesan } from "../pesan-tindakan";
import { PESAN_BERKAS_KOSONG, pesanPenolakanFoto } from "./pesan-unggah";

// Mengelola galeri hanya untuk Admin (PRD §2.2, §3.4, ▶ Keputusan OD-16). Kewenangan diperiksa di server pada setiap
// tindakan, dengan aturan yang sama seperti menu Galeri, jadi permintaan langsung dari Staf juga ditolak.

const ALAMAT = "/panel/galeri";

/** Isian formulir unggah seperti yang diisi Admin, supaya isian tetap ada bila ditolak. Berkas tidak bisa diisi ulang. */
type IsianFormulirUnggahFoto = {
  judul: string;
  tanggalKegiatan: string;
  persetujuan: boolean;
};

export type KeadaanFormulirUnggahFoto = {
  pesan: Pesan | null;
  isian: IsianFormulirUnggahFoto;
};

const ISIAN_KOSONG: IsianFormulirUnggahFoto = {
  judul: "",
  tanggalKegiatan: "",
  persetujuan: false,
};

const PESAN_JUDUL =
  "Judul belum diisi. Tulis judul kegiatan di foto, misalnya Kelas bahasa Jepang N4.";
const PESAN_TANGGAL =
  "Tanggal kegiatan belum benar. Pilih tanggal kegiatan di foto, misalnya 14-09-2026.";
const PESAN_GANGGUAN_UNGGAH =
  "Foto belum diunggah karena gangguan di server. Coba unggah lagi beberapa saat lagi; bila tetap gagal, hubungi pengelola server lembaga.";

/**
 * Bentuk isian; urutannya sama dengan urutan formulir, jadi pesan yang tampil adalah isian salah yang paling atas.
 * Syarat format, ukuran, dan persetujuan diperiksa aturan domain sesudah kewenangan diperiksa.
 */
const skemaUnggah = z.object({
  judul: z.string(PESAN_JUDUL).trim().min(1, PESAN_JUDUL),
  tanggalKegiatan: z.iso.date(PESAN_TANGGAL),
  berkas: z.file(PESAN_BERKAS_KOSONG).min(1, PESAN_BERKAS_KOSONG),
  persetujuan: z.boolean(),
});

function bacaIsian(formulir: FormData): IsianFormulirUnggahFoto {
  const teks = (nama: string) => {
    const nilai = formulir.get(nama);
    return typeof nilai === "string" ? nilai : "";
  };
  return {
    judul: teks("judul"),
    tanggalKegiatan: teks("tanggalKegiatan"),
    persetujuan: formulir.get("persetujuan") === "ya",
  };
}

function ditolak(
  isian: IsianFormulirUnggahFoto,
  teks: string,
): KeadaanFormulirUnggahFoto {
  return { pesan: { jenis: "peringatan", teks }, isian };
}

/**
 * Admin mengunggah foto galeri. Formulir sudah memeriksa syarat unggah di browser; server memeriksanya ulang dengan
 * aturan domain yang sama (PRD §3.4). Format diperiksa dari isi berkasnya, bukan dari nama atau jenis kiriman browser.
 */
export async function unggahFoto(
  _keadaan: KeadaanFormulirUnggahFoto,
  formulir: FormData,
): Promise<KeadaanFormulirUnggahFoto> {
  const pegawai = await pastikanPegawai();
  const isian = bacaIsian(formulir);
  const hasilBentuk = skemaUnggah.safeParse({
    ...isian,
    berkas: formulir.get("berkas"),
  });
  if (!bolehMembukaMenu(pegawai.peran, "galeri")) forbidden();
  if (!hasilBentuk.success) {
    return ditolak(isian, hasilBentuk.error.issues[0].message);
  }

  const { judul, tanggalKegiatan, berkas, persetujuan } = hasilBentuk.data;
  const isi = new Uint8Array(await berkas.arrayBuffer());
  const jenisBerkas = kenaliJenisBerkas(isi);
  const syarat = periksaSyaratUnggahFotoGaleri({
    jenisBerkas,
    ukuranByte: isi.byteLength,
    persetujuanOrangDiFoto: persetujuan,
  });
  if (!syarat.diterima) {
    return ditolak(isian, pesanPenolakanFoto(syarat.alasan, isi.byteLength));
  }

  try {
    const foto = await simpanFotoGaleri({
      judul,
      tanggalKegiatan,
      isi,
      jenisBerkas,
    });
    revalidatePath(ALAMAT);
    return {
      pesan: {
        jenis: "kabar",
        teks: `Foto "${foto.judul}" sudah diunggah dan tampil di halaman Galeri.`,
      },
      isian: ISIAN_KOSONG,
    };
  } catch (galat) {
    console.error(galat);
    return ditolak(isian, PESAN_GANGGUAN_UNGGAH);
  }
}

export type KeadaanHapusFoto = { pesan: Pesan | null };

const PESAN_FOTO_TIDAK_DIKENAL =
  "Foto yang dipilih tidak ditemukan; mungkin sudah dihapus. Muat ulang halaman Galeri, lalu pilih fotonya dari daftar.";

const skemaHapus = z.object({
  id: z.unknown().transform(bacaId).pipe(z.number(PESAN_FOTO_TIDAK_DIKENAL)),
});

function peringatan(teks: string): KeadaanHapusFoto {
  return { pesan: { jenis: "peringatan", teks } };
}

/** Admin menghapus foto galeri; data dan berkasnya di disk ikut terhapus (PRD §3.4). */
export async function hapusFoto(
  _keadaan: KeadaanHapusFoto,
  formulir: FormData,
): Promise<KeadaanHapusFoto> {
  const pegawai = await pastikanPegawai();
  const isian = skemaHapus.safeParse({ id: formulir.get("id") });
  if (!bolehMembukaMenu(pegawai.peran, "galeri")) forbidden();
  if (!isian.success) return peringatan(isian.error.issues[0].message);

  try {
    const foto = await hapusFotoGaleri(isian.data.id);
    if (!foto) return peringatan(PESAN_FOTO_TIDAK_DIKENAL);
    revalidatePath(ALAMAT);
    return {
      pesan: {
        jenis: "kabar",
        teks: `Foto "${foto.judul}" sudah dihapus dari galeri, dan berkasnya sudah dihapus dari server.`,
      },
    };
  } catch (galat) {
    console.error(galat);
    return peringatan(
      "Foto belum terhapus karena gangguan di server. Muat ulang halaman Galeri, lalu coba hapus lagi; bila tetap gagal, hubungi pengelola server lembaga.",
    );
  }
}
