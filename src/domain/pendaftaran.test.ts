import { describe, expect, it } from "vitest";
import {
  drafDisimpanSaatDitolak,
  isianAwalFormulirPendaftaran,
  pendaftaranBaru,
  periksaIsianWajib,
  periksaSyaratKirim,
  periksaUbahIsian,
  peringatanBatasUsiaUbahIsian,
} from "./pendaftaran";

// Ekspektasi dari PRD §6.5 dan tabel §7.1.
describe("pendaftaranBaru", () => {
  it("berstatus Berjalan di tahap 1, dengan L1.1–L1.5 berstatus Belum", () => {
    const baru = pendaftaranBaru();

    expect(baru.status).toBe("Berjalan");
    expect(baru.tahap).toBe(1);
    expect(baru.langkah.slice(0, 5)).toEqual([
      { kode: "L1.1", status: "Belum" },
      { kode: "L1.2", status: "Belum" },
      { kode: "L1.3", status: "Belum" },
      { kode: "L1.4", status: "Belum" },
      { kode: "L1.5", status: "Belum" },
    ]);
  });

  it("semua langkah keenam tahap berstatus Belum", () => {
    const { langkah } = pendaftaranBaru();

    expect(langkah.map(({ kode }) => kode)).toEqual([
      "L1.1",
      "L1.2",
      "L1.3",
      "L1.4",
      "L1.5",
      "L2.1",
      "L2.2",
      "L2.3",
      "L2.4",
      "L3.1",
      "L3.2",
      "L3.3",
      "L4.1",
      "L4.2",
      "L4.3",
      "L4.4",
      "L4.5",
      "L5.1",
      "L6.1",
      "L6.2",
      "L6.3",
      "L6.4",
    ]);
    expect(new Set(langkah.map(({ status }) => status))).toEqual(
      new Set(["Belum"]),
    );
  });
});

// Formulir contoh yang semua isian wajibnya terisi, seperti hasil pemeriksaan bentuk isian; isian kosong bernilai null.
// Isian "bidangKerja" berisi id bidang kerja, atau "Belum tahu".
const FORMULIR_LENGKAP = {
  namaLengkap: "Sari Wulandari",
  jenisKelamin: "Perempuan",
  tempatLahir: "Cilacap",
  tanggalLahir: "2008-10-23",
  kabupatenKota: "Kab. Cilacap",
  provinsi: "Jawa Tengah",
  pendidikanTerakhir: "SMK",
  jurusanPendidikan: null,
  programId: 1,
  bidangKerja: "Belum tahu",
  kemampuanBahasaJepang: "N5",
  pengalamanKerja: null,
  namaKontakDarurat: "Siti Aminah",
  hubunganKontakDarurat: "Ibu",
  nomorHpKontakDarurat: "6281234567890",
};

// Contoh PRD §6.3 untuk program 18–30, dikirim 23-10-2026 pukul 10.00 WIB.
const SYARAT_TERPENUHI = {
  emailTerverifikasi: true,
  formulir: FORMULIR_LENGKAP,
  rentangUsia: { usiaMinimal: 18, usiaMaksimal: 30 },
  dikirimPada: new Date("2026-10-23T03:00:00Z"),
  nomorPendaftaranBerjalan: null,
};

