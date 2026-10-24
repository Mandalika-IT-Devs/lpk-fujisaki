import { describe, expect, it } from "vitest";
import { TAHAP } from "./tahap";

// Ekspektasi disalin dari tabel PRD §7.1.
describe("enam tahap dan langkahnya (PRD §7.1)", () => {
  it("enam tahap berurutan dengan nama persis seperti PRD", () => {
    expect(TAHAP.map(({ nomor, nama }) => [nomor, nama])).toEqual([
      [1, "Pendaftaran dan seleksi"],
      [2, "Belajar bahasa Jepang"],
      [3, "Belajar tokutei ginou"],
      [4, "Job matching"],
      [5, "Magang kerja"],
      [6, "Persiapan berangkat"],
    ]);
  });

  it("langkah setiap tahap berurutan dengan kode dan nama persis seperti PRD", () => {
    expect(
      TAHAP.map(({ langkah }) =>
        langkah.map(({ kode, nama }) => `${kode} ${nama}`),
      ),
    ).toEqual([
      [
        "L1.1 Berkas pendaftaran diterima",
        "L1.2 Pemeriksaan fisik",
        "L1.3 Psikotes",
        "L1.4 Tes matematika",
        "L1.5 Pra-MCU",
      ],
      [
        "L2.1 Pembelajaran bahasa Jepang",
        "L2.2 Pengenalan budaya Jepang",
        "L2.3 Pengenalan kebiasaan organisasi Jepang",
        "L2.4 Ujian bahasa Jepang",
      ],
      [
        "L3.1 Pelatihan teori dan praktik",
        "L3.2 Pengenalan budaya kerja Jepang",
        "L3.3 Ujian keterampilan SSW",
      ],
      [
        "L4.1 Wawancara lembaga pendamping",
        "L4.2 Wawancara perusahaan penerima",
        "L4.3 MCU",
        "L4.4 Tanda tangan kontrak kerja",
        "L4.5 Pembuatan paspor",
      ],
      ["L5.1 Magang kerja di perusahaan Indonesia"],
      [
        "L6.1 Review bahasa dan percakapan (1 bulan)",
        "L6.2 COE terbit",
        "L6.3 Visa terbit",
        "L6.4 Berangkat",
      ],
    ]);
  });
});
