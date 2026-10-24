import { describe, expect, it } from "vitest";
import golden from "../../tests/golden/nomor-whatsapp.json";
import { normalkanNomorWhatsApp } from "./nomor-whatsapp";

// Ekspektasi dari tests/golden/nomor-whatsapp.json (PRD §5.2, ▶ Keputusan OD-09).
describe("normalkanNomorWhatsApp", () => {
  for (const kasus of golden.kasus) {
    it(kasus.nama, () => {
      expect(normalkanNomorWhatsApp(kasus.input.nomor)).toEqual(kasus.output);
    });
  }

  // PRD §5.2, contoh terakhir: nomor telepon rumah dengan tanda hubung ditolak karena bukan nomor HP.
  it("nomor telepon rumah dengan tanda hubung", () => {
    expect(normalkanNomorWhatsApp("021-555-1234")).toEqual({
      sah: false,
      dinormalkan: "62215551234",
    });
  });
});
