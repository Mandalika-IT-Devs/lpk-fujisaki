import { z } from "zod";
import {
  DAFTAR_PROVINSI,
  type IsianWajib,
  PILIHAN_JENIS_KELAMIN,
  PILIHAN_KEMAMPUAN_BAHASA_JEPANG,
  PILIHAN_PENDIDIKAN_TERAKHIR,
} from "@/domain/formulir-pendaftaran";
import { normalkanNomorWhatsApp } from "@/domain/nomor-whatsapp";
import { bacaId } from "@/lib/baca-id";
import type {
  DrafFormulirPendaftaran,
  PilihanFormulirPendaftaran,
} from "@/server/formulir-pendaftaran";

// Isian formulir pendaftaran dan pemeriksaannya, dipakai formulir pemilik akun (issue T12, T13) dan formulir ubah
// isian di halaman pendaftaran panel pegawai (issue T15), supaya keduanya memakai aturan dan pesan yang sama.

/**
 * Isian formulir pendaftaran seperti yang diisi pemilik akun, dalam urutan PRD §6.1, supaya isian tetap ada bila
 * ditolak. Program dan bidang kerja berisi id-nya; bidang kerja bisa juga berisi NILAI_BELUM_TAHU.
 */
export type IsianFormulirPendaftaran = {
  namaLengkap: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  kabupatenKota: string;
  provinsi: string;
  pendidikanTerakhir: string;
  jurusanPendidikan: string;
  programId: string;
  bidangKerja: string;
  kemampuanBahasaJepang: string;
  pengalamanKerja: string;
  namaKontakDarurat: string;
  hubunganKontakDarurat: string;
  nomorHpKontakDarurat: string;
};

export type NamaIsian = keyof IsianFormulirPendaftaran;

/** Pesan kesalahan per isian; hanya isian yang salah yang punya pesan. */
export type GalatIsian = Partial<Record<NamaIsian, string>>;

export const ISIAN_KOSONG: IsianFormulirPendaftaran = {
  namaLengkap: "",
  jenisKelamin: "",
  tempatLahir: "",
  tanggalLahir: "",
  kabupatenKota: "",
  provinsi: "",
  pendidikanTerakhir: "",
  jurusanPendidikan: "",
  programId: "",
  bidangKerja: "",
  kemampuanBahasaJepang: "",
  pengalamanKerja: "",
  namaKontakDarurat: "",
  hubunganKontakDarurat: "",
  nomorHpKontakDarurat: "",
};

/** Label setiap isian di formulir, juga untuk menyebut isian yang salah. */
export const LABEL_ISIAN: Record<NamaIsian, string> = {
  namaLengkap: "Nama lengkap sesuai KTP",
  jenisKelamin: "Jenis kelamin",
  tempatLahir: "Tempat lahir",
  tanggalLahir: "Tanggal lahir",
  kabupatenKota: "Kabupaten/kota domisili",
  provinsi: "Provinsi domisili",
  pendidikanTerakhir: "Pendidikan terakhir",
  jurusanPendidikan: "Jurusan pendidikan terakhir",
  programId: "Program",
  bidangKerja: "Bidang kerja yang diminati",
  kemampuanBahasaJepang: "Kemampuan bahasa Jepang saat ini",
  pengalamanKerja: "Pengalaman kerja",
  namaKontakDarurat: "Nama kontak darurat",
  hubunganKontakDarurat: "Hubungan kontak darurat",
  nomorHpKontakDarurat: "Nomor HP kontak darurat",
};

/** Nilai pilihan bidang kerja "Belum tahu" (PRD §4.2). */
export const NILAI_BELUM_TAHU = "belum-tahu";

/** Id program dan bidang kerja yang bisa dipilih saat ini (PRD §4.3). */
type IdPilihan = {
  programId: readonly number[];
  bidangKerjaId: readonly number[];
};

/** Id program dan bidang kerja dari daftar pilihan formulir. */
export function keIdPilihan(pilihan: PilihanFormulirPendaftaran): IdPilihan {
  return {
    programId: pilihan.program.map((p) => p.id),
    bidangKerjaId: pilihan.bidangKerja.map((b) => b.id),
  };
}

