import { z } from "zod";

// Id bilangan bulat dari alamat halaman (misalnya "/program/3") atau dari isian tersembunyi formulir.
// Paling banyak sembilan digit, supaya selalu muat di kolom integer PostgreSQL.
const skemaId = z.string().regex(/^[1-9]\d{0,8}$/);

/** Id program atau bidang kerja, atau undefined bila teksnya bukan id. */
export function bacaId(teks: unknown): number | undefined {
  const hasil = skemaId.safeParse(teks);
  return hasil.success ? Number(hasil.data) : undefined;
}