describe("periksaSyaratKirim (PRD §6.2)", () => {
  it("semua syarat terpenuhi: boleh dikirim, dengan usia dan rentang program sebagai bahan hitung", () => {
    expect(periksaSyaratKirim(SYARAT_TERPENUHI)).toEqual({
      boleh: true,
      formulir: FORMULIR_LENGKAP,
      batasUsia: {
        memenuhi: true,
        tanggalKirimWib: "2026-10-23",
        usia: 18,
        usiaMinimal: 18,
        usiaMaksimal: 30,
      },
    });
  });

  it("email belum terverifikasi: tidak boleh dikirim (UAT-F2)", () => {
    expect(
      periksaSyaratKirim({ ...SYARAT_TERPENUHI, emailTerverifikasi: false }),
    ).toEqual({ boleh: false, gagal: [{ syarat: "email-terverifikasi" }] });
  });

  it("isian wajib yang kosong disebut dalam urutan formulir; jurusan dan pengalaman kerja tidak wajib (PRD §6.1)", () => {
    expect(
      periksaSyaratKirim({
        ...SYARAT_TERPENUHI,
        formulir: {
          ...FORMULIR_LENGKAP,
          nomorHpKontakDarurat: null,
          bidangKerja: null,
          namaLengkap: null,
          jurusanPendidikan: null,
          pengalamanKerja: null,
        },
      }),
    ).toEqual({
      boleh: false,
      gagal: [
        {
          syarat: "isian-wajib-terisi",
          belumDiisi: ["namaLengkap", "bidangKerja", "nomorHpKontakDarurat"],
        },
      ],
    });
  });

  it("usia 17 untuk program 18–30: tidak boleh dikirim, dengan usia dan rentangnya (UAT-F3, PRD §6.3)", () => {
    expect(
      periksaSyaratKirim({
        ...SYARAT_TERPENUHI,
        formulir: { ...FORMULIR_LENGKAP, tanggalLahir: "2008-10-24" },
      }),
    ).toEqual({
      boleh: false,
      gagal: [
        {
          syarat: "batas-usia",
          batasUsia: {
            memenuhi: false,
            alasan: "terlalu-muda",
            tanggalKirimWib: "2026-10-23",
            usia: 17,
            usiaMinimal: 18,
            usiaMaksimal: 30,
            bolehMendaftarMulai: "2026-10-24",
          },
        },
      ],
    });
  });

  it("usia 31 untuk program 18–30: tidak boleh dikirim (PRD §6.3)", () => {
    expect(
      periksaSyaratKirim({
        ...SYARAT_TERPENUHI,
        formulir: { ...FORMULIR_LENGKAP, tanggalLahir: "1995-10-23" },
      }),
    ).toMatchObject({
      boleh: false,
      gagal: [
        {
          syarat: "batas-usia",
          batasUsia: { alasan: "terlalu-tua", usia: 31 },
        },
      ],
    });
  });

  it("masih punya pendaftaran Berjalan: tidak boleh dikirim, dengan nomor pendaftaran itu (UAT-F4, PRD §6.6)", () => {
    expect(
      periksaSyaratKirim({
        ...SYARAT_TERPENUHI,
        nomorPendaftaranBerjalan: "FGC-2026-0037",
      }),
    ).toEqual({
      boleh: false,
      gagal: [
        {
          syarat: "satu-pendaftaran-berjalan",
          nomorPendaftaran: "FGC-2026-0037",
        },
      ],
    });
  });

  it("setiap syarat yang gagal disebut sendiri, dalam urutan PRD §6.2", () => {
    const hasil = periksaSyaratKirim({
      ...SYARAT_TERPENUHI,
      emailTerverifikasi: false,
      formulir: {
        ...FORMULIR_LENGKAP,
        tempatLahir: null,
        tanggalLahir: "1995-10-23",
      },
      nomorPendaftaranBerjalan: "FGC-2026-0037",
    });

    expect(hasil.boleh).toBe(false);
    expect(!hasil.boleh && hasil.gagal.map(({ syarat }) => syarat)).toEqual([
      "email-terverifikasi",
      "isian-wajib-terisi",
      "batas-usia",
      "satu-pendaftaran-berjalan",
    ]);
  });

  it("program sudah dipilih tetapi batas usianya tidak diberikan: pemanggil salah, jadi galat", () => {
    expect(() =>
      periksaSyaratKirim({ ...SYARAT_TERPENUHI, rentangUsia: null }),
    ).toThrow(/rentangUsia/);
  });

  it("batas usia belum diperiksa selama tanggal lahir atau program belum diisi", () => {
    expect(
      periksaSyaratKirim({
        ...SYARAT_TERPENUHI,
        formulir: { ...FORMULIR_LENGKAP, programId: null },
        rentangUsia: null,
      }),
    ).toEqual({
      boleh: false,
      gagal: [{ syarat: "isian-wajib-terisi", belumDiisi: ["programId"] }],
    });
    expect(
      periksaSyaratKirim({
        ...SYARAT_TERPENUHI,
        formulir: { ...FORMULIR_LENGKAP, tanggalLahir: null },
      }),
    ).toEqual({
      boleh: false,
      gagal: [{ syarat: "isian-wajib-terisi", belumDiisi: ["tanggalLahir"] }],
    });
  });
});

