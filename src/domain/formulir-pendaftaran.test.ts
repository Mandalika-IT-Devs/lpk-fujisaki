import { describe, expect, it } from "vitest";
import {
  DAFTAR_PROVINSI,
  PILIHAN_JENIS_KELAMIN,
  PILIHAN_KEMAMPUAN_BAHASA_JEPANG,
  PILIHAN_PENDIDIKAN_TERAKHIR,
} from "./formulir-pendaftaran";

// Pilihan isian formulir pendaftaran (PRD §6.1). Ekspektasi ditulis dari tabel PRD §6.1 dan ▶ Keputusan OD-10.
describe("pilihan isian formulir pendaftaran", () => {
  it("pendidikan terakhir persis SMP, SMA, SMK, Paket C, D1, D2, D3, D4, S1, dan S2 (▶ Keputusan OD-10)", () => {
    expect(PILIHAN_PENDIDIKAN_TERAKHIR).toEqual([
      "SMP",
      "SMA",
      "SMK",
      "Paket C",
      "D1",
      "D2",
      "D3",
      "D4",
      "S1",
      "S2",
    ]);
  });

  it("kemampuan bahasa Jepang persis Belum pernah belajar, N5, N4, N3, dan N2", () => {
    expect(PILIHAN_KEMAMPUAN_BAHASA_JEPANG).toEqual([
      "Belum pernah belajar",
      "N5",
      "N4",
      "N3",
      "N2",
    ]);
  });

  it("jenis kelamin persis Laki-laki dan Perempuan", () => {
    expect(PILIHAN_JENIS_KELAMIN).toEqual(["Laki-laki", "Perempuan"]);
  });

  it("provinsi domisili berisi 38 provinsi Indonesia, masing-masing sekali, termasuk enam provinsi di Papua", () => {
    expect(DAFTAR_PROVINSI).toHaveLength(38);
    expect(new Set(DAFTAR_PROVINSI).size).toBe(38);
    expect(DAFTAR_PROVINSI).toEqual(
      expect.arrayContaining([
        "Aceh",
        "Jawa Tengah",
        "Daerah Istimewa Yogyakarta",
        "Kalimantan Utara",
        "Papua",
        "Papua Barat",
        "Papua Barat Daya",
        "Papua Selatan",
        "Papua Tengah",
        "Papua Pegunungan",
      ]),
    );
  });
});
