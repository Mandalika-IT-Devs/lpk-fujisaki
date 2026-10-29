import { describe, expect, it } from "vitest";
import {
  bisaDipilihDiFormulirPendaftaran,
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

// PRD §4.3: program dan bidang kerja yang nonaktif tidak bisa dipilih di formulir pendaftaran, dan bisa dipilih lagi
// setelah diaktifkan kembali. Urutan daftar dipertahankan.
describe("bisaDipilihDiFormulirPendaftaran", () => {
  const daftar = [
    { nama: "Pembersihan gedung", aktif: true },
    { nama: "Perawat lansia (kaigo)", aktif: false },
    { nama: "Pengolahan makanan dan minuman", aktif: true },
    { nama: "Restoran", aktif: false },
  ];

  it("hanya menyisakan yang aktif, dalam urutan semula", () => {
    expect(bisaDipilihDiFormulirPendaftaran(daftar).map((b) => b.nama)).toEqual(
      ["Pembersihan gedung", "Pengolahan makanan dan minuman"],
    );
  });

  it("yang diaktifkan kembali bisa dipilih lagi", () => {
    const sesudah = daftar.map((b) => ({ ...b, aktif: true }));
    expect(
      bisaDipilihDiFormulirPendaftaran(sesudah).map((b) => b.nama),
    ).toEqual([
      "Pembersihan gedung",
      "Perawat lansia (kaigo)",
      "Pengolahan makanan dan minuman",
      "Restoran",
    ]);
  });
});
