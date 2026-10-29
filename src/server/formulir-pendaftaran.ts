import { eq } from "drizzle-orm";
import {
  bisaDipilihDiFormulirPendaftaran,
  bisaDipilihSaatPegawaiMengubahIsian,
} from "@/domain/program-dan-bidang-kerja";
import { daftarBidangKerja } from "./bidang-kerja";
import { db } from "./db";
import { drafFormulirPendaftaran } from "./db/schema";
import { kunciAkun, nomorPendaftaranBerjalan } from "./pendaftaran";
import { daftarProgram } from "./program";

// Draf formulir pendaftaran pemilik akun (PRD §6.1, §6.2): satu draf per akun, disimpan kapan saja meski belum
// lengkap, lalu dimuat kembali saat pemilik akun masuk lagi.

/** Isian draf; isian yang belum diisi bernilai null. */
export type DrafFormulirPendaftaran = Omit<
  typeof drafFormulirPendaftaran.$inferSelect,
  "akunId"
>;

/** Program atau bidang kerja yang bisa dipilih di formulir pendaftaran. */
type Pilihan = { id: number; nama: string };

export type PilihanFormulirPendaftaran = {
  program: Pilihan[];
  bidangKerja: Pilihan[];
};

/** Hanya program dan bidang kerja aktif yang bisa dipilih (PRD §4.3), dalam urutan ditambahkan. */
export async function bacaPilihanFormulirPendaftaran(): Promise<PilihanFormulirPendaftaran> {
  const [semuaProgram, semuaBidangKerja] = await Promise.all([
    daftarProgram(),
    daftarBidangKerja(),
  ]);
  const kePilihan = ({ id, nama }: Pilihan) => ({ id, nama });
  return {
    program: bisaDipilihDiFormulirPendaftaran(semuaProgram).map(kePilihan),
    bidangKerja:
      bisaDipilihDiFormulirPendaftaran(semuaBidangKerja).map(kePilihan),
  };
}

/** Program atau bidang kerja yang bisa dipilih pegawai, dengan statusnya, supaya yang nonaktif bisa ditandai. */
type PilihanPegawai = Pilihan & { aktif: boolean };

/**
 * Program dan bidang kerja yang bisa dipilih pegawai saat mengubah isian formulir sebuah pendaftaran: yang aktif,
 * ditambah yang tercatat pada pendaftaran itu meski sudah dinonaktifkan (PRD §4.3), dalam urutan ditambahkan.
 */
export async function bacaPilihanUbahIsian(tercatat: {
  programId: number;
  bidangKerjaId: number | null;
}): Promise<{ program: PilihanPegawai[]; bidangKerja: PilihanPegawai[] }> {
  const [semuaProgram, semuaBidangKerja] = await Promise.all([
    daftarProgram(),
    daftarBidangKerja(),
  ]);
  const kePilihan = ({ id, nama, aktif }: PilihanPegawai) => ({
    id,
    nama,
    aktif,
  });
  return {
    program: bisaDipilihSaatPegawaiMengubahIsian(
      semuaProgram,
      tercatat.programId,
    ).map(kePilihan),
    bidangKerja: bisaDipilihSaatPegawaiMengubahIsian(
      semuaBidangKerja,
      tercatat.bidangKerjaId,
    ).map(kePilihan),
  };
}

/** Draf milik sebuah akun, atau undefined bila akun itu belum pernah menyimpan draf. */
export async function bacaDrafFormulirPendaftaran(
  akunId: string,
): Promise<DrafFormulirPendaftaran | undefined> {
  const [baris] = await db
    .select()
    .from(drafFormulirPendaftaran)
    .where(eq(drafFormulirPendaftaran.akunId, akunId));
  return baris;
}

export type HasilSimpanDraf =
  { hasil: "tersimpan" } | { hasil: "terkunci"; nomorPendaftaran: string };

/**
 * Menyimpan draf sebuah akun; draf yang sudah ada diganti seluruhnya, termasuk isian yang dikosongkan. Selama akun itu
 * punya pendaftaran Berjalan, isian formulirnya terkunci (PRD §6.5), jadi draf tidak disimpan.
 */
export async function simpanDrafFormulirPendaftaran(
  akunId: string,
  draf: DrafFormulirPendaftaran,
): Promise<HasilSimpanDraf> {
  return db.transaction(async (tx) => {
    await kunciAkun(tx, akunId);
    const nomorPendaftaran = await nomorPendaftaranBerjalan(tx, akunId);
    if (nomorPendaftaran !== null)
      return { hasil: "terkunci", nomorPendaftaran };
    await tx
      .insert(drafFormulirPendaftaran)
      .values({ akunId, ...draf })
      .onConflictDoUpdate({
        target: drafFormulirPendaftaran.akunId,
        set: draf,
      });
    return { hasil: "tersimpan" };
  });
}