// Pengiriman yang ditolak menyimpan isiannya sebagai draf (issue T13-b, PRD §6.2 ▶ Keputusan 2026-10-30), kecuali
// selama isiannya terkunci karena akun itu punya pendaftaran Berjalan (§6.5).
describe("drafDisimpanSaatDitolak", () => {
  /** Syarat kirim yang gagal untuk keadaan contoh yang pasti ditolak. */
  function gagalSaatDikirim(keadaan: Parameters<typeof periksaSyaratKirim>[0]) {
    const hasil = periksaSyaratKirim(keadaan);
    if (hasil.boleh) throw new Error("Keadaan contoh seharusnya ditolak.");
    return hasil.gagal;
  }

  it("ditolak karena email belum terverifikasi: isiannya disimpan sebagai draf (UAT-F7)", () => {
    expect(
      drafDisimpanSaatDitolak(
        gagalSaatDikirim({ ...SYARAT_TERPENUHI, emailTerverifikasi: false }),
      ),
    ).toBe(true);
  });

  it("ditolak karena usia di luar rentang: isiannya disimpan sebagai draf", () => {
    expect(
      drafDisimpanSaatDitolak(
        gagalSaatDikirim({
          ...SYARAT_TERPENUHI,
          formulir: { ...FORMULIR_LENGKAP, tanggalLahir: "2008-10-24" },
        }),
      ),
    ).toBe(true);
    expect(
      drafDisimpanSaatDitolak(
        gagalSaatDikirim({
          ...SYARAT_TERPENUHI,
          formulir: { ...FORMULIR_LENGKAP, tanggalLahir: "1995-10-23" },
        }),
      ),
    ).toBe(true);
  });

  it("ditolak karena isian wajib belum diisi: isian yang sudah terisi disimpan sebagai draf", () => {
    expect(
      drafDisimpanSaatDitolak(
        gagalSaatDikirim({
          ...SYARAT_TERPENUHI,
          formulir: { ...FORMULIR_LENGKAP, tempatLahir: null },
        }),
      ),
    ).toBe(true);
  });

  it("masih punya pendaftaran Berjalan: tidak ada draf yang disimpan, juga bila syarat lain ikut gagal (PRD §6.5)", () => {
    expect(
      drafDisimpanSaatDitolak(
        gagalSaatDikirim({
          ...SYARAT_TERPENUHI,
          nomorPendaftaranBerjalan: "FGC-2026-0037",
        }),
      ),
    ).toBe(false);
    expect(
      drafDisimpanSaatDitolak(
        gagalSaatDikirim({
          ...SYARAT_TERPENUHI,
          emailTerverifikasi: false,
          formulir: { ...FORMULIR_LENGKAP, tanggalLahir: "2008-10-24" },
          nomorPendaftaranBerjalan: "FGC-2026-0037",
        }),
      ),
    ).toBe(false);
  });
});

