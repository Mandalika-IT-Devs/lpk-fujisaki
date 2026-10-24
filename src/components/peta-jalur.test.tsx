// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PetaJalur } from "./peta-jalur";

afterEach(cleanup);

// Nama tahap dari PRD §7.1; kalimat stasiun dari docs/design/prototipe/beranda.html.
const NAMA_TAHAP = [
  "Pendaftaran dan seleksi",
  "Belajar bahasa Jepang",
  "Belajar tokutei ginou",
  "Job matching",
  "Magang kerja",
  "Persiapan berangkat",
];

/** Stasiun ke-n (1–6), dibaca dari judulnya. */
function stasiun(n: number) {
  const judul = screen.getAllByRole("heading", { level: 3 })[n - 1];
  const li = judul.closest("li");
  if (!li) throw new Error(`Stasiun ${n} tidak berada di dalam daftar.`);
  return li;
}

describe("PetaJalur", () => {
  it("enam stasiun berurutan dengan kode FG 01–FG 06 dan nama tahap dari PRD §7.1", () => {
    render(<PetaJalur kepala={<h2>Peta</h2>} />);

    const judul = screen.getAllByRole("heading", { level: 3 });
    expect(judul.map((h) => h.textContent)).toEqual(NAMA_TAHAP);
    for (const n of [1, 2, 3, 4, 5, 6])
      expect(stasiun(n).textContent).toContain(`FG 0${n}`);
  });

  it("lencana statis Kamu di sini hanya ada di FG 01", () => {
    render(<PetaJalur kepala={<h2>Peta</h2>} />);

    expect(stasiun(1).textContent).toContain("Kamu di sini");
    for (const n of [2, 3, 4, 5, 6])
      expect(stasiun(n).textContent).not.toContain("Kamu di sini");
  });

  it("deskripsi singkat memuat kalimat penutur asli di FG 02 dan kalimat P3MI di FG 04", () => {
    render(<PetaJalur kepala={<h2>Peta</h2>} />);

    expect(stasiun(2).textContent).toContain(
      "Penutur asli bahasa Jepang rutin datang ke kelas.",
    );
    expect(stasiun(4).textContent).toContain(
      "Lembaga ini melatih sekaligus memberangkatkan (P3MI), jadi kamu tidak berpindah tangan.",
    );
  });

  it("isi tambahan tampil di stasiun tahapnya", () => {
    render(
      <PetaJalur
        kepala={<h2>Peta</h2>}
        isiTambahan={(tahap) => <p>Tambahan tahap {tahap.nomor}</p>}
      />,
    );

    for (const n of [1, 2, 3, 4, 5, 6])
      expect(stasiun(n).textContent).toContain(`Tambahan tahap ${n}`);
  });
});
