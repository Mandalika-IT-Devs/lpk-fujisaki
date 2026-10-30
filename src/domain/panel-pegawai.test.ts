import { describe, expect, it } from "vitest";
import {
  bolehMembukaMenu,
  bolehMembukaPanelPegawai,
  cariMenuPanelPegawai,
  menuPanelPegawai,
  perluPesanPanelKhususPegawai,
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

// PRD §2.2 (▶ Keputusan 2026-10-30) dan UAT-B2: pemilik akun yang membuka alamat panel pegawai ditolak, lalu halaman
// Masuk pegawai memberitahunya bahwa panel itu khusus pegawai, beserta tautan ke halaman akunnya.
describe("perluPesanPanelKhususPegawai", () => {
  it("pemilik akun yang sedang masuk mendapat pesan itu", () => {
    expect(perluPesanPanelKhususPegawai({ jenis: "pemilik_akun" })).toBe(true);
  });

  it("pengunjung melihat halaman Masuk pegawai tanpa pesan itu", () => {
    expect(perluPesanPanelKhususPegawai(null)).toBe(false);
  });

  it("pegawai, aktif maupun nonaktif, tidak mendapat pesan itu", () => {
    expect(
      perluPesanPanelKhususPegawai({
        jenis: "pegawai",
        peran: "staf",
        aktif: false,
      }),
    ).toBe(false);
    expect(
      perluPesanPanelKhususPegawai({
        jenis: "pegawai",
        peran: "admin",
        aktif: true,
      }),
    ).toBe(false);
  });
});