// Pegawai mengubah isian formulir pendaftaran yang sudah dikirim (issue T15, PRD §2.2, §6.5): isian wajib PRD §6.1
// tetap harus terisi, sama seperti saat formulir dikirim.
describe("periksaIsianWajib", () => {
  it("semua isian wajib terisi: lengkap, dan isian yang tidak wajib boleh kosong", () => {
    expect(periksaIsianWajib(FORMULIR_LENGKAP)).toEqual({
      lengkap: true,
      formulir: FORMULIR_LENGKAP,
    });
  });

  it("isian wajib yang dikosongkan disebut dalam urutan formulir (PRD §6.1)", () => {
    expect(
      periksaIsianWajib({
        ...FORMULIR_LENGKAP,
        nomorHpKontakDarurat: null,
        kabupatenKota: null,
        programId: null,
        pengalamanKerja: null,
      }),
    ).toEqual({
      lengkap: false,
      belumDiisi: ["kabupatenKota", "programId", "nomorHpKontakDarurat"],
    });
  });
});

// Pegawai mengubah isian formulir pendaftaran yang sudah dikirim (issue T15) dengan pemeriksaan yang sama seperti
// formulir pemilik akun: isian wajib terisi (PRD §6.1), dan tanggal lahir tidak jatuh sesudah hari ini (WIB, §6.3).
// Usia di luar rentang batas usia program tidak menolak perubahan (§11.2). Hari ini pada contoh: 22-10-2026 pukul
// 17.30 UTC, yaitu 23-10-2026 pukul 00.30 WIB (contoh terakhir PRD §6.3). Pendaftaran pada contoh ini dikirim saat itu
// juga, jadi tanggal kirimnya sama dengan hari ini.
describe("periksaUbahIsian", () => {
  const SEKARANG = new Date("2026-10-22T17:30:00Z");
  const DIKIRIM_HARI_INI = { sekarang: SEKARANG, dikirimPada: SEKARANG };

  it("isian lengkap dengan tanggal lahir sebelum hari ini: sah", () => {
    expect(periksaUbahIsian(FORMULIR_LENGKAP, DIKIRIM_HARI_INI)).toEqual({
      sah: true,
      formulir: FORMULIR_LENGKAP,
    });
  });

  it("lahir tepat hari ini (WIB): tanggal lahir benar, dan usia di luar rentang program tidak menolak perubahan", () => {
    expect(
      periksaUbahIsian(
        { ...FORMULIR_LENGKAP, tanggalLahir: "2026-10-23" },
        DIKIRIM_HARI_INI,
      ),
    ).toMatchObject({ sah: true });
  });

  it("tanggal lahir sesudah hari ini (WIB): tidak sah, juga bila hari itu baru dimulai di WIB", () => {
    for (const tanggalLahir of ["2026-10-24", "2099-12-31"]) {
      expect(
        periksaUbahIsian(
          { ...FORMULIR_LENGKAP, tanggalLahir },
          DIKIRIM_HARI_INI,
        ),
      ).toEqual({
        sah: false,
        belumDiisi: [],
        tanggalLahirDitolak: { alasan: "sesudah-hari-ini" },
      });
    }
  });

  it("isian wajib yang kosong dan tanggal lahir yang tidak benar disebut bersama", () => {
    expect(
      periksaUbahIsian(
        {
          ...FORMULIR_LENGKAP,
          kabupatenKota: null,
          tanggalLahir: "2099-12-31",
        },
        DIKIRIM_HARI_INI,
      ),
    ).toEqual({
      sah: false,
      belumDiisi: ["kabupatenKota"],
      tanggalLahirDitolak: { alasan: "sesudah-hari-ini" },
    });
  });

  it("tanggal lahir yang kosong hanya disebut sebagai isian wajib yang belum diisi", () => {
    expect(
      periksaUbahIsian(
        { ...FORMULIR_LENGKAP, tanggalLahir: null },
        DIKIRIM_HARI_INI,
      ),
    ).toEqual({
      sah: false,
      belumDiisi: ["tanggalLahir"],
      tanggalLahirDitolak: null,
    });
  });
});

