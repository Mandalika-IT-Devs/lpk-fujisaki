import { describe, expect, it } from "vitest";

// Test contoh dari tiket fondasi: memastikan Vitest menjalankan test di modul domain.
// Berkas ini boleh dihapus setelah ada test aturan bisnis pertama di src/domain/.
describe("modul domain", () => {
  it("menjalankan test unit dengan Vitest", () => {
    expect([1, 2, 3].includes(2)).toBe(true);
  });
});
