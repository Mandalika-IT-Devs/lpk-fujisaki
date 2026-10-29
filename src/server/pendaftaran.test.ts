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
const { akun, bidangKerja, langkahPendaftaran, pendaftaran, program } =
  await import("./db/schema");
const {
  bacaDrafFormulirPendaftaran,
  bacaPilihanUbahIsian,
  simpanDrafFormulirPendaftaran,
} = await import("./formulir-pendaftaran");
const {
  bacaDaftarPendaftaran,
  bacaPendaftaran,
  bacaPendaftaranBerjalan,
  kirimPendaftaran,
  ubahIsianPendaftaran,
} = await import("./pendaftaran");
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
      bidangKerja: "Belum tahu",
      status: "Berjalan",
      tahap: 1,
      isian: drafLengkap(),
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
        bidangKerja: "Belum tahu",
        status: "Berjalan",
        tahap: 1,
        isian: drafLengkap(),
      });
    } finally {
      await ubahProgram(programUji.id, { aktif: true });
    }
  });
});

describe("bacaPilihanUbahIsian", () => {
  it("program yang tercatat pada pendaftaran tetap bisa dipilih pegawai sesudah dinonaktifkan, program nonaktif lain tidak (PRD §4.3)", async () => {
    const [programLain] = await db
      .insert(program)
      .values({
        nama: `Program Lain Uji ${randomUUID()}`,
        deskripsi: "Deskripsi uji",
        syarat: "Syarat uji",
        lamaPelatihan: "6 bulan",
        usiaMinimal: 18,
        usiaMaksimal: 30,
        aktif: false,
      })
      .returning({ id: program.id });

    await ubahProgram(programUji.id, { aktif: false });
    try {
      const pilihan = await bacaPilihanUbahIsian({
        programId: programUji.id,
        bidangKerjaId: null,
      });
      expect(pilihan.program).toContainEqual({
        id: programUji.id,
        nama: programUji.nama,
        aktif: false,
      });
      expect(pilihan.program.map(({ id }) => id)).not.toContain(programLain.id);
      expect(pilihan.program.filter(({ aktif }) => !aktif)).toHaveLength(1);
      expect(pilihan.bidangKerja.every(({ aktif }) => aktif)).toBe(true);
    } finally {
      await ubahProgram(programUji.id, { aktif: true });
    }
  });
});