/** Isian formulir pendaftaran dari formulir yang dikirim; isian yang tidak ada dibaca kosong. */
export function bacaIsianFormulir(
  formulir: FormData,
): IsianFormulirPendaftaran {
  const isian = { ...ISIAN_KOSONG };
  for (const nama of Object.keys(ISIAN_KOSONG) as NamaIsian[]) {
    const nilai = formulir.get(nama);
    isian[nama] = typeof nilai === "string" ? nilai : "";
  }
  return isian;
}

/** Label isian yang punya pesan kesalahan, dalam urutan formulir. */
export function labelIsianSalah(galat: GalatIsian): string {
  return (Object.keys(LABEL_ISIAN) as NamaIsian[])
    .filter((nama) => galat[nama])
    .map((nama) => LABEL_ISIAN[nama])
    .join(", ");
}

/** Pesan pada setiap isian wajib yang belum diisi (PRD §6.1). */
export function galatIsianWajib(belumDiisi: readonly IsianWajib[]): GalatIsian {
  const galat: GalatIsian = {};
  for (const nama of belumDiisi) {
    galat[nama] =
      `${LABEL_ISIAN[nama]} belum diisi. Isian ini wajib diisi sebelum formulir dikirim.`;
  }
  return galat;
}

/** Teks yang dirapikan; teks kosong berarti isian belum diisi. */
const rapikan = (teks: string) => teks.trim() || null;

const teks = z.string().transform(rapikan);

const salahSatu = <const T extends readonly string[]>(
  pilihan: T,
  pesan: string,
) => z.string().transform(rapikan).pipe(z.enum(pilihan, pesan).nullable());

const PESAN_NOMOR_HP =
  "Nomor HP kontak darurat belum benar. Isi nomor HP Indonesia 10 sampai 13 digit yang diawali 08 atau +62 8, misalnya 0812-3456-7890. Nomor luar negeri dan nomor telepon rumah tidak diterima.";

/**
 * Bentuk setiap isian saat disimpan sebagai draf. Draf boleh belum lengkap (PRD §6.2), jadi isian kosong sah; isian
 * yang terisi harus berbentuk benar. Nomor HP kontak darurat harus memenuhi §5.2 dan disimpan dalam bentuk
 * ternormalisasi.
 */
function skemaDraf(idPilihan: IdPilihan) {
  const pilihanId = (daftarId: readonly number[], pesan: string) =>
    z.string().transform((isi, ctx) => {
      const terisi = rapikan(isi);
      if (terisi === null) return null;
      const id = bacaId(terisi);
      if (id !== undefined && daftarId.includes(id)) return id;
      ctx.addIssue({ code: "custom", message: pesan });
      return z.NEVER;
    });

  return z.object({
    namaLengkap: teks,
    jenisKelamin: salahSatu(
      PILIHAN_JENIS_KELAMIN,
      "Jenis kelamin tidak dikenali. Pilih Laki-laki atau Perempuan.",
    ),
    tempatLahir: teks,
    tanggalLahir: z
      .string()
      .transform(rapikan)
      .pipe(
        z.iso
          .date(
            "Tanggal lahir belum benar. Pilih lagi tanggal lahirmu di pemilih tanggal.",
          )
          .nullable(),
      ),
    kabupatenKota: teks,
    provinsi: salahSatu(
      DAFTAR_PROVINSI,
      "Provinsi domisili tidak dikenali. Pilih provinsi dari daftar.",
    ),
    pendidikanTerakhir: salahSatu(
      PILIHAN_PENDIDIKAN_TERAKHIR,
      "Pendidikan terakhir tidak dikenali. Pilih salah satu dari daftar.",
    ),
    jurusanPendidikan: teks,
    programId: pilihanId(
      idPilihan.programId,
      "Program ini tidak bisa dipilih karena sudah tidak dibuka. Muat ulang halaman ini, lalu pilih program dari daftar.",
    ),
    bidangKerja: z.string().transform((isi, ctx) => {
      const terisi = rapikan(isi);
      if (terisi === null || terisi === NILAI_BELUM_TAHU) {
        return {
          bidangKerjaId: null,
          bidangKerjaBelumTahu: terisi === NILAI_BELUM_TAHU,
        };
      }
      const id = bacaId(terisi);
      if (id !== undefined && idPilihan.bidangKerjaId.includes(id)) {
        return { bidangKerjaId: id, bidangKerjaBelumTahu: false };
      }
      ctx.addIssue({
        code: "custom",
        message:
          "Bidang kerja ini tidak bisa dipilih karena sudah tidak dibuka. Muat ulang halaman ini, lalu pilih bidang kerja dari daftar, atau Belum tahu.",
      });
      return z.NEVER;
    }),
    kemampuanBahasaJepang: salahSatu(
      PILIHAN_KEMAMPUAN_BAHASA_JEPANG,
      "Kemampuan bahasa Jepang tidak dikenali. Pilih salah satu dari daftar.",
    ),
    pengalamanKerja: teks,
    namaKontakDarurat: teks,
    hubunganKontakDarurat: teks,
    nomorHpKontakDarurat: z.string().transform((isi, ctx) => {
      const terisi = rapikan(isi);
      if (terisi === null) return null;
      const nomor = normalkanNomorWhatsApp(terisi);
      if (nomor.sah) return nomor.dinormalkan;
      ctx.addIssue({ code: "custom", message: PESAN_NOMOR_HP });
      return z.NEVER;
    }),
  });
}

