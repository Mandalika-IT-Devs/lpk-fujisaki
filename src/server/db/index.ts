import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Koneksi baru dibuka saat kueri pertama, jadi modul ini aman diimpor saat build.
const klien = postgres(process.env.DATABASE_URL ?? "");

export const db = drizzle(klien, { schema });

/** Menutup koneksi, untuk skrip yang harus selesai setelah pekerjaannya (misalnya `pnpm admin:pertama`). */
export async function tutupDatabase(): Promise<void> {
  await klien.end();
}
