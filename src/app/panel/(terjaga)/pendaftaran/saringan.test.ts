import { describe, expect, it } from "vitest";
import { alamatDaftar, bacaSaringan } from "./saringan";

// Saringan, pencarian, dan halaman daftar pendaftaran dibaca dari alamat halaman (issue T14, PRD §11.1). Alamat bisa
// diubah siapa pun, jadi isinya diperiksa di sini sebelum dipakai.

describe("bacaSaringan", () => {
  it("alamat tanpa saringan menampilkan halaman 1 dari semua pendaftaran", () => {
    expect(bacaSaringan({})).toEqual({ saringan: {}, halaman: 1 });
  });

  it("membaca setiap saringan, pencarian, dan nomor halaman", () => {
    expect(
      bacaSaringan({
        cari: "siti",
        tahap: "1",
        program: "2",
        "bidang-kerja": "3",
        status: "Ditutup",
        halaman: "2",
      }),
    ).toEqual({
      saringan: {
        cari: "siti",
        tahap: 1,
        programId: 2,
        bidangKerja: 3,
        status: "Ditutup",
      },
      halaman: 2,
    });
  });

  it('membaca saringan bidang kerja "Belum tahu"', () => {
    expect(bacaSaringan({ "bidang-kerja": "belum-tahu" }).saringan).toEqual({
      bidangKerja: "Belum tahu",
    });
  });

  it("pencarian dibaca tanpa spasi di awal dan akhir; pencarian yang hanya berisi spasi tidak mencari apa pun", () => {
    expect(bacaSaringan({ cari: "  Siti Aminah " }).saringan).toEqual({
      cari: "Siti Aminah",
    });
    expect(bacaSaringan({ cari: "   " }).saringan).toEqual({});
  });

  it("saringan yang tidak sah tidak menyaring, dan nomor halaman yang tidak sah menjadi halaman 1", () => {
    expect(
      bacaSaringan({
        tahap: "7",
        program: "SSW",
        "bidang-kerja": "0",
        status: "Batal",
        halaman: "-1",
      }),
    ).toEqual({ saringan: {}, halaman: 1 });
  });

  it("parameter yang diulang dibaca nilai pertamanya", () => {
    expect(bacaSaringan({ tahap: ["2", "3"], halaman: ["4", "5"] })).toEqual({
      saringan: { tahap: 2 },
      halaman: 4,
    });
  });
});

describe("alamatDaftar", () => {
  it("halaman 1 tanpa saringan adalah alamat daftar pendaftaran saja", () => {
    expect(alamatDaftar({}, 1)).toBe("/panel/pendaftaran");
  });

  it("alamat halaman lain membawa saringan dan pencariannya, supaya tetap berlaku di halaman itu", () => {
    const alamat = alamatDaftar(
      {
        cari: "Siti Aminah",
        tahap: 1,
        programId: 2,
        bidangKerja: "Belum tahu",
        status: "Ditutup",
      },
      2,
    );

    expect(alamat).toBe(
      "/panel/pendaftaran?cari=Siti+Aminah&tahap=1&program=2&bidang-kerja=belum-tahu&status=Ditutup&halaman=2",
    );
  });
});