export type HasilPeriksaDraf =
  | { sah: true; draf: DrafFormulirPendaftaran }
  | { sah: false; galat: GalatIsian };

/**
 * Memeriksa bentuk setiap isian sebelum disimpan sebagai draf. Bila ada yang salah, hasilnya membawa pesan untuk
 * setiap isian yang salah, supaya setiap isian itu bisa ditandai.
 */
export function periksaDrafFormulirPendaftaran(
  isian: IsianFormulirPendaftaran,
  idPilihan: IdPilihan,
): HasilPeriksaDraf {
  const hasil = skemaDraf(idPilihan).safeParse(isian);
  if (!hasil.success) {
    const galat: GalatIsian = {};
    for (const masalah of hasil.error.issues) {
      const nama = masalah.path[0] as NamaIsian;
      galat[nama] ??= masalah.message;
    }
    return { sah: false, galat };
  }
  const { bidangKerja, ...lainnya } = hasil.data;
  return { sah: true, draf: { ...lainnya, ...bidangKerja } };
}

/**
 * Isian formulir dari draf yang tersimpan. Program atau bidang kerja yang sudah dinonaktifkan sejak draf disimpan
 * tidak bisa dipilih lagi (PRD §4.3), jadi isiannya kosong.
 */
export function keIsianFormulir(
  draf: DrafFormulirPendaftaran | undefined,
  idPilihan: IdPilihan,
): IsianFormulirPendaftaran {
  if (!draf) return ISIAN_KOSONG;
  const idTerpilih = (id: number | null, daftarId: readonly number[]) =>
    id !== null && daftarId.includes(id) ? String(id) : "";
  return {
    namaLengkap: draf.namaLengkap ?? "",
    jenisKelamin: draf.jenisKelamin ?? "",
    tempatLahir: draf.tempatLahir ?? "",
    tanggalLahir: draf.tanggalLahir ?? "",
    kabupatenKota: draf.kabupatenKota ?? "",
    provinsi: draf.provinsi ?? "",
    pendidikanTerakhir: draf.pendidikanTerakhir ?? "",
    jurusanPendidikan: draf.jurusanPendidikan ?? "",
    programId: idTerpilih(draf.programId, idPilihan.programId),
    bidangKerja: draf.bidangKerjaBelumTahu
      ? NILAI_BELUM_TAHU
      : idTerpilih(draf.bidangKerjaId, idPilihan.bidangKerjaId),
    kemampuanBahasaJepang: draf.kemampuanBahasaJepang ?? "",
    pengalamanKerja: draf.pengalamanKerja ?? "",
    namaKontakDarurat: draf.namaKontakDarurat ?? "",
    hubunganKontakDarurat: draf.hubunganKontakDarurat ?? "",
    nomorHpKontakDarurat: draf.nomorHpKontakDarurat ?? "",
  };
}
