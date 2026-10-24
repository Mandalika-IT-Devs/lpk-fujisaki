import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import {
  type Akun,
  bolehMasuk,
  MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM,
  PANJANG_MINIMAL_KATA_SANDI,
} from "@/domain/akun";
import { db } from "./db";
import { akun, kredensial, sesi, verifikasi } from "./db/schema";
import { type KirimEmail, kirimEmail } from "./email";
import { templatAturUlangKataSandi } from "./templat-email";

/** Kode dan pesan galat saat pegawai nonaktif mencoba masuk (PRD §5.5). */
export const KODE_AKUN_NONAKTIF = "AKUN_NONAKTIF";
export const PESAN_AKUN_NONAKTIF =
  "Akun pegawai ini nonaktif, jadi tidak bisa masuk. Hubungi Admin lembaga bila ini keliru.";

/** Halaman tempat pegawai mengatur kata sandi baru dari tautan di email (src/app/panel/atur-ulang-kata-sandi). */
const HALAMAN_ATUR_ULANG_KATA_SANDI_PEGAWAI = "/panel/atur-ulang-kata-sandi";

/**
 * Autentikasi email dan kata sandi dengan Better Auth (ADR-0001).
 * Rahasia dan alamat situs dibaca Better Auth dari BETTER_AUTH_SECRET dan BETTER_AUTH_URL.
 * Basis data dan pengirim email disuntikkan, supaya src/server/auth.test.ts bisa memakai adapter memori.
 * Penjaga pegawai nonaktif di databaseHooks tetap membaca tabel akun lewat Drizzle.
 */
export function buatAuth({
  database,
  kirimEmail,
}: {
  database: BetterAuthOptions["database"];
  kirimEmail: KirimEmail;
}) {
  return betterAuth({
    database,
    emailAndPassword: {
      enabled: true,
      // Akun pegawai dibuat oleh skrip pemasangan dan oleh Admin, bukan lewat pendaftaran sendiri.
      disableSignUp: true,
      minPasswordLength: PANJANG_MINIMAL_KATA_SANDI,
      // Lupa kata sandi (PRD §5.4). Better Auth menolak tautan yang sudah lewat masa berlakunya.
      resetPasswordTokenExpiresIn:
        MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM * 60 * 60,
      // Tautan menuju halaman atur ulang pegawai di situs yang sama dengan alamat dari Better Auth (BETTER_AUTH_URL).
      sendResetPassword: async ({ user, url, token }) => {
        const tautan = new URL(HALAMAN_ATUR_ULANG_KATA_SANDI_PEGAWAI, url);
        tautan.searchParams.set("token", token);
        await kirimEmail({
          kepada: user.email,
          ...templatAturUlangKataSandi({
            nama: user.name,
            tautan: tautan.href,
          }),
        });
      },
    },
    user: {
      modelName: "akun",
      additionalFields: {
        jenis: {
          type: ["pegawai", "pemilik_akun"],
          required: true,
          input: false,
        },
        peran: { type: ["admin", "staf"], required: false, input: false },
        aktif: {
          type: "boolean",
          required: true,
          defaultValue: true,
          input: false,
        },
      },
    },
    session: { modelName: "sesi" },
    account: { modelName: "kredensial" },
    verification: { modelName: "verifikasi" },
    advanced: { database: { generateId: "uuid" } },
    databaseHooks: {
      session: {
        create: {
          // Dijalankan setelah kata sandi terbukti benar, jadi status nonaktif hanya terlihat oleh pemilik kata sandinya.
          before: async (sesiBaru) => {
            const [baris] = await db
              .select()
              .from(akun)
              .where(eq(akun.id, sesiBaru.userId));
            if (baris && !bolehMasuk(keAkun(baris))) {
              throw new APIError("FORBIDDEN", {
                code: KODE_AKUN_NONAKTIF,
                message: PESAN_AKUN_NONAKTIF,
              });
            }
          },
        },
      },
    },
    // nextCookies harus menjadi plugin terakhir: ia menulis cookie sesi dari Server Action.
    plugins: [nextCookies()],
  });
}

export const auth = buatAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { akun, sesi, kredensial, verifikasi },
  }),
  kirimEmail,
});

type BarisAkun = Pick<typeof akun.$inferSelect, "jenis" | "aktif"> & {
  peran?: (typeof akun.$inferSelect)["peran"];
};

/** Mengubah baris tabel akun (atau user dari sesi Better Auth) menjadi Akun di modul domain. */
export function keAkun(baris: BarisAkun): Akun {
  if (baris.jenis === "pemilik_akun") return { jenis: "pemilik_akun" };
  if (!baris.peran) {
    throw new Error(
      "Akun pegawai tanpa peran, padahal setiap pegawai berperan Admin atau Staf. Isi kolom peran akun itu di tabel akun dengan admin atau staf, lalu coba lagi.",
    );
  }
  return { jenis: "pegawai", peran: baris.peran, aktif: baris.aktif };
}
