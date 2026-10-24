import { describe, expect, it } from "vitest";
import golden from "../../tests/golden/statistik-lembaga.json";
import { hitungTotalSiswa, periksaStatistikLembaga } from "./statistik-lembaga";

// Ekspektasi dari tests/golden/statistik-lembaga.json (PRD §3.3).
describe("periksaStatistikLembaga", () => {
  for (const kasus of golden.kasus) {
    it(kasus.nama, () => {
      expect(periksaStatistikLembaga(kasus.input)).toEqual(kasus.output);
    });
  }
});

// PRD §3.3, contoh pertama: N5 65, N4 124, N3 21, N2 0 → total siswa 210.
describe("hitungTotalSiswa", () => {
  it("menjumlahkan siswa N5, N4, N3, dan N2", () => {
    expect(hitungTotalSiswa({ N5: 65, N4: 124, N3: 21, N2: 0 })).toBe(210);
  });
});
