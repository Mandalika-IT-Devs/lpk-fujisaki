// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KodeStasiun, nomorStasiun } from "./kode-stasiun";

afterEach(cleanup);

describe("KodeStasiun", () => {
  it.each(["besar", "tiba", "kecil"] as const)(
    "ukuran %s terbaca sebagai kode stasiun utuh",
    (ukuran) => {
      render(<KodeStasiun nomor="02" ukuran={ukuran} />);

      expect(screen.getByText("FG 02")).toBeTruthy();
    },
  );
});

describe("nomorStasiun", () => {
  // docs/DESIGN.md: enam stasiun FG 01–FG 06 sama dengan tahap 1–6.
  it.each([
    [1, "01"],
    [6, "06"],
  ])("tahap %i menjadi nomor stasiun %s", (tahap, nomor) => {
    expect(nomorStasiun(tahap)).toBe(nomor);
  });
});
