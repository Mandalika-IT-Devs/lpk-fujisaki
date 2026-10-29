import { and, asc, eq, sql } from "drizzle-orm";
import {
  bagiHalaman,
  type HalamanDaftar,
  type SaringanPendaftaran,
  saringPendaftaran,
} from "@/domain/daftar-pendaftaran";
import { BIDANG_KERJA_BELUM_TAHU } from "@/domain/formulir-pendaftaran";
import {
  nomorPendaftaran,
  tahunNomorPendaftaran,
} from "@/domain/nomor-pendaftaran";
import {
  pendaftaranBaru,
  periksaSyaratKirim,
  type StatusPendaftaran,
  type SyaratKirimGagal,
} from "@/domain/pendaftaran";
import { db } from "./db";
import {
  akun,
  bidangKerja,
  drafFormulirPendaftaran,
  langkahPendaftaran,
  nomorUrutPendaftaran,
  pendaftaran,
  program,
} from "./db/schema";
import type { DrafFormulirPendaftaran } from "./formulir-pendaftaran";

// Pengiriman formulir pendaftaran dan pendaftaran yang dibukanya (PRD §6.2, §6.4–§6.6, §7.1).

type Transaksi = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Mengunci baris akun sampai transaksi selesai, supaya pengiriman formulir dan penyimpanan draf akun yang sama
 * bergiliran. Hasilnya status verifikasi email akun itu, atau undefined bila akunnya tidak ada.
 */
export async function kunciAkun(
  tx: Transaksi,
  akunId: string,
): Promise<{ emailTerverifikasi: boolean } | undefined> {
  const [baris] = await tx
    .select({ emailTerverifikasi: akun.emailVerified })
    .from(akun)
    .where(eq(akun.id, akunId))
    .for("update");
  return baris;
}

export type HasilKirimPendaftaran =
  | { hasil: "terkirim"; nomorPendaftaran: string }
  | { hasil: "ditolak"; gagal: SyaratKirimGagal[] };

/** Nomor pendaftaran Berjalan milik sebuah akun, atau null bila tidak ada (§6.6). */
export async function nomorPendaftaranBerjalan(
  tx: Transaksi,
  akunId: string,
): Promise<string | null> {
  const [baris] = await tx
    .select({ nomor: pendaftaran.nomor })
    .from(pendaftaran)
    .where(
      and(eq(pendaftaran.akunId, akunId), eq(pendaftaran.status, "Berjalan")),
    );
  return baris?.nomor ?? null;
}

/**
 * Mengambil nomor urut berikutnya dalam sebuah tahun WIB secara atomik: baris tahunnya dinaikkan satu, atau dibuat
 * dengan nomor urut 1 bila belum ada. Baris itu terkunci sampai transaksi selesai, jadi pengiriman lain di tahun yang
 * sama menunggu dan mendapat nomor sesudahnya. Bila transaksi dibatalkan, nomor itu tidak pernah diberikan.
 */
async function ambilNomorUrut(tx: Transaksi, tahun: number): Promise<number> {
  const [baris] = await tx
    .insert(nomorUrutPendaftaran)
    .values({ tahun, nomorUrutTerakhir: 1 })
    .onConflictDoUpdate({
      target: nomorUrutPendaftaran.tahun,
      set: {
        nomorUrutTerakhir: sql`${nomorUrutPendaftaran.nomorUrutTerakhir} + 1`,
      },
    })
    .returning({ nomorUrut: nomorUrutPendaftaran.nomorUrutTerakhir });
  return baris.nomorUrut;
}

/**
 * Pemilik akun mengirim formulir pendaftarannya pada saat `dikirimPada`. `draf` adalah isian formulir yang bentuknya
 * sudah diperiksa. Bila semua syarat kirim terpenuhi (§6.2), sistem membuka pendaftaran baru dengan nomor pendaftaran
 * (§6.4), status Berjalan di tahap 1, semua langkah Belum (§6.5), dan isian formulir sebagai bagian dari pendaftaran
 * itu. Draf akun itu lalu dihapus, supaya data pribadinya tidak tersimpan ganda (ADR-0004).
 *
 * Semuanya terjadi dalam satu transaksi. Baris akun dikunci lebih dulu, jadi dua pengiriman bersamaan dari akun yang
 * sama tidak bisa membuka dua pendaftaran Berjalan; indeks unik sebagian di tabel pendaftaran menjaganya juga.
 */