// Tanggal lahir yang jatuh sesudah tanggal kirim pendaftaran ditolak saat pegawai mengubah isian, karena orang itu belum
// lahir saat pendaftarannya dikirim (issue T15-c, PRD §11.2 ▶ Keputusan 2026-10-30, UAT-K7). Pada contoh, pendaftaran
// dikirim 20-05-2024 pukul 10.00 WIB (contoh PRD §11.2), dan pegawai mengubahnya pada 23-10-2026 WIB.
describe("periksaUbahIsian: tanggal lahir sesudah tanggal kirim (issue T15-c)", () => {
  const WAKTU = {
    sekarang: new Date("2026-10-22T17:30:00Z"),
    dikirimPada: new Date("2024-05-20T03:00:00Z"),
  };

  it("tanggal lahir sehari sesudah tanggal kirim: tidak sah, beserta tanggal kirim WIB-nya (UAT-K7)", () => {
    expect(
      periksaUbahIsian(
        { ...FORMULIR_LENGKAP, tanggalLahir: "2024-05-21" },
        WAKTU,
      ),
    ).toEqual({
      sah: false,
      belumDiisi: [],
      tanggalLahirDitolak: {
        alasan: "sesudah-tanggal-kirim",
        tanggalKirimWib: "2024-05-20",
      },
    });
  });

  it("tanggal lahir tepat pada tanggal kirim: tidak ditolak karena aturan ini", () => {
    expect(
      periksaUbahIsian(
        { ...FORMULIR_LENGKAP, tanggalLahir: "2024-05-20" },
        WAKTU,
      ),
    ).toMatchObject({ sah: true });
  });

  it("tanggal kirim dihitung dalam WIB: dikirim 19-05-2024 pukul 17.30 UTC, yaitu 20-05-2024 pukul 00.30 WIB", () => {
    const dikirimTengahMalam = {
      ...WAKTU,
      dikirimPada: new Date("2024-05-19T17:30:00Z"),
    };

    expect(
      periksaUbahIsian(
        { ...FORMULIR_LENGKAP, tanggalLahir: "2024-05-20" },
        dikirimTengahMalam,
      ),
    ).toMatchObject({ sah: true });
    expect(
      periksaUbahIsian(
        { ...FORMULIR_LENGKAP, tanggalLahir: "2024-05-21" },
        dikirimTengahMalam,
      ),
    ).toEqual({
      sah: false,
      belumDiisi: [],
      tanggalLahirDitolak: {
        alasan: "sesudah-tanggal-kirim",
        tanggalKirimWib: "2024-05-20",
      },
    });
  });

  it("tanggal lahir sesudah hari ini tetap ditolak sebagai sesudah hari ini", () => {
    expect(
      periksaUbahIsian(
        { ...FORMULIR_LENGKAP, tanggalLahir: "2026-10-24" },
        WAKTU,
      ),
    ).toEqual({
      sah: false,
      belumDiisi: [],
      tanggalLahirDitolak: { alasan: "sesudah-hari-ini" },
    });
  });

  it("isian wajib yang kosong dan tanggal lahir sesudah tanggal kirim disebut bersama", () => {
    expect(
      periksaUbahIsian(
        { ...FORMULIR_LENGKAP, provinsi: null, tanggalLahir: "2025-01-01" },
        WAKTU,
      ),
    ).toEqual({
      sah: false,
      belumDiisi: ["provinsi"],
      tanggalLahirDitolak: {
        alasan: "sesudah-tanggal-kirim",
        tanggalKirimWib: "2024-05-20",
      },
    });
  });
});

