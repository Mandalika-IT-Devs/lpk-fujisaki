import { describe, expect, it } from "vitest";
import { bolehMasuk, kataSandiCukupPanjang } from "./akun";

// PRD §5.1 dan UAT-E3: kata sandi minimal 8 karakter; 7 karakter ditolak.
describe("kataSandiCukupPanjang", () => {
  it("menolak kata sandi 7 karakter", () => {
    expect(kataSandiCukupPanjang("abcdefg")).toBe(false);
  });

  it("menerima kata sandi 8 karakter", () => {
    expect(kataSandiCukupPanjang("abcdefgh")).toBe(true);
  });
});

// PRD §5.5: pegawai nonaktif tidak bisa masuk.
describe("bolehMasuk", () => {
  it("pegawai aktif boleh masuk, apa pun perannya", () => {
    expect(bolehMasuk({ jenis: "pegawai", peran: "admin", aktif: true })).toBe(
      true,
    );
    expect(bolehMasuk({ jenis: "pegawai", peran: "staf", aktif: true })).toBe(
      true,
    );
  });

  it("pegawai nonaktif tidak boleh masuk", () => {
    expect(bolehMasuk({ jenis: "pegawai", peran: "staf", aktif: false })).toBe(
      false,
    );
    expect(bolehMasuk({ jenis: "pegawai", peran: "admin", aktif: false })).toBe(
      false,
    );
  });

  it("pemilik akun boleh masuk", () => {
    expect(bolehMasuk({ jenis: "pemilik_akun" })).toBe(true);
  });
});
