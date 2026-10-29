import { describe, expect, it } from "vitest";
import {
  bolehMasuk,
  bolehMembuatAkunCalonPeserta,
  bolehMembukaHalamanAkun,
  kataSandiCukupPanjang,
  normalkanEmail,
  type Pegawai,
  periksaPerubahanPegawai,
  tautanAkunDiBarAtas,
} from "./akun";

// PRD §5.1 dan UAT-E3: kata sandi minimal 8 karakter; 7 karakter ditolak.
describe("kataSandiCukupPanjang", () => {
  it("menolak kata sandi 7 karakter", () => {
    expect(kataSandiCukupPanjang("abcdefg")).toBe(false);
  });

  it("menerima kata sandi 8 karakter", () => {
    expect(kataSandiCukupPanjang("abcdefgh")).toBe(true);
  });
});

// PRD §5.5: pegawai nonaktif tidak bisa masuk.
describe("bolehMasuk", () => {
  it("pegawai aktif boleh masuk, apa pun perannya", () => {
    expect(bolehMasuk({ jenis: "pegawai", peran: "admin", aktif: true })).toBe(
      true,
    );
    expect(bolehMasuk({ jenis: "pegawai", peran: "staf", aktif: true })).toBe(
      true,
    );
  });

  it("pegawai nonaktif tidak boleh masuk", () => {
    expect(bolehMasuk({ jenis: "pegawai", peran: "staf", aktif: false })).toBe(
      false,
    );
    expect(bolehMasuk({ jenis: "pegawai", peran: "admin", aktif: false })).toBe(
      false,
    );
  });

  it("pemilik akun boleh masuk", () => {
    expect(bolehMasuk({ jenis: "pemilik_akun" })).toBe(true);
  });
});

// PRD §2.2: hanya pemilik akun yang melihat akunnya sendiri; pegawai tidak punya pendaftaran.
describe("bolehMembukaHalamanAkun", () => {
  it("pemilik akun boleh membuka halaman akun", () => {
    expect(bolehMembukaHalamanAkun({ jenis: "pemilik_akun" })).toBe(true);
  });

  it("pegawai tidak membuka halaman akun, apa pun peran dan statusnya", () => {
    expect(
      bolehMembukaHalamanAkun({
        jenis: "pegawai",
        peran: "admin",
        aktif: true,
      }),
    ).toBe(false);
    expect(
      bolehMembukaHalamanAkun({
        jenis: "pegawai",
        peran: "staf",
        aktif: false,
      }),
    ).toBe(false);
  });
});

// PRD §3.1 (▶ Keputusan 2026-10-30) dan UAT-C8: pengunjung melihat "Masuk" di bar atas situs publik, pemilik akun
// yang sedang masuk melihat "Akun saya". Bar atas bagi pegawai yang sedang masuk tetap seperti sebelumnya (issue T11-b).
describe("tautanAkunDiBarAtas", () => {
  it("pengunjung melihat Masuk", () => {
    expect(tautanAkunDiBarAtas(null)).toBe("masuk");
  });

  it("pemilik akun yang sedang masuk melihat Akun saya", () => {
    expect(tautanAkunDiBarAtas({ jenis: "pemilik_akun" })).toBe("akun-saya");
  });

  it("pegawai yang sedang masuk tetap melihat Masuk", () => {
    expect(
      tautanAkunDiBarAtas({ jenis: "pegawai", peran: "admin", aktif: true }),
    ).toBe("masuk");
    expect(
      tautanAkunDiBarAtas({ jenis: "pegawai", peran: "staf", aktif: true }),
    ).toBe("masuk");
  });
});

// PRD §2.2: membuat akun calon peserta hanya untuk pengunjung, yaitu orang yang belum masuk ke akun mana pun.
describe("bolehMembuatAkunCalonPeserta", () => {
  it("pengunjung boleh membuat akun calon peserta", () => {
    expect(bolehMembuatAkunCalonPeserta(null)).toBe(true);
  });

  it("pemilik akun dan pegawai yang sedang masuk tidak membuat akun calon peserta", () => {
    expect(bolehMembuatAkunCalonPeserta({ jenis: "pemilik_akun" })).toBe(false);
    expect(
      bolehMembuatAkunCalonPeserta({
        jenis: "pegawai",
        peran: "admin",
        aktif: true,
      }),
    ).toBe(false);
  });
});

// PRD §5.1: satu email hanya untuk satu akun, dibandingkan tanpa membedakan huruf besar dan kecil.
describe("normalkanEmail", () => {
  it("email yang hanya berbeda huruf besar dan kecil menjadi sama", () => {
    expect(normalkanEmail("Staf.Baru@Contoh.TEST")).toBe(
      "staf.baru@contoh.test",
    );
    expect(normalkanEmail("STAF@CONTOH.TEST")).toBe("staf@contoh.test");
  });
});

// PRD §5.5 dan UAT-E5: sistem selalu menyisakan minimal satu Admin aktif.
// Admin terakhir tidak bisa dinonaktifkan atau diturunkan menjadi Staf.
describe("periksaPerubahanPegawai", () => {
  const adminA: Pegawai = { id: "admin-a", peran: "admin", aktif: true };
  const adminB: Pegawai = { id: "admin-b", peran: "admin", aktif: true };
  const staf: Pegawai = { id: "staf", peran: "staf", aktif: true };

  it("menolak menonaktifkan Admin aktif terakhir", () => {
    expect(
      periksaPerubahanPegawai([adminA, staf], { ...adminA, aktif: false }),
    ).toEqual({ boleh: false, alasan: "admin-terakhir", adminAktifSesudah: 0 });
  });

  it("menolak menurunkan Admin aktif terakhir menjadi Staf", () => {
    expect(
      periksaPerubahanPegawai([adminA, staf], { ...adminA, peran: "staf" }),
    ).toEqual({ boleh: false, alasan: "admin-terakhir", adminAktifSesudah: 0 });
  });

  it("Admin nonaktif tidak dihitung, jadi Admin aktif satu-satunya tetap Admin terakhir", () => {
    const adminNonaktif: Pegawai = { ...adminB, aktif: false };

    expect(
      periksaPerubahanPegawai([adminA, adminNonaktif], {
        ...adminA,
        aktif: false,
      }),
    ).toEqual({ boleh: false, alasan: "admin-terakhir", adminAktifSesudah: 0 });
  });

  it("membolehkan menonaktifkan atau menurunkan Admin bila masih ada Admin aktif lain", () => {
    expect(
      periksaPerubahanPegawai([adminA, adminB], { ...adminA, aktif: false }),
    ).toEqual({ boleh: true, adminAktifSesudah: 1 });
    expect(
      periksaPerubahanPegawai([adminA, adminB], { ...adminA, peran: "staf" }),
    ).toEqual({ boleh: true, adminAktifSesudah: 1 });
  });

  it("membolehkan menonaktifkan, mengaktifkan kembali, dan mengubah peran Staf", () => {
    expect(
      periksaPerubahanPegawai([adminA, staf], { ...staf, aktif: false }),
    ).toEqual({ boleh: true, adminAktifSesudah: 1 });
    expect(
      periksaPerubahanPegawai([adminA, { ...staf, aktif: false }], staf),
    ).toEqual({ boleh: true, adminAktifSesudah: 1 });
    expect(
      periksaPerubahanPegawai([adminA, staf], { ...staf, peran: "admin" }),
    ).toEqual({ boleh: true, adminAktifSesudah: 2 });
  });
});
