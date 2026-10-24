import { eq } from "drizzle-orm";
import { db } from "./db";
import { kontak } from "./db/schema";

// Kontak lembaga yang dikelola Admin (PRD §3.5). Hanya ada satu kontak lembaga, disimpan di baris id 1.

const ID_KONTAK = 1;

/**
 * Kontak lembaga seperti yang disimpan Admin. `nomorWhatsApp` berbentuk ternormalisasi (PRD §5.2), misalnya
 * 6281234567890; `nomorWhatsApp` dan `tautanPeta` null selama belum diisi.
 */
export type Kontak = {
  alamat: string;
  nomorWhatsApp: string | null;
  email: string;
  tautanPeta: string | null;
};

/** Kontak lembaga yang tersimpan; undefined bila belum pernah diisi. */
export async function bacaKontak(): Promise<Kontak | undefined> {
  const [baris] = await db
    .select({
      alamat: kontak.alamat,
      nomorWhatsApp: kontak.nomorWhatsApp,
      email: kontak.email,
      tautanPeta: kontak.tautanPeta,
    })
    .from(kontak)
    .where(eq(kontak.id, ID_KONTAK));
  return baris;
}

/** Menyimpan kontak lembaga yang nomor WhatsApp-nya sudah dinormalkan aturan domain. */
export async function simpanKontak(isian: Kontak): Promise<void> {
  await db
    .insert(kontak)
    .values({ id: ID_KONTAK, ...isian })
    .onConflictDoUpdate({ target: kontak.id, set: isian });
}