export async function kirimPendaftaran(
  akunId: string,
  draf: DrafFormulirPendaftaran,
  dikirimPada: Date,
): Promise<HasilKirimPendaftaran> {
  return db.transaction(async (tx) => {
    const pemilik = await kunciAkun(tx, akunId);
    const [programDipilih] =
      draf.programId === null
        ? []
        : await tx
            .select({
              usiaMinimal: program.usiaMinimal,
              usiaMaksimal: program.usiaMaksimal,
            })
            .from(program)
            .where(eq(program.id, draf.programId));

    const periksa = periksaSyaratKirim({
      emailTerverifikasi: pemilik?.emailTerverifikasi ?? false,
      formulir: {
        ...draf,
        bidangKerja: draf.bidangKerjaBelumTahu
          ? BIDANG_KERJA_BELUM_TAHU
          : draf.bidangKerjaId,
      },
      rentangUsia: programDipilih ?? null,
      dikirimPada,
      nomorPendaftaranBerjalan: await nomorPendaftaranBerjalan(tx, akunId),
    });
    if (!periksa.boleh) return { hasil: "ditolak", gagal: periksa.gagal };

    const nomorUrut = await ambilNomorUrut(
      tx,
      tahunNomorPendaftaran(dikirimPada),
    );
    const { nomor } = nomorPendaftaran({ dikirimPada, urutan: nomorUrut });
    // Bidang kerja disimpan dalam dua kolom, seperti di draf: id bidang kerja, atau tanda "Belum tahu".
    const { bidangKerja, ...isian } = periksa.formulir;
    const baru = pendaftaranBaru();
    const [dibuka] = await tx
      .insert(pendaftaran)
      .values({
        ...isian,
        bidangKerjaBelumTahu: bidangKerja === BIDANG_KERJA_BELUM_TAHU,
        akunId,
        nomor,
        dikirimPada,
        status: baru.status,
        tahap: baru.tahap,
      })
      .returning({ id: pendaftaran.id });
    await tx.insert(langkahPendaftaran).values(
      baru.langkah.map((langkah) => ({
        pendaftaranId: dibuka.id,
        ...langkah,
      })),
    );
    await tx
      .delete(drafFormulirPendaftaran)
      .where(eq(drafFormulirPendaftaran.akunId, akunId));
    return { hasil: "terkirim", nomorPendaftaran: nomor };
  });
}

/** Pendaftaran Berjalan seperti yang dilihat pemiliknya di halaman akun (PRD §2.3). */
export type PendaftaranBerjalan = {
  nomor: string;
  /** Nama program, juga bila program itu sudah dinonaktifkan (§4.3). */
  program: string;
  status: "Berjalan";
  tahap: number;
};

/** Pendaftaran Berjalan milik sebuah akun, atau undefined bila tidak ada. */
export async function bacaPendaftaranBerjalan(
  akunId: string,
): Promise<PendaftaranBerjalan | undefined> {
  const [baris] = await db
    .select({
      nomor: pendaftaran.nomor,
      program: program.nama,
      tahap: pendaftaran.tahap,
    })
    .from(pendaftaran)
    .innerJoin(program, eq(program.id, pendaftaran.programId))
    .where(
      and(eq(pendaftaran.akunId, akunId), eq(pendaftaran.status, "Berjalan")),
    );
  return baris && { ...baris, status: "Berjalan" };
}

/**
 * Satu baris daftar pendaftaran di panel pegawai (PRD §11.1). Nama program dan bidang kerja ikut dibaca, juga bila
 * keduanya sudah dinonaktifkan (§4.3). Bidang kerja berisi "Belum tahu" bila belum dipilih.
 */
export type BarisDaftarPendaftaran = {
  nomor: string;
  namaLengkap: string;
  programId: number;
  program: string;
  bidangKerjaId: number | null;
  bidangKerja: string;
  tahap: number;
  status: StatusPendaftaran;
  dikirimPada: Date;
};

/**
 * Satu halaman daftar pendaftaran untuk pegawai: pendaftaran yang cocok dengan saringan dan pencarian, dari yang
 * paling baru dikirim (§11.1). Saringan, urutan, dan pembagian halaman mengikuti modul domain, jadi semua pendaftaran
 * dibaca lebih dulu; lembaga menerima sekitar 100 pendaftaran per tahun (§1.1).
 */
export async function bacaDaftarPendaftaran(
  saringan: SaringanPendaftaran,
  halaman: number,
): Promise<HalamanDaftar<BarisDaftarPendaftaran>> {
  const semua = await db
    .select({
      nomor: pendaftaran.nomor,
      namaLengkap: pendaftaran.namaLengkap,
      programId: pendaftaran.programId,
      program: program.nama,
      bidangKerjaId: pendaftaran.bidangKerjaId,
      namaBidangKerja: bidangKerja.nama,
      tahap: pendaftaran.tahap,
      status: pendaftaran.status,
      dikirimPada: pendaftaran.dikirimPada,
    })
    .from(pendaftaran)
    .innerJoin(program, eq(program.id, pendaftaran.programId))
    .leftJoin(bidangKerja, eq(bidangKerja.id, pendaftaran.bidangKerjaId))
    // Urutan tetap sebelum diurutkan menurut saat kirim, supaya pendaftaran yang dikirim pada saat yang sama tidak
    // berpindah halaman di antara dua pembacaan.
    .orderBy(asc(pendaftaran.nomor));
  const baris = semua.map(({ namaBidangKerja, ...isi }) => ({
    ...isi,
    bidangKerja: namaBidangKerja ?? BIDANG_KERJA_BELUM_TAHU,
  }));
  return bagiHalaman(saringPendaftaran(baris, saringan), halaman);
}
