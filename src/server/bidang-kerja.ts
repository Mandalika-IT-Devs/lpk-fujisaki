import { asc, eq } from "drizzle-orm";
import { tampilDiSitusPublik } from "@/domain/program-dan-bidang-kerja";
import { db } from "./db";
import { bidangKerja } from "./db/schema";

// Bidang kerja yang dikelola Admin (PRD §4.2). Bidang kerja tidak pernah dihapus, hanya dinonaktifkan (§4.3).
// Daftar diurutkan menurut urutan bidang kerja ditambahkan.

export type BidangKerja = typeof bidangKerja.$inferSelect;

/** Semua bidang kerja, aktif maupun nonaktif, untuk panel Admin. */
export async function daftarBidangKerja(): Promise<BidangKerja[]> {
  return db.select().from(bidangKerja).orderBy(asc(bidangKerja.id));
}

/** Bidang kerja yang tampil di situs publik: hanya yang aktif (§4.3). */
export async function daftarBidangKerjaDiSitusPublik(): Promise<BidangKerja[]> {
  return tampilDiSitusPublik(await daftarBidangKerja());
}

export async function cariBidangKerja(
  id: number,
): Promise<BidangKerja | undefined> {
  const [baris] = await db
    .select()
    .from(bidangKerja)
    .where(eq(bidangKerja.id, id));
  return baris;
}

/** Bidang kerja baru langsung aktif. */
export async function tambahBidangKerja(nama: string): Promise<BidangKerja> {
  const [baris] = await db.insert(bidangKerja).values({ nama }).returning();
  return baris;
}

/** Mengubah nama atau status sebuah bidang kerja; undefined bila bidang kerja itu tidak ada. */
export async function ubahBidangKerja(
  id: number,
  perubahan: { nama: string } | { aktif: boolean },
): Promise<BidangKerja | undefined> {
  const [baris] = await db
    .update(bidangKerja)
    .set(perubahan)
    .where(eq(bidangKerja.id, id))
    .returning();
  return baris;
}
