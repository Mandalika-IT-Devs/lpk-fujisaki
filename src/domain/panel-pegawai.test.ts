import { describe, expect, it } from "vitest";
import {
  bolehMembukaMenu,
  bolehMembukaPanelPegawai,
  cariMenuPanelPegawai,
  menuPanelPegawai,
} from "./panel-pegawai";

// Menu dari issue T03 dan PRD §2.2: Staf melihat Pendaftaran; Admin juga melihat
// Program, Bidang kerja, Statistik lembaga, Galeri, Kontak, dan Akun pegawai.
const MENU_ADMIN = [
  "Pendaftaran",
  "Program",
  "Bidang kerja",
  "Statistik lembaga",
  "Galeri",
  "Kontak",
  "Akun pegawai",
];

describe("menuPanelPegawai", () => {
  it("Staf hanya melihat menu Pendaftaran", () => {
    expect(menuPanelPegawai("staf").map((menu) => menu.nama)).toEqual([
      "Pendaftaran",
    ]);
  });

  it("Admin melihat semua menu", () => {
    expect(menuPanelPegawai("admin").map((menu) => menu.nama)).toEqual(
      MENU_ADMIN,
    );
  });
});

describe("bolehMembukaMenu", () => {
  it("Staf dan Admin boleh membuka Pendaftaran", () => {
    expect(bolehMembukaMenu("staf", "pendaftaran")).toBe(true);
    expect(bolehMembukaMenu("admin", "pendaftaran")).toBe(true);
  });

  it("Staf tidak boleh membuka menu Admin (UAT-B1)", () => {
    for (const kunci of [
      "program",
      "bidang-kerja",
      "statistik-lembaga",
      "galeri",
      "kontak",
      "akun-pegawai",
    ] as const) {
      expect(bolehMembukaMenu("staf", kunci)).toBe(false);
      expect(bolehMembukaMenu("admin", kunci)).toBe(true);
    }
  });
});

describe("cariMenuPanelPegawai", () => {
  it("menemukan menu menurut kuncinya", () => {
    expect(cariMenuPanelPegawai("bidang-kerja")?.nama).toBe("Bidang kerja");
  });

  it("tidak menemukan kunci yang bukan menu", () => {
    expect(cariMenuPanelPegawai("tidak-ada")).toBeUndefined();
  });
});

describe("bolehMembukaPanelPegawai", () => {
  it("pegawai aktif boleh membuka panel pegawai", () => {
    expect(
      bolehMembukaPanelPegawai({
        jenis: "pegawai",
        peran: "staf",
        aktif: true,
      }),
    ).toBe(true);
  });

  it("pegawai nonaktif tidak boleh membuka panel pegawai", () => {
    expect(
      bolehMembukaPanelPegawai({
        jenis: "pegawai",
        peran: "admin",
        aktif: false,
      }),
    ).toBe(false);
  });

  it("pemilik akun tidak boleh membuka panel pegawai", () => {
    expect(bolehMembukaPanelPegawai({ jenis: "pemilik_akun" })).toBe(false);
  });
});
