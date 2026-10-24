// Skema database Drizzle. Tabel ditambahkan oleh tiket yang membutuhkannya,
// lalu migrasinya dibuat dengan `pnpm exec drizzle-kit generate`.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
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

// Statistik lembaga yang diisi Admin secara manual (PRD §3.3, ADR-0005), bukan dihitung dari data pendaftaran.
// Hanya ada satu statistik lembaga, jadi tabelnya satu baris (id 1) yang diubah setiap kali Admin menyimpan.
// Total siswa tidak disimpan: total itu dihitung sistem dari jumlah siswa per level.
// Isi awalnya diisi oleh migrasi data drizzle/0005_isi_awal_statistik_lembaga.sql.

/** Kolom angka statistik lembaga: bilangan bulat wajib, 0 atau lebih (dijaga CHECK di setiap tabel). */
const angkaStatistik = (nama: string) => integer(nama).notNull();

/** Data per, jumlah siswa per level (N5, N4, N3, N2), dan jumlah alumni di Jepang. */
export const statistikLembaga = pgTable(
  "statistik_lembaga",
  {
    id: integer("id").primaryKey().default(1),
    // Tanggal kalender tanpa jam, jadi disimpan sebagai date, bukan timestamptz.
    dataPer: date("data_per", { mode: "string" }).notNull(),
    siswaN5: angkaStatistik("siswa_n5"),
    siswaN4: angkaStatistik("siswa_n4"),
    siswaN3: angkaStatistik("siswa_n3"),
    siswaN2: angkaStatistik("siswa_n2"),
    alumniDiJepang: angkaStatistik("alumni_di_jepang"),
  },
  (t) => [
    check("statistik_lembaga_satu_baris", sql`${t.id} = 1`),
    check(
      "statistik_lembaga_angka_tidak_negatif",
      sql`${t.siswaN5} >= 0 and ${t.siswaN4} >= 0 and ${t.siswaN3} >= 0 and ${t.siswaN2} >= 0 and ${t.alumniDiJepang} >= 0`,
    ),
  ],
);

/** Jumlah siswa per bidang kerja dari statistik lembaga: satu baris untuk setiap bidang kerja aktif saat disimpan. */
export const statistikLembagaBidangKerja = pgTable(
  "statistik_lembaga_bidang_kerja",
  {
    bidangKerjaId: integer("bidang_kerja_id")
      .primaryKey()
      .references(() => bidangKerja.id),
    jumlahSiswa: angkaStatistik("jumlah_siswa"),
  },
  (t) => [
    check(
      "statistik_lembaga_bidang_kerja_angka_tidak_negatif",
      sql`${t.jumlahSiswa} >= 0`,
    ),
  ],
);

// Kontak lembaga yang dikelola Admin (PRD §3.5). Hanya ada satu kontak lembaga, jadi tabelnya satu baris (id 1).
// Isi awalnya diisi oleh migrasi data drizzle/0007_isi_awal_kontak.sql.

/**
 * Alamat, nomor WhatsApp kantor, email kantor, dan tautan lokasi peta. Nomor WhatsApp disimpan dalam bentuk
 * ternormalisasi (PRD §5.2), misalnya 6281234567890. Nomor WhatsApp dan tautan peta boleh kosong selama belum ada.
 */
export const kontak = pgTable(
  "kontak",
  {
    id: integer("id").primaryKey().default(1),
    alamat: text("alamat").notNull(),
    nomorWhatsApp: text("nomor_whatsapp"),
    email: text("email").notNull(),
    tautanPeta: text("tautan_peta"),
  },
  (t) => [check("kontak_satu_baris", sql`${t.id} = 1`)],
);

// Foto galeri yang dikelola Admin (PRD §3.4, ▶ Keputusan OD-16). Berkas fotonya disimpan di disk server, di folder
// FOLDER_FOTO_GALERI (src/server/foto-galeri.ts); tabel ini hanya menyimpan nama berkasnya. Isi awalnya kosong
// (OD-06).

/** Judul, tanggal kegiatan, dan nama berkas foto di folder foto galeri, misalnya 3f2a…c9.jpeg. */
export const fotoGaleri = pgTable("foto_galeri", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  judul: text("judul").notNull(),
  // Tanggal kalender tanpa jam, jadi disimpan sebagai date, bukan timestamptz.
  tanggalKegiatan: date("tanggal_kegiatan", { mode: "string" }).notNull(),
  namaBerkas: text("nama_berkas").notNull().unique(),
  diunggahPada: waktu("diunggah_pada").notNull().defaultNow(),
});