// Peringatan batas usia saat pegawai mengubah isian (issue T15-b, PRD §11.2 ▶ Keputusan 2026-10-30, UAT-K6). Ekspektasi
// dari contoh PRD §6.3 untuk program 18–30, dikirim 23-10-2026 pukul 10.00 WIB.
describe("peringatanBatasUsiaUbahIsian", () => {
  const DIKIRIM_PADA = new Date("2026-10-23T03:00:00Z");
  const PROGRAM_18_30 = { usiaMinimal: 18, usiaMaksimal: 30 };
  /** Tanggal lahir dan program yang tersimpan: usia 22 pada tanggal kirim, di dalam rentang. */
  const TERSIMPAN = { tanggalLahir: "2004-02-29", programId: 1 };

  it("tanggal lahir diubah sehingga usia pada tanggal kirim 17: peringatan menyebut usia 17 dan rentang 18–30 (UAT-K6)", () => {
    expect(
      peringatanBatasUsiaUbahIsian({
        tersimpan: TERSIMPAN,
        diubah: { ...TERSIMPAN, tanggalLahir: "2008-10-24" },
        rentangUsia: PROGRAM_18_30,
        dikirimPada: DIKIRIM_PADA,
      }),
    ).toMatchObject({
      alasan: "terlalu-muda",
      tanggalKirimWib: "2026-10-23",
      usia: 17,
      usiaMinimal: 18,
      usiaMaksimal: 30,
    });
  });

  it("tanggal lahir diubah sehingga usia pada tanggal kirim 31: peringatan menyebut usia 31 dan rentang 18–30", () => {
    expect(
      peringatanBatasUsiaUbahIsian({
        tersimpan: TERSIMPAN,
        diubah: { ...TERSIMPAN, tanggalLahir: "1995-10-23" },
        rentangUsia: PROGRAM_18_30,
        dikirimPada: DIKIRIM_PADA,
      }),
    ).toEqual({
      memenuhi: false,
      alasan: "terlalu-tua",
      tanggalKirimWib: "2026-10-23",
      usia: 31,
      usiaMinimal: 18,
      usiaMaksimal: 30,
    });
  });

  it("tanggal lahir diubah tetapi usia pada tanggal kirim tetap dalam rentang: tanpa peringatan, kedua batas termasuk", () => {
    for (const tanggalLahir of ["2008-10-23", "1995-10-24"]) {
      expect(
        peringatanBatasUsiaUbahIsian({
          tersimpan: TERSIMPAN,
          diubah: { ...TERSIMPAN, tanggalLahir },
          rentangUsia: PROGRAM_18_30,
          dikirimPada: DIKIRIM_PADA,
        }),
      ).toBeNull();
    }
  });

  it("usia dihitung pada tanggal kirim WIB, bukan tanggal UTC: dikirim 22-10-2026 pukul 17.30 UTC, lahir 23-10-2008, usia 18", () => {
    expect(
      peringatanBatasUsiaUbahIsian({
        tersimpan: TERSIMPAN,
        diubah: { ...TERSIMPAN, tanggalLahir: "2008-10-23" },
        rentangUsia: PROGRAM_18_30,
        dikirimPada: new Date("2026-10-22T17:30:00Z"),
      }),
    ).toBeNull();
  });

  it("program diubah ke program yang rentangnya tidak mencakup usia pada tanggal kirim: peringatan dengan rentang program baru", () => {
    expect(
      peringatanBatasUsiaUbahIsian({
        tersimpan: TERSIMPAN,
        diubah: { ...TERSIMPAN, programId: 2 },
        rentangUsia: { usiaMinimal: 18, usiaMaksimal: 21 },
        dikirimPada: DIKIRIM_PADA,
      }),
    ).toEqual({
      memenuhi: false,
      alasan: "terlalu-tua",
      tanggalKirimWib: "2026-10-23",
      usia: 22,
      usiaMinimal: 18,
      usiaMaksimal: 21,
    });
  });

  it("program diubah ke program yang rentangnya mencakup usia pada tanggal kirim: tanpa peringatan", () => {
    expect(
      peringatanBatasUsiaUbahIsian({
        tersimpan: TERSIMPAN,
        diubah: { ...TERSIMPAN, programId: 2 },
        rentangUsia: { usiaMinimal: 18, usiaMaksimal: 22 },
        dikirimPada: DIKIRIM_PADA,
      }),
    ).toBeNull();
  });

  it("tanggal lahir sesudah tanggal kirim tidak diberi peringatan, karena perubahan itu sudah ditolak periksaUbahIsian (issue T15-c)", () => {
    expect(() =>
      peringatanBatasUsiaUbahIsian({
        tersimpan: TERSIMPAN,
        diubah: { ...TERSIMPAN, tanggalLahir: "2026-10-24" },
        rentangUsia: PROGRAM_18_30,
        dikirimPada: DIKIRIM_PADA,
      }),
    ).toThrow(/periksaUbahIsian/);
  });

  it("tanggal lahir dan program tidak berubah: tanpa peringatan, juga bila usia yang tersimpan di luar rentang", () => {
    const diLuarRentang = { tanggalLahir: "2008-10-24", programId: 1 };

    expect(
      peringatanBatasUsiaUbahIsian({
        tersimpan: diLuarRentang,
        diubah: { ...diLuarRentang },
        rentangUsia: PROGRAM_18_30,
        dikirimPada: DIKIRIM_PADA,
      }),
    ).toBeNull();
  });
});

