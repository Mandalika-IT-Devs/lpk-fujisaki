import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { akun, kredensial } from "../../src/server/db/schema";
import {
  ADMIN,
  jalankanAdminPertama,
  type PegawaiUji,
  STAF,
  STAF_LUPA_SANDI,
  STAF_NONAKTIF,
} from "./pegawai-uji";

/**
 * Setup global Playwright: mengosongkan database test (dari .env.ci), menerapkan semua migrasi,
 * lalu mengisi pegawai uji. CI tidak menjalankan migrasi sendiri, jadi langkah ini ada di sisi test.
 */
export default async function siapkanDatabase() {
  const klien = postgres(process.env.DATABASE_URL ?? "", {
    onnotice: () => {},
  });
  try {
    const [{ nama }] = await klien<
      { nama: string }[]
    >`select current_database() as nama`;
    if (!nama.endsWith("_test")) {
      throw new Error(
        `Test e2e hanya boleh mengosongkan database test, bukan "${nama}". Periksa DATABASE_URL di .env.ci.`,
      );
    }
    await klien`drop schema if exists drizzle cascade`;
    await klien`drop schema public cascade`;
    await klien`create schema public`;

    const db = drizzle(klien);
    await migrate(db, { migrationsFolder: "drizzle" });

    const admin = jalankanAdminPertama(ADMIN);
    if (admin.kodeKeluar !== 0) {
      throw new Error(
        `pnpm admin:pertama gagal saat menyiapkan data uji. Perbaiki penyebab pada keluarannya di bawah, lalu jalankan test lagi:\n${admin.keluaran}`,
      );
    }

    await isiStaf(db, STAF, true);
    await isiStaf(db, STAF_NONAKTIF, false);
    await isiStaf(db, STAF_LUPA_SANDI, true);
  } finally {
    await klien.end();
  }
}

async function isiStaf(
  db: ReturnType<typeof drizzle>,
  staf: PegawaiUji,
  aktif: boolean,
) {
  const [baris] = await db
    .insert(akun)
    .values({
      name: staf.nama,
      email: staf.email,
      emailVerified: true,
      jenis: "pegawai",
      peran: "staf",
      aktif,
    })
    .returning({ id: akun.id });
  await db.insert(kredensial).values({
    userId: baris.id,
    accountId: baris.id,
    providerId: "credential",
    password: await hashPassword(staf.kataSandi),
  });
}
