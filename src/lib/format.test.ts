import { describe, expect, it } from "vitest";
import { formatTanggalWib } from "./format";

// Tanggal kirim di daftar pendaftaran memakai tanggal WIB (PRD, "Semua tanggal dan jam dalam dokumen ini memakai WIB").
describe("formatTanggalWib", () => {
  it("menulis tanggal WIB sebuah instan sebagai DD-MM-YYYY: 22-10-2026 pukul 17.30 UTC adalah 23-10-2026 WIB (PRD §6.3)", () => {
    expect(formatTanggalWib(new Date("2026-10-22T17:30:00Z"))).toBe(
      "23-10-2026",
    );
  });
});
