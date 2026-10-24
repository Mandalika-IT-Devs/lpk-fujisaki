"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";
import {
  MASA_BERLAKU_TAUTAN_ATUR_KATA_SANDI_PEGAWAI_BARU_JAM,
  type Peran,
} from "@/domain/akun";
import { bolehMembukaMenu } from "@/domain/panel-pegawai";
import { buatAkunPegawai, ubahPegawai } from "@/server/akun-pegawai";
import { pastikanPegawai } from "../../penjaga";

// Mengelola akun pegawai hanya untuk Admin (PRD §2.2, §5.5). Kewenangan diperiksa di server pada setiap
// tindakan, dengan aturan yang sama seperti menu Akun pegawai.

const ALAMAT_HALAMAN = "/panel/akun-pegawai";

export type Pesan = { jenis: "kabar" | "peringatan"; teks: string };

type IsianBuatAkun = { nama: string; email: string; peran: string };

export type KeadaanBuatAkun = { pesan: Pesan | null; isian: IsianBuatAkun };

const PESAN_NAMA = "Nama belum diisi. Isi dengan nama pegawai.";

const skemaBuatAkun = z.object({
  nama: z.string(PESAN_NAMA).trim().min(1, PESAN_NAMA),
  email: z.email(
    "Email belum benar. Isi dengan email pegawai, misalnya nama@contoh.com.",
  ),
  peran: z.enum(
    ["admin", "staf"],
    "Peran belum dipilih. Pilih Admin atau Staf untuk pegawai ini.",
  ),
});

const PESAN_GANGGUAN_BUAT_AKUN =
  "Akun pegawai belum dibuat karena gangguan di server atau saat mengirim email. Coba lagi beberapa saat lagi; bila tetap gagal, hubungi pengelola server lembaga.";

/** Admin membuat akun pegawai; pegawai baru menerima email untuk mengatur kata sandinya (PRD §5.5). */
export async function buatAkun(
  _keadaan: KeadaanBuatAkun,
  formulir: FormData,
): Promise<KeadaanBuatAkun> {
  const pegawai = await pastikanPegawai();
  const isian: IsianBuatAkun = {
    nama: String(formulir.get("nama") ?? ""),
    email: String(formulir.get("email") ?? ""),
    peran: String(formulir.get("peran") ?? ""),
  };
  const hasilPeriksa = skemaBuatAkun.safeParse(isian);
  if (!bolehMembukaMenu(pegawai.peran, "akun-pegawai")) forbidden();
  if (!hasilPeriksa.success) {
    return {
      pesan: {
        jenis: "peringatan",
        teks: hasilPeriksa.error.issues[0].message,
      },
      isian,
    };
  }

  try {
    const hasil = await buatAkunPegawai(hasilPeriksa.data);
    if (hasil.hasil === "email-dipakai") {
      return {
        pesan: {
          jenis: "peringatan",
          teks: `Email ${hasil.email} sudah dipakai akun lain. Pakai email lain untuk pegawai ini.`,
        },
        isian,
      };
    }
    revalidatePath(ALAMAT_HALAMAN);
    return {
      pesan: {
        jenis: "kabar",
        teks: `Akun pegawai untuk ${hasil.pegawai.nama} sudah dibuat. Email untuk mengatur kata sandi sudah dikirim ke ${hasil.pegawai.email}, dan tautannya berlaku ${MASA_BERLAKU_TAUTAN_ATUR_KATA_SANDI_PEGAWAI_BARU_JAM} jam.`,
      },
      isian: { nama: "", email: "", peran: "staf" },
    };
  } catch (galat) {
    console.error(galat);
    return {
      pesan: { jenis: "peringatan", teks: PESAN_GANGGUAN_BUAT_AKUN },
      isian,
    };
  }
}

export type KeadaanUbahPegawai = { pesan: Pesan | null };

const PESAN_PEGAWAI_TIDAK_DIKENAL =
  "Pegawai yang dipilih tidak ditemukan. Muat ulang halaman Akun pegawai, lalu coba lagi.";

const skemaUbahPegawai = z.object({
  id: z.uuid(PESAN_PEGAWAI_TIDAK_DIKENAL),
  tindakan: z.enum(
    ["jadikan-admin", "jadikan-staf", "nonaktifkan", "aktifkan"],
    "Tindakan untuk pegawai ini tidak dikenali. Muat ulang halaman Akun pegawai, lalu pilih tombol tindakannya lagi.",
  ),
});

type Tindakan = z.infer<typeof skemaUbahPegawai>["tindakan"];

const PERUBAHAN: Record<Tindakan, { peran: Peran } | { aktif: boolean }> = {
  "jadikan-admin": { peran: "admin" },
  "jadikan-staf": { peran: "staf" },
  nonaktifkan: { aktif: false },
  aktifkan: { aktif: true },
};

const KABAR_BERHASIL: Record<Tindakan, (nama: string) => string> = {
  "jadikan-admin": (nama) => `${nama} sekarang berperan Admin.`,
  "jadikan-staf": (nama) => `${nama} sekarang berperan Staf.`,
  nonaktifkan: (nama) => `${nama} sekarang nonaktif dan tidak bisa masuk.`,
  aktifkan: (nama) => `${nama} aktif kembali dan bisa masuk lagi.`,
};

// Hanya menonaktifkan dan menurunkan menjadi Staf yang bisa mengurangi Admin aktif.
const TINDAKAN_DITOLAK: Partial<Record<Tindakan, string>> = {
  nonaktifkan: "dinonaktifkan",
  "jadikan-staf": "diturunkan menjadi Staf",
};

const PESAN_GANGGUAN_UBAH =
  "Perubahan belum tersimpan karena gangguan di server. Muat ulang halaman Akun pegawai, lalu coba lagi.";

/** Admin mengubah peran pegawai, menonaktifkannya, atau mengaktifkannya kembali (PRD §5.5). */
export async function ubahAkunPegawai(
  _keadaan: KeadaanUbahPegawai,
  formulir: FormData,
): Promise<KeadaanUbahPegawai> {
  const pegawai = await pastikanPegawai();
  const isian = skemaUbahPegawai.safeParse({
    id: formulir.get("id"),
    tindakan: formulir.get("tindakan"),
  });
  if (!bolehMembukaMenu(pegawai.peran, "akun-pegawai")) forbidden();
  if (!isian.success) {
    return {
      pesan: { jenis: "peringatan", teks: isian.error.issues[0].message },
    };
  }
  const { id, tindakan } = isian.data;

  try {
    const hasil = await ubahPegawai(id, PERUBAHAN[tindakan]);
    if (hasil.hasil === "tidak-ditemukan") {
      return {
        pesan: { jenis: "peringatan", teks: PESAN_PEGAWAI_TIDAK_DIKENAL },
      };
    }
    if (hasil.hasil === "admin-terakhir") {
      return {
        pesan: {
          jenis: "peringatan",
          teks: `${hasil.pegawai.nama} adalah Admin aktif terakhir, jadi tidak bisa ${TINDAKAN_DITOLAK[tindakan] ?? "diubah"}. Sistem selalu menyisakan minimal satu Admin aktif. Jadikan pegawai aktif lain Admin lebih dulu, lalu coba lagi.`,
        },
      };
    }
    revalidatePath(ALAMAT_HALAMAN);
    return {
      pesan: {
        jenis: "kabar",
        teks: KABAR_BERHASIL[tindakan](hasil.pegawai.nama),
      },
    };
  } catch (galat) {
    console.error(galat);
    return { pesan: { jenis: "peringatan", teks: PESAN_GANGGUAN_UBAH } };
  }
}
