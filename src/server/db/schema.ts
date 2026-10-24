// Skema database Drizzle. Tabel ditambahkan oleh tiket yang membutuhkannya,
// lalu migrasinya dibuat dengan `pnpm exec drizzle-kit generate`.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Empat tabel Better Auth (src/server/auth.ts) dengan nama tabel berbahasa Indonesia:
// akun (model "user"), sesi ("session"), kredensial ("account"), dan verifikasi ("verification").
// Nama properti kolom bawaan Better Auth (name, email, emailVerified, …) tidak diubah, karena adapter Drizzle
// mencocokkannya dengan nama itu. Instan waktu disimpan sebagai timestamptz.

const waktu = (nama: string) => timestamp(nama, { withTimezone: true });

/** Akun pegawai dan pemilik akun. Satu email untuk satu akun (PRD §5.1); Better Auth menyimpannya huruf kecil. */
export const akun = pgTable(
  "akun",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    jenis: text("jenis", { enum: ["pegawai", "pemilik_akun"] }).notNull(),
    // Hanya pegawai yang punya peran (PRD §2.2).
    peran: text("peran", { enum: ["admin", "staf"] }),
    // Pegawai nonaktif tidak bisa masuk (PRD §5.5).
    aktif: boolean("aktif").notNull().default(true),
    createdAt: waktu("created_at").notNull().defaultNow(),
    updatedAt: waktu("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check("akun_jenis_sah", sql`${t.jenis} in ('pegawai', 'pemilik_akun')`),
    check("akun_peran_sah", sql`${t.peran} in ('admin', 'staf')`),
    check(
      "akun_peran_hanya_untuk_pegawai",
      sql`(${t.jenis} = 'pegawai') = (${t.peran} is not null)`,
    ),
  ],
);

export const sesi = pgTable(
  "sesi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expiresAt: waktu("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: waktu("created_at").notNull().defaultNow(),
    updatedAt: waktu("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => akun.id, { onDelete: "cascade" }),
  },
  (t) => [index("sesi_user_id_idx").on(t.userId)],
);

/** Cara masuk sebuah akun. Untuk email dan kata sandi: providerId "credential" dengan hash kata sandi. */
export const kredensial = pgTable(
  "kredensial",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => akun.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: waktu("access_token_expires_at"),
    refreshTokenExpiresAt: waktu("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: waktu("created_at").notNull().defaultNow(),
    updatedAt: waktu("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("kredensial_user_id_idx").on(t.userId)],
);

export const verifikasi = pgTable(
  "verifikasi",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: waktu("expires_at").notNull(),
    createdAt: waktu("created_at").notNull().defaultNow(),
    updatedAt: waktu("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("verifikasi_identifier_idx").on(t.identifier)],
);

// Program dan bidang kerja yang dikelola Admin (PRD §4). Keduanya tidak pernah dihapus, hanya dinonaktifkan
// (§4.3). Id bilangan bulat dipakai di alamat halaman rincian program, misalnya /program/1.
// Isi awalnya diisi oleh migrasi data drizzle/0003_isi_awal_program_bidang_kerja.sql.

/** Program: jalur pelatihan menuju Jepang (PRD §4.1). Batas usia dalam tahun penuh (§6.3). */
export const program = pgTable("program", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nama: text("nama").notNull(),
  deskripsi: text("deskripsi").notNull(),
  syarat: text("syarat").notNull(),
  lamaPelatihan: text("lama_pelatihan").notNull(),
  usiaMinimal: integer("usia_minimal").notNull(),
  usiaMaksimal: integer("usia_maksimal").notNull(),
  aktif: boolean("aktif").notNull().default(true),
});

/** Bidang kerja: sektor pekerjaan di Jepang (PRD §4.2). "Belum tahu" adalah pilihan formulir, bukan bidang kerja. */
export const bidangKerja = pgTable("bidang_kerja", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nama: text("nama").notNull(),
  aktif: boolean("aktif").notNull().default(true),
});