describe("bacaPendaftaran", () => {
  it("membaca nomor, status, tahap, nama program, isian, dan status setiap langkah dalam urutan PRD §7.1", async () => {
    const nomor = await kirimLalu(await buatPemilikAkun());
    const [dibuka] = await db
      .select({ id: pendaftaran.id })
      .from(pendaftaran)
      .where(eq(pendaftaran.nomor, nomor));
    await db
      .update(langkahPendaftaran)
      .set({ status: "Tidak berlaku" })
      .where(
        and(
          eq(langkahPendaftaran.pendaftaranId, dibuka.id),
          eq(langkahPendaftaran.kode, "L1.5"),
        ),
      );

    const dibaca = await bacaPendaftaran(nomor);

    expect(dibaca).toMatchObject({
      nomor,
      status: "Berjalan",
      tahap: 1,
      program: programUji.nama,
      bidangKerja: "Belum tahu",
      isian: drafLengkap(),
    });
    expect(dibaca?.langkah.slice(0, 6)).toEqual([
      { kode: "L1.1", status: "Belum" },
      { kode: "L1.2", status: "Belum" },
      { kode: "L1.3", status: "Belum" },
      { kode: "L1.4", status: "Belum" },
      { kode: "L1.5", status: "Tidak berlaku" },
      { kode: "L2.1", status: "Belum" },
    ]);
    expect(dibaca?.langkah).toHaveLength(22);
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

describe("bacaDaftarPendaftaran", () => {
  // Program dan bidang kerja sendiri, supaya saringan program hanya menemukan pendaftaran dari test ini.
  let programDaftar: { id: number; nama: string };
  let bidangKerjaDaftar: { id: number; nama: string };

  beforeAll(async () => {
    [programDaftar] = await db
      .insert(program)
      .values({
        nama: `Program Daftar Uji ${randomUUID()}`,
        deskripsi: "Deskripsi uji",
        syarat: "Syarat uji",
        lamaPelatihan: "6 bulan",
        usiaMinimal: 18,
        usiaMaksimal: 30,
      })
      .returning({ id: program.id, nama: program.nama });
    [bidangKerjaDaftar] = await db
      .insert(bidangKerja)
      .values({ nama: `Bidang Kerja Daftar Uji ${randomUUID()}` })
      .returning({ id: bidangKerja.id, nama: bidangKerja.nama });
  });

  /** Mengirim formulir atas nama orang baru di program daftar uji. */
  async function kirimDiProgramDaftar(isian: {
    namaLengkap: string;
    dikirimPada: Date;
    bidangKerjaId: number | null;
  }) {
    const hasil = await kirimPendaftaran(
      await buatPemilikAkun(),
      {
        ...drafLengkap(),
        namaLengkap: isian.namaLengkap,
        programId: programDaftar.id,
        bidangKerjaId: isian.bidangKerjaId,
        bidangKerjaBelumTahu: isian.bidangKerjaId === null,
      },
      isian.dikirimPada,
    );
    if (hasil.hasil !== "terkirim") {
      throw new Error(
        `Pengiriman contoh seharusnya diterima: ${JSON.stringify(hasil)}`,
      );
    }
    return hasil.nomorPendaftaran;
  }

  it("membaca pendaftaran yang cocok beserta nama program dan bidang kerjanya, dari yang paling baru dikirim (PRD §11.1)", async () => {
    const dikirimLama = new Date("2026-03-08T02:00:00Z");
    const dikirimBaru = new Date("2026-03-10T02:00:00Z");
    const nomorLama = await kirimDiProgramDaftar({
      namaLengkap: "Dewi Lestari",
      dikirimPada: dikirimLama,
      bidangKerjaId: null,
    });
    const nomorBaru = await kirimDiProgramDaftar({
      namaLengkap: "Siti Aminah",
      dikirimPada: dikirimBaru,
      bidangKerjaId: bidangKerjaDaftar.id,
    });
    await db
      .update(pendaftaran)
      .set({ status: "Ditutup" })
      .where(eq(pendaftaran.nomor, nomorLama));

    const halaman = await bacaDaftarPendaftaran(
      { programId: programDaftar.id },
      1,
    );

    expect(halaman.jumlah).toBe(2);
    expect(halaman.baris).toEqual([
      {
        nomor: nomorBaru,
        namaLengkap: "Siti Aminah",
        programId: programDaftar.id,
        program: programDaftar.nama,
        bidangKerjaId: bidangKerjaDaftar.id,
        bidangKerja: bidangKerjaDaftar.nama,
        tahap: 1,
        status: "Berjalan",
        dikirimPada: dikirimBaru,
      },
      {
        nomor: nomorLama,
        namaLengkap: "Dewi Lestari",
        programId: programDaftar.id,
        program: programDaftar.nama,
        bidangKerjaId: null,
        bidangKerja: "Belum tahu",
        tahap: 1,
        status: "Ditutup",
        dikirimPada: dikirimLama,
      },
    ]);
    expect(
      (
        await bacaDaftarPendaftaran(
          { programId: programDaftar.id, status: "Ditutup" },
          1,
        )
      ).baris.map(({ nomor }) => nomor),
    ).toEqual([nomorLama]);
  });
});

describe("ubahIsianPendaftaran oleh pegawai (issue T15, PRD §2.2, §6.5)", () => {
  it("pegawai mengubah kabupaten/kota; perubahannya tersimpan dan terbaca di pendaftaran pemilik akun (UAT-F6)", async () => {
    const akunId = await buatPemilikAkun();
    const nomor = await kirimLalu(akunId);

    expect(
      await ubahIsianPendaftaran(nomor, {
        ...drafLengkap(),
        kabupatenKota: "Kota Semarang",
      }),
    ).toEqual({ hasil: "tersimpan" });

    expect((await bacaPendaftaranBerjalan(akunId))?.isian).toEqual({
      ...drafLengkap(),
      kabupatenKota: "Kota Semarang",
    });
    expect((await bacaPendaftaran(nomor))?.isian.kabupatenKota).toBe(
      "Kota Semarang",
    );
  });

  it("isian wajib yang dikosongkan ditolak dengan isian yang belum diisi, dan isian tersimpan tidak berubah (PRD §6.1)", async () => {
    const nomor = await kirimLalu(await buatPemilikAkun());

    expect(
      await ubahIsianPendaftaran(nomor, {
        ...drafLengkap(),
        kabupatenKota: null,
        namaKontakDarurat: null,
        namaLengkap: "Nama Tidak Tersimpan",
      }),
    ).toEqual({
      hasil: "ditolak",
      belumDiisi: ["kabupatenKota", "namaKontakDarurat"],
    });
    expect((await bacaPendaftaran(nomor))?.isian).toEqual(drafLengkap());
  });

  it("isian tidak wajib yang dikosongkan ikut tersimpan kosong, dan bidang kerja bisa diganti dari Belum tahu", async () => {
    const nomor = await kirimLalu(await buatPemilikAkun());
    await ubahIsianPendaftaran(nomor, {
      ...drafLengkap(),
      jurusanPendidikan: "Tata Boga",
      pengalamanKerja: "Dua tahun di rumah makan",
    });
    const [bidang] = await db
      .insert(bidangKerja)
      .values({ nama: `Bidang Kerja Ubah Uji ${randomUUID()}` })
      .returning({ id: bidangKerja.id, nama: bidangKerja.nama });

    expect(
      await ubahIsianPendaftaran(nomor, {
        ...drafLengkap(),
        bidangKerjaId: bidang.id,
        bidangKerjaBelumTahu: false,
      }),
    ).toEqual({ hasil: "tersimpan" });

    const sesudah = await bacaPendaftaran(nomor);
    expect(sesudah?.bidangKerja).toBe(bidang.nama);
    expect(sesudah?.isian).toEqual({
      ...drafLengkap(),
      bidangKerjaId: bidang.id,
      bidangKerjaBelumTahu: false,
      jurusanPendidikan: null,
      pengalamanKerja: null,
    });
  });

  it("pemilik akun tidak bisa mengubah isian yang sudah dikirim lewat draf atau pengiriman, juga sesudah pendaftarannya ditutup (PRD §6.5)", async () => {
    const akunId = await buatPemilikAkun();
    const nomor = await kirimLalu(akunId);
    const diubah = { ...drafLengkap(), kabupatenKota: "Diubah Pemilik Akun" };

    expect(await simpanDrafFormulirPendaftaran(akunId, diubah)).toEqual({
      hasil: "terkunci",
      nomorPendaftaran: nomor,
    });
    expect(await kirimPendaftaran(akunId, diubah, DIKIRIM_PADA)).toMatchObject({
      hasil: "ditolak",
    });
    expect((await bacaPendaftaran(nomor))?.isian).toEqual(drafLengkap());

    // Sesudah ditutup, pemilik akun boleh mengirim formulir baru (§6.6); itu membuka pendaftaran baru.
    await db
      .update(pendaftaran)
      .set({ status: "Ditutup" })
      .where(eq(pendaftaran.nomor, nomor));
    expect(await simpanDrafFormulirPendaftaran(akunId, diubah)).toEqual({
      hasil: "tersimpan",
    });
    const nomorBaru = await kirimLalu(akunId);
    expect(nomorBaru).not.toBe(nomor);
    expect((await bacaPendaftaran(nomor))?.isian).toEqual(drafLengkap());
  });

  it("nomor pendaftaran yang tidak ada tidak mengubah apa pun", async () => {
    expect(await ubahIsianPendaftaran("FGC-1999-0001", drafLengkap())).toEqual({
      hasil: "tidak-ada",
    });
    expect(await bacaPendaftaran("FGC-1999-0001")).toBeUndefined();
  });
});
