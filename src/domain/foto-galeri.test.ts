import { describe, expect, it } from "vitest";
import golden from "../../tests/golden/foto-galeri.json";
import { periksaSyaratUnggahFotoGaleri } from "./foto-galeri";

// Ekspektasi dari tests/golden/foto-galeri.json (PRD §3.4).
describe("periksaSyaratUnggahFotoGaleri", () => {
  for (const kasus of golden.kasus) {
    it(kasus.nama, () => {
      expect(periksaSyaratUnggahFotoGaleri(kasus.input)).toEqual(kasus.output);
    });
  }
});
