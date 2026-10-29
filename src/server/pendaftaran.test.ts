import { randomInt, randomUUID } from "node:crypto";
import { config } from "dotenv";
import { and, eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Test integrasi pengiriman formulir pendaftaran dengan PostgreSQL sungguhan (issue T13, PRD §6.2, §6.4–§6.6, §7.1).
// Sama seperti test e2e, test ini memakai database test dari .env.ci (app_test), tidak pernah database pengembangan.
// Modul database dimuat sesudah .env.ci dibaca, karena koneksinya memakai DATABASE_URL.
config({ path: ".env.ci", override: true, quiet: true });
const { db, tutupDatabase } = await import("./db");
const { akun, langkahPendaftaran, pendaftaran, program } =
  await import("./db/schema");
const { bacaDrafFormulirPendaftaran, simpanDrafFormulirPendaftaran } =
  await import("./formulir-pendaftaran");
const { bacaPendaftaranBerjalan, kirimPendaftaran } =
  await import("./pendaftaran");
const { ubahProgram } = await import("./program");

/** Saat kirim contoh: 23-10-2026 pukul 10.00 WIB (PRD §6.3). */
const DIKIRIM_PADA = new Date("2026-10-23T03:00:00Z");

let programUji: { id: number; nama: string };

beforeAll(async () => {
  const [{ nama }] = await db.execute<{ nama: string }>(
    "select current_database() as nama",
  );
  if (!nama.endsWith("_test")) {
    throw new Error(
      `Test integrasi hanya boleh memakai database test, bukan "${nama}". Periksa DATABASE_URL di .env.ci.`,
    );
  }
  await migrate(db, { migrationsFolder: "drizzle" });
  // Program sendiri, supaya menonaktifkannya tidak mengubah program isi awal.
  [programUji] = await db
    .insert(program)
    .values({
      nama: `Program Uji ${randomUUID()}`,
      deskripsi: "Deskripsi uji",
      syarat: "Syarat uji",
      lamaPelatihan: "6 bulan",
      usiaMinimal: 18,
      usiaMaksimal: 30,
    })
    .returning({ id: program.id, nama: program.nama });
});

afterAll(async () => {
  await tutupDatabase();
});

/** Akun calon peserta sintetis dengan email dan nomor WhatsApp sendiri. */
async function buatPemilikAkun({ emailTerverifikasi = true } = {}) {
  const [baris] = await db
    .insert(akun)
    .values({
      name: "Calon Peserta Uji",
      email: `calon.${randomUUID()}@contoh.test`,
      emailVerified: emailTerverifikasi,
      jenis: "pemilik_akun",
      nomorWhatsApp: `62812${randomInt(10_000_000, 100_000_000)}`,
      waktuPersetujuan: new Date(),
    })
    .returning({ id: akun.id });
  return baris.id;
}

/** Isian formulir lengkap yang sah, untuk program uji dengan rentang 18–30. */
function drafLengkap() {
  return {
    namaLengkap: "Sari Wulandari",
    jenisKelamin: "Perempuan" as const,
    tempatLahir: "Cilacap",
    tanggalLahir: "2004-02-29",
    kabupatenKota: "Kab. Cilacap",
    provinsi: "Jawa Tengah" as const,
    pendidikanTerakhir: "SMK" as const,
    jurusanPendidikan: null,
    programId: programUji.id,
    bidangKerjaId: null,
    bidangKerjaBelumTahu: true,
    kemampuanBahasaJepang: "N5" as const,
    pengalamanKerja: null,
    namaKontakDarurat: "Siti Aminah",
    hubunganKontakDarurat: "Ibu",
    nomorHpKontakDarurat: "6281234567890",
  };
}

/** Nomor urut dari nomor pendaftaran FGC-TTTT-NNNN. */
function urutan(nomor: string): number {
  return Number(nomor.split("-")[2]);
}

async function kirimLalu(akunId: string) {
  const hasil = await kirimPendaftaran(akunId, drafLengkap(), DIKIRIM_PADA);
  if (hasil.hasil !== "terkirim") {
    throw new Error(
      `Pengiriman contoh seharusnya diterima: ${JSON.stringify(hasil)}`,
    );
  }
  return hasil.nomorPendaftaran;
}

describe("kirimPendaftaran", () => {
  it("dua pengiriman bersamaan di tahun yang sama mendapat dua nomor berbeda yang berurutan", async () => {
    const [akunA, akunB] = await Promise.all([
      buatPemilikAkun(),
      buatPemilikAkun(),
    ]);

    const nomor = await Promise.all([kirimLalu(akunA), kirimLalu(akunB)]);

    expect(nomor[0]).not.toBe(nomor[1]);
    for (const n of nomor) expect(n).toMatch(/^FGC-2026-\d{4,}$/);
    const [kecil, besar] = nomor.map(urutan).sort((a, b) => a - b);
    expect(besar - kecil).toBe(1);
  });

  it("nomor tidak dipakai ulang, juga sesudah pendaftarannya terhapus bersama akunnya (PRD §6.4)", async () => {
    const akunLama = await buatPemilikAkun();
    const nomorLama = await kirimLalu(akunLama);
    await db.delete(akun).where(eq(akun.id, akunLama));

    const nomorBaru = await kirimLalu(await buatPemilikAkun());

    expect(urutan(nomorBaru)).toBe(urutan(nomorLama) + 1);
  });

  it("membuka pendaftaran Berjalan di tahap 1 dengan L1.1–L1.5 Belum, menyimpan isiannya, dan menghapus draf (PRD §6.5)", async () => {
    const akunId = await buatPemilikAkun();
    await simpanDrafFormulirPendaftaran(akunId, {
      ...drafLengkap(),
      namaLengkap: "Nama Di Draf",
    });

    const nomor = await kirimLalu(akunId);

    expect(await bacaPendaftaranBerjalan(akunId)).toEqual({
      nomor,
      program: programUji.nama,
      status: "Berjalan",
      tahap: 1,
    });
    const [dibuka] = await db
      .select()
      .from(pendaftaran)
      .where(eq(pendaftaran.nomor, nomor));
    expect(dibuka).toMatchObject({
      ...drafLengkap(),
      akunId,
      dikirimPada: DIKIRIM_PADA,
    });
    const langkahTahap1 = await db
      .select({
        kode: langkahPendaftaran.kode,
        status: langkahPendaftaran.status,
      })
      .from(langkahPendaftaran)
      .where(
        and(
          eq(langkahPendaftaran.pendaftaranId, dibuka.id),
          sql`${langkahPendaftaran.kode} like 'L1.%'`,
        ),
      )
      .orderBy(langkahPendaftaran.kode);
    expect(langkahTahap1).toEqual([
      { kode: "L1.1", status: "Belum" },
      { kode: "L1.2", status: "Belum" },
      { kode: "L1.3", status: "Belum" },
      { kode: "L1.4", status: "Belum" },
      { kode: "L1.5", status: "Belum" },
    ]);
    expect(await bacaDrafFormulirPendaftaran(akunId)).toBeUndefined();
  });

  it("menolak formulir kedua selama masih ada pendaftaran Berjalan, juga bila keduanya dikirim bersamaan (UAT-F4)", async () => {
    const akunId = await buatPemilikAkun();

    const hasil = await Promise.all([
      kirimPendaftaran(akunId, drafLengkap(), DIKIRIM_PADA),
      kirimPendaftaran(akunId, drafLengkap(), DIKIRIM_PADA),
    ]);

    const terkirim = hasil.filter((h) => h.hasil === "terkirim");
    expect(terkirim).toHaveLength(1);
    expect(hasil.filter((h) => h.hasil === "ditolak")).toEqual([
      {
        hasil: "ditolak",
        gagal: [
          {
            syarat: "satu-pendaftaran-berjalan",
            nomorPendaftaran:
              terkirim[0].hasil === "terkirim" && terkirim[0].nomorPendaftaran,
          },
        ],
      },
    ]);
  });

  it("menolak akun yang emailnya belum terverifikasi (UAT-F2)", async () => {
    const akunId = await buatPemilikAkun({ emailTerverifikasi: false });

    expect(await kirimPendaftaran(akunId, drafLengkap(), DIKIRIM_PADA)).toEqual(
      { hasil: "ditolak", gagal: [{ syarat: "email-terverifikasi" }] },
    );
    expect(await bacaPendaftaranBerjalan(akunId)).toBeUndefined();
  });

  it("pendaftaran tetap Berjalan dengan programnya sesudah program itu dinonaktifkan (UAT-D1, bagian akhir)", async () => {
    const akunId = await buatPemilikAkun();
    const nomor = await kirimLalu(akunId);

    await ubahProgram(programUji.id, { aktif: false });
    try {
      expect(await bacaPendaftaranBerjalan(akunId)).toEqual({
        nomor,
        program: programUji.nama,
        status: "Berjalan",
        tahap: 1,
      });
    } finally {
      await ubahProgram(programUji.id, { aktif: true });
    }
  });
});

describe("simpanDrafFormulirPendaftaran sesudah formulir dikirim", () => {
  it("menolak menyimpan draf selama pendaftarannya Berjalan, karena isiannya terkunci (PRD §6.5)", async () => {
    const akunId = await buatPemilikAkun();
    const nomor = await kirimLalu(akunId);

    expect(
      await simpanDrafFormulirPendaftaran(akunId, {
        ...drafLengkap(),
        namaLengkap: "Nama Diubah",
      }),
    ).toEqual({ hasil: "terkunci", nomorPendaftaran: nomor });
    expect(await bacaDrafFormulirPendaftaran(akunId)).toBeUndefined();
  });

  it("menyimpan draf selama akun itu belum punya pendaftaran Berjalan", async () => {
    const akunId = await buatPemilikAkun();

    expect(await simpanDrafFormulirPendaftaran(akunId, drafLengkap())).toEqual({
      hasil: "tersimpan",
    });
    expect(await bacaDrafFormulirPendaftaran(akunId)).toMatchObject(
      drafLengkap(),
    );
  });
});
