// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KonterCekUsia } from "./konter-cek-usia";

afterEach(cleanup);

// Contoh PRD §6.3 untuk program 18–30, dibaca server pada 23-10-2026 pukul 10.00 WIB.
// Teks jawaban dari docs/design/prototipe/beranda.html.
const SEKARANG = new Date("2026-10-23T03:00:00Z");
const PROGRAM = [
  { id: 1, nama: "Tokutei Ginou (SSW)", usiaMinimal: 18, usiaMaksimal: 30 },
  { id: 2, nama: "Pemagangan", usiaMinimal: 18, usiaMaksimal: 30 },
];

function isiTanggalLahir(tanggalLahir: string) {
  fireEvent.change(screen.getByLabelText("Tanggal lahir"), {
    target: { value: tanggalLahir },
  });
}

function jawaban() {
  return screen.getByRole("status").textContent;
}

describe("KonterCekUsia", () => {
  it("sebelum tanggal lahir diisi, mengajak mengisinya", () => {
    render(<KonterCekUsia daftarProgram={PROGRAM} sekarang={SEKARANG} />);

    expect(jawaban()).toBe(
      "Isi tanggal lahirmu untuk melihat apakah usiamu masuk rentang program.",
    );
  });

  it("usia 17: menyebut usia, rentang, dan tanggal mulai boleh mendaftar; usia tepat 18: bisa mendaftar", () => {
    render(<KonterCekUsia daftarProgram={PROGRAM} sekarang={SEKARANG} />);

    isiTanggalLahir("2008-10-24");
    expect(jawaban()).toBe(
      "Usiamu 17 tahun. Tokutei Ginou (SSW) menerima usia 18–30 tahun. Kamu bisa mendaftar mulai 24-10-2026.",
    );

    isiTanggalLahir("2008-10-23");
    expect(jawaban()).toBe(
      "Usiamu 18 tahun. Tokutei Ginou (SSW) menerima usia 18–30 tahun, jadi kamu bisa mendaftar.",
    );
  });

  it("usia di atas batas: menyebut usia dan batasnya", () => {
    render(<KonterCekUsia daftarProgram={PROGRAM} sekarang={SEKARANG} />);

    isiTanggalLahir("1995-10-23");

    expect(jawaban()).toBe(
      "Usiamu 31 tahun, di atas batas 30 tahun untuk Tokutei Ginou (SSW). Tanyakan program lain di loket kami.",
    );
  });

  it("tanggal lahir sesudah hari ini belum benar", () => {
    render(<KonterCekUsia daftarProgram={PROGRAM} sekarang={SEKARANG} />);

    isiTanggalLahir("2026-10-24");

    expect(jawaban()).toBe("Tanggal lahir belum benar. Periksa lagi tahunnya.");
  });

  it("jawaban ikut berubah saat program diganti", () => {
    render(<KonterCekUsia daftarProgram={PROGRAM} sekarang={SEKARANG} />);
    isiTanggalLahir("2008-10-23");

    fireEvent.change(screen.getByLabelText("Program"), {
      target: { value: "2" },
    });

    expect(jawaban()).toBe(
      "Usiamu 18 tahun. Pemagangan menerima usia 18–30 tahun, jadi kamu bisa mendaftar.",
    );
  });

  it("tanpa program aktif: memberi tahu belum ada program yang dibuka, tombol Daftar sekarang tetap ada", () => {
    render(<KonterCekUsia daftarProgram={[]} sekarang={SEKARANG} />);

    expect(jawaban()).toBe(
      "Belum ada program yang dibuka saat ini. Tanyakan program berikutnya ke kantor lembaga di Kesugihan, Cilacap.",
    );
    expect(screen.queryByLabelText("Tanggal lahir")).toBeNull();
    expect(screen.queryByLabelText("Program")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Daftar sekarang" })
        .getAttribute("href"),
    ).toBe("/daftar");
  });
});
