import { describe, expect, it } from "vitest";
import {
  bolehMenghapusPermanen,
  konfirmasiPenghapusanCocok,
} from "./penghapusan";

// Ekspektasi dari PRD §2.2, §12.5, UAT-L3, dan contoh literal issue T17.
describe("bolehMenghapusPermanen (PRD §2.2, §12.5)", () => {
  it("Admin boleh menghapus data seseorang secara permanen", () => {
    expect(bolehMenghapusPermanen("admin")).toBe(true);
  });

  it("Staf tidak boleh (UAT-L3 langkah 1)", () => {
    expect(bolehMenghapusPermanen("staf")).toBe(false);
  });
});

describe("konfirmasiPenghapusanCocok (PRD §12.5)", () => {
  const orang = {
    nomorPendaftaran: "FGC-2026-0002",
    email: "sari.wulandari@contoh.test",
  };

  it("email akun orang itu cocok (UAT-L3 langkah 2)", () => {
    expect(
      konfirmasiPenghapusanCocok("sari.wulandari@contoh.test", orang),
    ).toBe(true);
  });

  it("nomor pendaftaran orang itu cocok", () => {
    expect(konfirmasiPenghapusanCocok("FGC-2026-0002", orang)).toBe(true);
  });

  it("email dibandingkan tanpa membedakan huruf besar dan kecil (PRD §5.1), dan spasi di ujung diabaikan", () => {
    expect(
      konfirmasiPenghapusanCocok("  Sari.Wulandari@Contoh.TEST ", orang),
    ).toBe(true);
    expect(konfirmasiPenghapusanCocok(" fgc-2026-0002\n", orang)).toBe(true);
  });

  it("konfirmasi yang salah ketik ditolak", () => {
    expect(konfirmasiPenghapusanCocok("sari.wulandari@contoh.tes", orang)).toBe(
      false,
    );
    expect(
      konfirmasiPenghapusanCocok("sari wulandari@contoh.test", orang),
    ).toBe(false);
    expect(konfirmasiPenghapusanCocok("FGC-2026-002", orang)).toBe(false);
    expect(konfirmasiPenghapusanCocok("FGC-2026-0003", orang)).toBe(false);
  });

  it("konfirmasi kosong atau hanya spasi ditolak", () => {
    expect(konfirmasiPenghapusanCocok("", orang)).toBe(false);
    expect(konfirmasiPenghapusanCocok("   ", orang)).toBe(false);
  });

  it("nama orang itu, atau sebagian email dan nomornya, bukan konfirmasi", () => {
    expect(konfirmasiPenghapusanCocok("Sari Wulandari", orang)).toBe(false);
    expect(konfirmasiPenghapusanCocok("sari.wulandari", orang)).toBe(false);
    expect(konfirmasiPenghapusanCocok("0002", orang)).toBe(false);
  });
});
