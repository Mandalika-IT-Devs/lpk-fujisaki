import { describe, expect, it } from "vitest";
import golden from "../../tests/golden/nomor-pendaftaran.json";
import { nomorPendaftaran } from "./nomor-pendaftaran";

// Ekspektasi dari tests/golden/nomor-pendaftaran.json (PRD §6.4).
describe("nomorPendaftaran", () => {
  for (const kasus of golden.kasus) {
    it(kasus.nama, () => {
      const { dikirimPada, urutan } = kasus.input;

      expect(
        nomorPendaftaran({ dikirimPada: new Date(dikirimPada), urutan }),
      ).toMatchObject(kasus.output);
    });
  }
});
