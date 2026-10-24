import { asc, eq } from "drizzle-orm";
import { tampilDiSitusPublik } from "@/domain/program-dan-bidang-kerja";
import { db } from "./db";
import { program } from "./db/schema";

// Program yang dikelola Admin (PRD §4.1). Program tidak pernah dihapus, hanya dinonaktifkan (§4.3).
// Daftar diurutkan menurut urutan program ditambahkan, jadi isi awal tampil seperti di prototipe Beranda.

export type Program = typeof program.$inferSelect;

/** Isian program dari Admin: semua kolom kecuali id dan status aktif. */
export type IsianProgram = Omit<Program, "id" | "aktif">;

/** Semua program, aktif maupun nonaktif, untuk panel Admin. */
export async function daftarProgram(): Promise<Program[]> {
  return db.select().from(program).orderBy(asc(program.id));
}

/** Program yang tampil di situs publik: hanya yang aktif (§4.3). */
export async function daftarProgramDiSitusPublik(): Promise<Program[]> {
  return tampilDiSitusPublik(await daftarProgram());
}

export async function cariProgram(id: number): Promise<Program | undefined> {
  const [baris] = await db.select().from(program).where(eq(program.id, id));
  return baris;
}

/** Program untuk halaman rinciannya di situs publik; program nonaktif tidak tampil (§4.3). */
export async function cariProgramDiSitusPublik(
  id: number,
): Promise<Program | undefined> {
  const baris = await cariProgram(id);
  return baris && tampilDiSitusPublik([baris])[0];
}

/** Program baru langsung aktif. */
export async function tambahProgram(isian: IsianProgram): Promise<Program> {
  const [baris] = await db.insert(program).values(isian).returning();
  return baris;
}

/** Mengubah isian sebuah program; undefined bila program itu tidak ada. */
export async function ubahProgram(
  id: number,
  perubahan: IsianProgram | { aktif: boolean },
): Promise<Program | undefined> {
  const [baris] = await db
    .update(program)
    .set(perubahan)
    .where(eq(program.id, id))
    .returning();
  return baris;
}
