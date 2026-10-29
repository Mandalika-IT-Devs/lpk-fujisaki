import { describe, expect, it } from "vitest";
import { pendaftaranBaru, periksaSyaratKirim } from "./pendaftaran";

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
