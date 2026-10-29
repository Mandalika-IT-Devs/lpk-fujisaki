import { describe, expect, it } from "vitest";
import golden from "../../tests/golden/batas-usia.json";
import { periksaBatasUsia } from "./batas-usia";

// Ekspektasi dari tests/golden/batas-usia.json (PRD §6.3).
describe("periksaBatasUsia", () => {
  for (const kasus of golden.kasus) {
    it(kasus.nama, () => {
      const { tanggalLahir, dikirimPada, usiaMinimal, usiaMaksimal } =
        kasus.input;

      expect(
        periksaBatasUsia({
          tanggalLahir,
          dikirimPada: new Date(dikirimPada),
          usiaMinimal,
          usiaMaksimal,
        }),
      ).toMatchObject(kasus.output);
    });
  }

  // Contoh PRD §6.3 untuk program 18–30, dikirim 23-10-2026 pukul 10.00 WIB. Usia bertambah tepat pada tanggal
  // ulang tahun, jadi tanggal mulai boleh mendaftar adalah ulang tahun ke-18.
  const PROGRAM_18_30 = { usiaMinimal: 18, usiaMaksimal: 30 };
  const DIKIRIM_PADA = new Date("2026-10-23T03:00:00Z");

  it("terlalu muda: menyebut usia, rentang, dan tanggal mulai boleh mendaftar", () => {
    expect(
      periksaBatasUsia({
        tanggalLahir: "2008-10-24",
        dikirimPada: DIKIRIM_PADA,
        ...PROGRAM_18_30,
      }),
    ).toEqual({
      memenuhi: false,
      alasan: "terlalu-muda",
      tanggalKirimWib: "2026-10-23",
      usia: 17,
      usiaMinimal: 18,
      usiaMaksimal: 30,
      bolehMendaftarMulai: "2026-10-24",
    });
  });

  it("terlalu muda, lahir 29 Februari: boleh mendaftar mulai 1 Maret di tahun bukan kabisat", () => {
    expect(
      periksaBatasUsia({
        tanggalLahir: "2008-02-29",
        dikirimPada: new Date("2026-02-28T03:00:00Z"),
        ...PROGRAM_18_30,
      }),
    ).toMatchObject({
      alasan: "terlalu-muda",
      usia: 17,
      bolehMendaftarMulai: "2026-03-01",
    });
  });

  it("terlalu tua: menyebut usia dan rentang", () => {
    expect(
      periksaBatasUsia({
        tanggalLahir: "1995-10-23",
        dikirimPada: DIKIRIM_PADA,
        ...PROGRAM_18_30,
      }),
    ).toEqual({
      memenuhi: false,
      alasan: "terlalu-tua",
      tanggalKirimWib: "2026-10-23",
      usia: 31,
      usiaMinimal: 18,
      usiaMaksimal: 30,
    });
  });

  // Seperti di docs/design/prototipe/beranda.html: tanggal lahir yang bukan tanggal kalender, atau yang jatuh sesudah
  // tanggal kirim WIB, belum benar.
  for (const tanggalLahir of [
    "2026-10-24",
    "2026-02-30",
    "2008-13-01",
    "24-10-2008",
    "",
  ]) {
    it(`tanggal lahir tidak benar: "${tanggalLahir}"`, () => {
      expect(
        periksaBatasUsia({
          tanggalLahir,
          dikirimPada: DIKIRIM_PADA,
          ...PROGRAM_18_30,
        }),
      ).toEqual({
        memenuhi: false,
        alasan: "tanggal-lahir-tidak-benar",
        tanggalKirimWib: "2026-10-23",
      });
    });
  }

  it("lahir tepat pada tanggal kirim: tanggal benar, usia 0", () => {
    expect(
      periksaBatasUsia({
        tanggalLahir: "2026-10-23",
        dikirimPada: DIKIRIM_PADA,
        ...PROGRAM_18_30,
      }),
    ).toMatchObject({ alasan: "terlalu-muda", usia: 0 });
  });

  it("memenuhi: menyebut usia dan rentang", () => {
    expect(
      periksaBatasUsia({
        tanggalLahir: "2008-10-23",
        dikirimPada: DIKIRIM_PADA,
        ...PROGRAM_18_30,
      }),
    ).toEqual({
      memenuhi: true,
      tanggalKirimWib: "2026-10-23",
      usia: 18,
      usiaMinimal: 18,
      usiaMaksimal: 30,
    });
  });
});