// Ekspektasi dari PRD §6.6: isian lama boleh dipakai sebagai isian awal pendaftaran ulang.
describe("isianAwalFormulirPendaftaran (PRD §6.6)", () => {
  const ISIAN_DITUTUP_LAMA = { namaLengkap: "Isian Ditutup 2025" };
  const ISIAN_DITUTUP_BARU = { namaLengkap: "Isian Ditutup 2026" };
  const DITUTUP = [
    {
      status: "Ditutup" as const,
      dikirimPada: new Date("2025-03-10T03:00:00Z"),
      isian: ISIAN_DITUTUP_LAMA,
    },
    {
      status: "Ditutup" as const,
      dikirimPada: new Date("2026-02-01T03:00:00Z"),
      isian: ISIAN_DITUTUP_BARU,
    },
  ];

  it("tanpa draf dan tanpa pendaftaran: tidak ada isian awal", () => {
    expect(
      isianAwalFormulirPendaftaran({ draf: undefined, pendaftaran: [] }),
    ).toBeUndefined();
  });

  it("tanpa draf: isian pendaftaran Ditutup yang paling baru dikirim", () => {
    expect(
      isianAwalFormulirPendaftaran({ draf: undefined, pendaftaran: DITUTUP }),
    ).toEqual(ISIAN_DITUTUP_BARU);
    expect(
      isianAwalFormulirPendaftaran({
        draf: undefined,
        pendaftaran: DITUTUP.toReversed(),
      }),
    ).toEqual(ISIAN_DITUTUP_BARU);
  });

  it("draf yang sudah disimpan sesudah penutupan lebih dulu dipakai daripada isian lama", () => {
    const draf = { namaLengkap: "Isian Draf" };
    expect(
      isianAwalFormulirPendaftaran({ draf, pendaftaran: DITUTUP }),
    ).toEqual(draf);
  });

  it("hanya isian pendaftaran Ditutup yang dipakai, bukan yang Berjalan atau Selesai", () => {
    expect(
      isianAwalFormulirPendaftaran({
        draf: undefined,
        pendaftaran: [
          DITUTUP[0],
          {
            status: "Selesai",
            dikirimPada: new Date("2026-05-01T03:00:00Z"),
            isian: { namaLengkap: "Isian Selesai" },
          },
          {
            status: "Berjalan",
            dikirimPada: new Date("2026-06-01T03:00:00Z"),
            isian: { namaLengkap: "Isian Berjalan" },
          },
        ],
      }),
    ).toEqual(ISIAN_DITUTUP_LAMA);
  });
});
