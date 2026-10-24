import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

const tema = readFileSync(
  fileURLToPath(new URL("../app/globals.css", import.meta.url)),
  "utf8",
);
const ukuranHuruf = [...tema.matchAll(/--text-([\w-]+?):/g)]
  .map(([, nama]) => nama)
  .filter((nama) => !nama.includes("--"));

describe("cn", () => {
  it("tema punya ukuran huruf", () => {
    expect(ukuranHuruf).toContain("tombol");
  });

  it.each(ukuranHuruf)(
    "tidak membuang ukuran huruf text-%s saat digabung dengan warna teks",
    (nama) => {
      expect(cn(`text-${nama}`, "text-dasar")).toBe(`text-${nama} text-dasar`);
    },
  );

  it("tetap menggabungkan dua warna teks", () => {
    expect(cn("text-jalur", "text-dasar")).toBe("text-dasar");
  });

  it("tidak membuang bayang papan saat digabung dengan warna bayangan", () => {
    expect(cn("shadow-papan", "shadow-navy")).toBe("shadow-papan shadow-navy");
  });
});
