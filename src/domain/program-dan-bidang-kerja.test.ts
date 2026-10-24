import { describe, expect, it } from "vitest";
import {
  periksaRentangUsia,
  tampilDiSitusPublik,
} from "./program-dan-bidang-kerja";

// Ekspektasi dari issue T06 ("usia minimal yang lebih besar dari usia maksimal ditolak"),
// PRD §6.3 (kedua batas termasuk), dan ▶ Keputusan OD-01 (rentang awal 18–30 tahun).
describe("periksaRentangUsia", () => {
  it("rentang 18–30 tahun sah", () => {
    expect(periksaRentangUsia({ usiaMinimal: 18, usiaMaksimal: 30 })).toEqual({
      sah: true,
    });
  });

  it("usia minimal yang sama dengan usia maksimal sah, karena kedua batas termasuk", () => {
    expect(periksaRentangUsia({ usiaMinimal: 30, usiaMaksimal: 30 })).toEqual({
      sah: true,
    });
  });

  it("usia minimal yang lebih besar dari usia maksimal ditolak, beserta kedua angkanya", () => {
    expect(periksaRentangUsia({ usiaMinimal: 31, usiaMaksimal: 30 })).toEqual({
      sah: false,
      alasan: "minimal-melebihi-maksimal",
      usiaMinimal: 31,
      usiaMaksimal: 30,
    });
  });
});

// PRD §4.3: program dan bidang kerja yang nonaktif tidak tampil di situs publik, dan tampil lagi setelah
// diaktifkan kembali. Urutan daftar dipertahankan.
describe("tampilDiSitusPublik", () => {
  const daftar = [
    { nama: "Tokutei Ginou (SSW)", aktif: true },
    { nama: "Pemagangan", aktif: true },
    { nama: "Gijinkoku", aktif: true },
    { nama: "Pelajar", aktif: false },
  ];

  it("hanya menyisakan yang aktif, dalam urutan semula", () => {
    expect(tampilDiSitusPublik(daftar).map((p) => p.nama)).toEqual([
      "Tokutei Ginou (SSW)",
      "Pemagangan",
      "Gijinkoku",
    ]);
  });

  it("yang diaktifkan kembali tampil lagi", () => {
    const sesudah = daftar.map((p) => ({ ...p, aktif: true }));
    expect(tampilDiSitusPublik(sesudah).map((p) => p.nama)).toEqual([
      "Tokutei Ginou (SSW)",
      "Pemagangan",
      "Gijinkoku",
      "Pelajar",
    ]);
  });
});
