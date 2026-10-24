import { asc, desc, eq } from "drizzle-orm";
import { tampilDiSitusPublik } from "@/domain/program-dan-bidang-kerja";
import {
  hitungTotalSiswa,
  type SiswaPerLevel,
} from "@/domain/statistik-lembaga";
import { db } from "./db";
import {
  bidangKerja,
  statistikLembaga,
  statistikLembagaBidangKerja,
} from "./db/schema";

// Statistik lembaga yang diisi Admin secara manual (PRD §3.3, ADR-0005). Hanya ada satu statistik lembaga,
// disimpan di baris id 1. Total siswa tidak disimpan, tetapi dihitung aturan domain dari jumlah per level.

const ID_STATISTIK = 1;

/** Statistik lembaga seperti yang disimpan Admin. `dataPer` berbentuk YYYY-MM-DD. */
export type StatistikLembaga = {
  dataPer: string;
  perLevel: SiswaPerLevel;
  alumniDiJepang: number;
  perBidangKerja: { bidangKerjaId: number; jumlahSiswa: number }[];
};

async function bacaBaris() {
  const [baris] = await db
    .select()
    .from(statistikLembaga)
    .where(eq(statistikLembaga.id, ID_STATISTIK));
  return baris;
}

function keStatistik(
  baris: typeof statistikLembaga.$inferSelect,
): Omit<StatistikLembaga, "perBidangKerja"> {
  return {
    dataPer: baris.dataPer,
    perLevel: {
      N5: baris.siswaN5,
      N4: baris.siswaN4,
      N3: baris.siswaN3,
      N2: baris.siswaN2,
    },
    alumniDiJepang: baris.alumniDiJepang,
  };
}

/** Statistik lembaga yang tersimpan, untuk panel Admin; undefined bila belum pernah diisi. */
export async function bacaStatistikLembaga(): Promise<
  StatistikLembaga | undefined
> {
  const baris = await bacaBaris();
  if (!baris) return undefined;
  const perBidangKerja = await db
    .select({
      bidangKerjaId: statistikLembagaBidangKerja.bidangKerjaId,
      jumlahSiswa: statistikLembagaBidangKerja.jumlahSiswa,
    })
    .from(statistikLembagaBidangKerja);
  return { ...keStatistik(baris), perBidangKerja };
}

/** Bidang kerja aktif: statistik lembaga berisi satu angka untuk setiap bidang kerja aktif (PRD §3.3). */
export async function daftarBidangKerjaAktif(): Promise<
  { id: number; nama: string }[]
> {
  return db
    .select({ id: bidangKerja.id, nama: bidangKerja.nama })
    .from(bidangKerja)
    .where(eq(bidangKerja.aktif, true))
    .orderBy(asc(bidangKerja.id));
}

/** Statistik lembaga untuk Beranda, beserta total siswa yang dihitung aturan domain (PRD §3.3). */
export type StatistikLembagaDiSitusPublik = Omit<
  StatistikLembaga,
  "perBidangKerja"
> & {
  totalSiswa: number;
  perBidangKerja: {
    bidangKerjaId: number;
    nama: string;
    jumlahSiswa: number;
  }[];
};

/**
 * Statistik lembaga yang tampil di Beranda; undefined bila belum pernah diisi. Bidang kerja yang nonaktif tidak
 * tampil di situs publik (§4.3). Bidang kerja diurutkan dari jumlah siswa terbanyak, lalu menurut urutan
 * bidang kerja ditambahkan.
 */
export async function bacaStatistikLembagaDiSitusPublik(): Promise<
  StatistikLembagaDiSitusPublik | undefined
> {
  const baris = await bacaBaris();
  if (!baris) return undefined;
  const perBidangKerja = await db
    .select({
      bidangKerjaId: bidangKerja.id,
      nama: bidangKerja.nama,
      aktif: bidangKerja.aktif,
      jumlahSiswa: statistikLembagaBidangKerja.jumlahSiswa,
    })
    .from(statistikLembagaBidangKerja)
    .innerJoin(
      bidangKerja,
      eq(statistikLembagaBidangKerja.bidangKerjaId, bidangKerja.id),
    )
    .orderBy(
      desc(statistikLembagaBidangKerja.jumlahSiswa),
      asc(bidangKerja.id),
    );
  const statistik = keStatistik(baris);
  return {
    ...statistik,
    totalSiswa: hitungTotalSiswa(statistik.perLevel),
    perBidangKerja: tampilDiSitusPublik(perBidangKerja).map(
      ({ bidangKerjaId, nama, jumlahSiswa }) => ({
        bidangKerjaId,
        nama,
        jumlahSiswa,
      }),
    ),
  };
}

/**
 * Menyimpan statistik lembaga yang sudah diperiksa aturan domain. Jumlah per bidang kerja diganti seluruhnya,
 * supaya statistik yang tersimpan selalu satu kesatuan yang cocok dengan total siswanya.
 */
export async function simpanStatistikLembaga(
  statistik: StatistikLembaga,
): Promise<void> {
  const isian = {
    dataPer: statistik.dataPer,
    siswaN5: statistik.perLevel.N5,
    siswaN4: statistik.perLevel.N4,
    siswaN3: statistik.perLevel.N3,
    siswaN2: statistik.perLevel.N2,
    alumniDiJepang: statistik.alumniDiJepang,
  };
  await db.transaction(async (tx) => {
    await tx
      .insert(statistikLembaga)
      .values({ id: ID_STATISTIK, ...isian })
      .onConflictDoUpdate({ target: statistikLembaga.id, set: isian });
    await tx.delete(statistikLembagaBidangKerja);
    if (statistik.perBidangKerja.length > 0) {
      await tx
        .insert(statistikLembagaBidangKerja)
        .values(statistik.perBidangKerja);
    }
  });
}
