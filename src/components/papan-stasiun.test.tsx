// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PapanStasiun } from "./papan-stasiun";

afterEach(cleanup);

// Isi papan diambil dari docs/design/prototipe/beranda.html.
describe("PapanStasiun", () => {
  it("stasiun awal: nama, sub-baris, dan pita menuju stasiun berikutnya", () => {
    const label =
      "Papan stasiun FG 01 Cilacap, stasiun awal: pendaftaran dan seleksi. Berikutnya: belajar bahasa Jepang, FG 02.";
    render(
      <PapanStasiun
        label={label}
        nomor="01"
        nama="Cilacap"
        sub="Stasiun awal · Pendaftaran dan seleksi"
        berikutnya={{ nomor: "02", nama: "Belajar bahasa Jepang" }}
      />,
    );

    const papan = screen.getByRole("img", { name: label });
    expect(papan.textContent).toContain("Cilacap");
    expect(papan.textContent).toContain(
      "Stasiun awal · Pendaftaran dan seleksi",
    );
    expect(papan.textContent).toContain("Awal jalur");
    expect(papan.textContent).toContain("Belajar bahasa Jepang");
    expect(papan.textContent).toContain("FG 02");
  });

  it("stasiun dengan stasiun sebelumnya: pita menunjuk ke belakang", () => {
    const label = "Papan stasiun FG 06 Jepang, tujuan akhir.";
    render(
      <PapanStasiun
        label={label}
        nomor="06"
        nama="Jepang"
        sub="Tujuan akhir"
        sebelumnya={{ nomor: "05", nama: "Magang kerja" }}
      />,
    );

    const papan = screen.getByRole("img", { name: label });
    expect(papan.textContent).toContain("Magang kerja");
    expect(papan.textContent).toContain("FG 05");
    expect(papan.textContent).not.toContain("Awal jalur");
  });
});
