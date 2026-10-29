import { describe, expect, it } from "vitest";
import { bagiHalaman, saringPendaftaran } from "./daftar-pendaftaran";

// Contoh sintetis untuk daftar pendaftaran di panel pegawai (issue T14, PRD §11.1, UAT-K1). Program 1 adalah
// Tokutei Ginou (SSW) dan program 2 Pemagangan; bidang kerja null berarti "Belum tahu". Ekspektasinya ditulis
// sebagai nomor pendaftaran yang cocok, dari yang paling baru dikirim.
const SITI = {
  nomor: "FGC-2026-0005",
  namaLengkap: "Siti Aminah",
  programId: 1,
  bidangKerjaId: 3,
  tahap: 1,
  status: "Berjalan",
  dikirimPada: new Date("2026-03-10T02:00:00Z"),
} as const;
const DEWI = {
  nomor: "FGC-2026-0004",
  namaLengkap: "Dewi Lestari",
  programId: 1,
  bidangKerjaId: null,
  tahap: 1,
  status: "Ditutup",
  dikirimPada: new Date("2026-03-09T02:00:00Z"),
} as const;
const AGUS = {
  nomor: "FGC-2026-0003",
  namaLengkap: "Agus Setiawan",
  programId: 2,
  bidangKerjaId: 3,
  tahap: 1,
  status: "Ditutup",
  dikirimPada: new Date("2026-03-08T02:00:00Z"),
} as const;
const AHMAD = {
  nomor: "FGC-2026-0002",
  namaLengkap: "Ahmad Fauzi",
  programId: 1,
  bidangKerjaId: 4,
  tahap: 2,
  status: "Berjalan",
  dikirimPada: new Date("2026-03-07T02:00:00Z"),
} as const;
const BUDI = {
  nomor: "FGC-2025-0121",
  namaLengkap: "Budi Santoso",
  programId: 2,
  bidangKerjaId: 4,
  tahap: 6,
  status: "Selesai",
  dikirimPada: new Date("2025-12-31T16:59:59Z"),
} as const;

/** Urutan simpanan sengaja acak, supaya urutan hasil datang dari aturannya. */
const SEMUA = [AHMAD, SITI, BUDI, AGUS, DEWI];

const nomor = (daftar: readonly { nomor: string }[]) =>
  daftar.map((baris) => baris.nomor);

describe("saringPendaftaran", () => {
  it("tanpa saringan menampilkan semua pendaftaran, dari yang paling baru dikirim", () => {
    expect(nomor(saringPendaftaran(SEMUA, {}))).toEqual([
      "FGC-2026-0005",
      "FGC-2026-0004",
      "FGC-2026-0003",
      "FGC-2026-0002",
      "FGC-2025-0121",
    ]);
  });

  it("saringan tahap hanya menampilkan pendaftaran di tahap itu (UAT-K1 langkah 1)", () => {
    expect(nomor(saringPendaftaran(SEMUA, { tahap: 1 }))).toEqual([
      "FGC-2026-0005",
      "FGC-2026-0004",
      "FGC-2026-0003",
    ]);
  });

  it("saringan bisa digabung: tahap 1 lalu status Ditutup (UAT-K1 langkah 1)", () => {
    expect(
      nomor(saringPendaftaran(SEMUA, { tahap: 1, status: "Ditutup" })),
    ).toEqual(["FGC-2026-0004", "FGC-2026-0003"]);
  });

  it("saringan bisa digabung: tahap 1, status Ditutup, lalu program SSW (UAT-K1 langkah 1)", () => {
    expect(
      nomor(
        saringPendaftaran(SEMUA, { tahap: 1, status: "Ditutup", programId: 1 }),
      ),
    ).toEqual(["FGC-2026-0004"]);
  });

  it("saringan program saja menampilkan semua pendaftaran program itu, di tahap dan status mana pun", () => {
    expect(nomor(saringPendaftaran(SEMUA, { programId: 2 }))).toEqual([
      "FGC-2026-0003",
      "FGC-2025-0121",
    ]);
  });

  it("saringan bidang kerja hanya menampilkan pendaftaran yang memilih bidang kerja itu", () => {
    expect(nomor(saringPendaftaran(SEMUA, { bidangKerja: 3 }))).toEqual([
      "FGC-2026-0005",
      "FGC-2026-0003",
    ]);
  });

  it('saringan bidang kerja "Belum tahu" menampilkan pendaftaran yang belum memilih bidang kerja', () => {
    expect(
      nomor(saringPendaftaran(SEMUA, { bidangKerja: "Belum tahu" })),
    ).toEqual(["FGC-2026-0004"]);
  });

  it('pencarian "siti" menemukan "Siti Aminah", tanpa membedakan huruf besar dan kecil (UAT-K1 langkah 2)', () => {
    expect(saringPendaftaran(SEMUA, { cari: "siti" })).toEqual([SITI]);
  });

  it("pencarian menurut nomor pendaftaran hanya menemukan pendaftaran itu (UAT-K1 langkah 2)", () => {
    expect(saringPendaftaran(SEMUA, { cari: "FGC-2026-0003" })).toEqual([AGUS]);
  });

  it("pencarian nomor pendaftaran juga tanpa membedakan huruf besar dan kecil, dan cukup sebagian", () => {
    expect(saringPendaftaran(SEMUA, { cari: "fgc-2025-0121" })).toEqual([BUDI]);
    expect(nomor(saringPendaftaran(SEMUA, { cari: "2026-000" }))).toEqual([
      "FGC-2026-0005",
      "FGC-2026-0004",
      "FGC-2026-0003",
      "FGC-2026-0002",
    ]);
  });

  it("pencarian bisa digabung dengan saringan", () => {
    expect(saringPendaftaran(SEMUA, { cari: "siti", tahap: 2 })).toEqual([]);
    expect(saringPendaftaran(SEMUA, { cari: "a", status: "Selesai" })).toEqual([
      BUDI,
    ]);
  });
});

// 25 baris per halaman adalah keputusan teknis issue T14: PRD §11.1 dan docs/OPEN-DECISIONS.md tidak mengaturnya.
describe("bagiHalaman", () => {
  /** Baris 1 sampai `jumlah`, cukup untuk melihat baris mana yang masuk sebuah halaman. */
  const baris = (jumlah: number) =>
    Array.from({ length: jumlah }, (_, i) => i + 1);

  it("60 pendaftaran terbagi menjadi 3 halaman; halaman 1 berisi pendaftaran ke-1 sampai ke-25", () => {
    expect(bagiHalaman(baris(60), 1)).toEqual({
      baris: baris(25),
      halaman: 1,
      jumlahHalaman: 3,
      jumlah: 60,
      dari: 1,
      sampai: 25,
    });
  });

  it("halaman terakhir berisi sisa pendaftaran: halaman 3 dari 60 berisi ke-51 sampai ke-60", () => {
    expect(bagiHalaman(baris(60), 3)).toMatchObject({
      baris: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
      halaman: 3,
      jumlahHalaman: 3,
      dari: 51,
      sampai: 60,
    });
  });

  it("halaman sesudah halaman terakhir menampilkan halaman terakhir", () => {
    expect(bagiHalaman(baris(26), 9)).toMatchObject({
      baris: [26],
      halaman: 2,
      jumlahHalaman: 2,
      dari: 26,
      sampai: 26,
    });
  });

  it("daftar kosong tetap punya satu halaman tanpa baris", () => {
    expect(bagiHalaman([], 1)).toEqual({
      baris: [],
      halaman: 1,
      jumlahHalaman: 1,
      jumlah: 0,
      dari: 0,
      sampai: 0,
    });
  });
});
