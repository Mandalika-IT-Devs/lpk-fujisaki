import { describe, expect, it } from "vitest";
import {
  alasanPenutupanDiTahap,
  bisaDitutup,
  periksaPenutupan,
} from "./penutupan";

// Ekspektasi dari PRD §7.5, UAT-G4, dan contoh literal issue T16.
describe("periksaPenutupan (PRD §7.5)", () => {
  it("keterangan kosong ditolak, karena keterangan wajib (UAT-G4 langkah 2)", () => {
    expect(
      periksaPenutupan({
        status: "Berjalan",
        tahap: 1,
        alasan: "Mundur",
        keterangan: "",
      }),
    ).toEqual({ boleh: false, gagal: [{ syarat: "keterangan-diisi" }] });
  });

  it("keterangan yang hanya berisi spasi dan baris baru juga dianggap kosong", () => {
    expect(
      periksaPenutupan({
        status: "Berjalan",
        tahap: 1,
        alasan: "Dikeluarkan",
        keterangan: "  \n ",
      }),
    ).toEqual({ boleh: false, gagal: [{ syarat: "keterangan-diisi" }] });
  });

  it("alasan Mundur dengan keterangan di tahap 1 boleh, dengan keterangan yang dirapikan", () => {
    expect(
      periksaPenutupan({
        status: "Berjalan",
        tahap: 1,
        alasan: "Mundur",
        keterangan: "  Diterima kerja di pabrik dekat rumah.\n",
      }),
    ).toEqual({
      boleh: true,
      alasan: "Mundur",
      keterangan: "Diterima kerja di pabrik dekat rumah.",
    });
  });

  it("pendaftaran yang sudah Ditutup tidak bisa ditutup lagi, apa pun alasan dan keterangannya (PRD §7.5)", () => {
    expect(
      periksaPenutupan({
        status: "Ditutup",
        tahap: 1,
        alasan: "Dikeluarkan",
        keterangan: "Ditutup ulang",
      }),
    ).toEqual({
      boleh: false,
      gagal: [{ syarat: "status-berjalan", status: "Ditutup" }],
    });
  });

  it("pendaftaran yang Selesai tidak bisa ditutup (PRD §7.6)", () => {
    expect(
      periksaPenutupan({
        status: "Selesai",
        tahap: 6,
        alasan: "Mundur",
        keterangan: "Keterangan uji",
      }),
    ).toEqual({
      boleh: false,
      gagal: [{ syarat: "status-berjalan", status: "Selesai" }],
    });
  });

  it("Tidak lolos seleksi di tahap 1 boleh", () => {
    expect(
      periksaPenutupan({
        status: "Berjalan",
        tahap: 1,
        alasan: "Tidak lolos seleksi",
        keterangan: "Psikotes tidak lulus dua kali.",
      }),
    ).toEqual({
      boleh: true,
      alasan: "Tidak lolos seleksi",
      keterangan: "Psikotes tidak lulus dua kali.",
    });
  });

  it("Tidak lolos seleksi di tahap 2 ditolak, karena alasan itu hanya untuk tahap 1 (UAT-G4 langkah 1)", () => {
    expect(
      periksaPenutupan({
        status: "Berjalan",
        tahap: 2,
        alasan: "Tidak lolos seleksi",
        keterangan: "Keterangan uji",
      }),
    ).toEqual({
      boleh: false,
      gagal: [
        {
          syarat: "alasan-sesuai-tahap",
          alasan: "Tidak lolos seleksi",
          tahap: 2,
        },
      ],
    });
  });

  it("alasan belum dipilih ditolak", () => {
    expect(
      periksaPenutupan({
        status: "Berjalan",
        tahap: 1,
        alasan: null,
        keterangan: "Keterangan uji",
      }),
    ).toEqual({ boleh: false, gagal: [{ syarat: "alasan-dipilih" }] });
  });
});

describe("alasanPenutupanDiTahap (PRD §7.5)", () => {
  it("di tahap 1 ketiga alasan bisa dipilih", () => {
    expect(alasanPenutupanDiTahap(1)).toEqual([
      "Tidak lolos seleksi",
      "Mundur",
      "Dikeluarkan",
    ]);
  });

  it("di tahap 2 sampai 6 hanya Mundur dan Dikeluarkan", () => {
    for (const tahap of [2, 3, 4, 5, 6]) {
      expect(alasanPenutupanDiTahap(tahap)).toEqual(["Mundur", "Dikeluarkan"]);
    }
  });
});

describe("bisaDitutup (PRD §7.5, §7.6)", () => {
  it("hanya pendaftaran Berjalan yang bisa ditutup; Ditutup tidak bisa dibuka kembali atau ditutup lagi, Selesai tidak bisa ditutup", () => {
    expect(bisaDitutup("Berjalan")).toBe(true);
    expect(bisaDitutup("Ditutup")).toBe(false);
    expect(bisaDitutup("Selesai")).toBe(false);
  });
});
