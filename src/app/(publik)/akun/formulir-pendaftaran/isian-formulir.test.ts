import { describe, expect, it } from "vitest";
import golden from "../../../../../tests/golden/nomor-whatsapp.json";
import {
  ISIAN_KOSONG,
  type IsianFormulirPendaftaran,
  keIsianFormulir,
  periksaDrafFormulirPendaftaran,
} from "./isian-formulir";

// Pemeriksaan bentuk isian saat formulir pendaftaran disimpan sebagai draf (issue T12, PRD §6.1, §6.2).
// Draf boleh belum lengkap, jadi isian kosong sah; isian yang terisi harus berbentuk benar.

/** Program aktif 1 dan 2, bidang kerja aktif 1 dan 3. */
const PILIHAN = { programId: [1, 2], bidangKerjaId: [1, 3] };

const periksa = (isian: Partial<IsianFormulirPendaftaran>) =>
  periksaDrafFormulirPendaftaran({ ...ISIAN_KOSONG, ...isian }, PILIHAN);

const PESAN_NOMOR_HP =
  "Nomor HP kontak darurat belum benar. Isi nomor HP Indonesia 10 sampai 13 digit yang diawali 08 atau +62 8, misalnya 0812-3456-7890. Nomor luar negeri dan nomor telepon rumah tidak diterima.";

describe("periksaDrafFormulirPendaftaran", () => {
  it("formulir yang masih kosong sah sebagai draf", () => {
    expect(periksa({})).toEqual({
      sah: true,
      draf: {
        namaLengkap: null,
        jenisKelamin: null,
        tempatLahir: null,
        tanggalLahir: null,
        kabupatenKota: null,
        provinsi: null,
        pendidikanTerakhir: null,
        jurusanPendidikan: null,
        programId: null,
        bidangKerjaId: null,
        bidangKerjaBelumTahu: false,
        kemampuanBahasaJepang: null,
        pengalamanKerja: null,
        namaKontakDarurat: null,
        hubunganKontakDarurat: null,
        nomorHpKontakDarurat: null,
      },
    });
  });

  it("formulir yang terisi sebagian sah; teks dirapikan dan nomor HP kontak darurat dinormalkan (PRD §5.2)", () => {
    const hasil = periksa({
      namaLengkap: "  Sari Wulandari ",
      jenisKelamin: "Perempuan",
      tanggalLahir: "2004-02-29",
      provinsi: "Jawa Tengah",
      pendidikanTerakhir: "Paket C",
      programId: "2",
      bidangKerja: "3",
      kemampuanBahasaJepang: "Belum pernah belajar",
      hubunganKontakDarurat: "Ibu",
      nomorHpKontakDarurat: "0812-3456-7890",
    });
    expect(hasil).toEqual({
      sah: true,
      draf: expect.objectContaining({
        namaLengkap: "Sari Wulandari",
        jenisKelamin: "Perempuan",
        tempatLahir: null,
        tanggalLahir: "2004-02-29",
        provinsi: "Jawa Tengah",
        pendidikanTerakhir: "Paket C",
        programId: 2,
        bidangKerjaId: 3,
        bidangKerjaBelumTahu: false,
        kemampuanBahasaJepang: "Belum pernah belajar",
        hubunganKontakDarurat: "Ibu",
        nomorHpKontakDarurat: "6281234567890",
      }),
    });
  });

  it('bidang kerja "Belum tahu" sah dan bukan sebuah bidang kerja (PRD §4.2)', () => {
    expect(periksa({ bidangKerja: "belum-tahu" })).toEqual({
      sah: true,
      draf: expect.objectContaining({
        bidangKerjaId: null,
        bidangKerjaBelumTahu: true,
      }),
    });
  });

  describe("nomor HP kontak darurat mengikuti tests/golden/nomor-whatsapp.json", () => {
    for (const kasus of golden.kasus) {
      it(kasus.nama, () => {
        const hasil = periksa({ nomorHpKontakDarurat: kasus.input.nomor });
        if (kasus.output.sah) {
          expect(hasil).toEqual({
            sah: true,
            draf: expect.objectContaining({
              nomorHpKontakDarurat: kasus.output.dinormalkan,
            }),
          });
        } else {
          expect(hasil).toEqual({
            sah: false,
            galat: { nomorHpKontakDarurat: PESAN_NOMOR_HP },
          });
        }
      });
    }
  });

  it("program atau bidang kerja yang tidak aktif ditandai salah di isiannya masing-masing (PRD §4.3)", () => {
    expect(periksa({ programId: "3", bidangKerja: "2" })).toEqual({
      sah: false,
      galat: {
        programId:
          "Program ini tidak bisa dipilih karena sudah tidak dibuka. Muat ulang halaman ini, lalu pilih program dari daftar.",
        bidangKerja:
          "Bidang kerja ini tidak bisa dipilih karena sudah tidak dibuka. Muat ulang halaman ini, lalu pilih bidang kerja dari daftar, atau Belum tahu.",
      },
    });
  });

  it("pilihan di luar daftar PRD §6.1 dan tanggal yang tidak ada di kalender ditandai salah", () => {
    expect(
      periksa({
        jenisKelamin: "Lainnya",
        tanggalLahir: "2007-02-29",
        provinsi: "Jawa Tengah Selatan",
        pendidikanTerakhir: "SD",
        kemampuanBahasaJepang: "N1",
      }),
    ).toEqual({
      sah: false,
      galat: {
        jenisKelamin:
          "Jenis kelamin tidak dikenali. Pilih Laki-laki atau Perempuan.",
        tanggalLahir:
          "Tanggal lahir belum benar. Pilih lagi tanggal lahirmu di pemilih tanggal.",
        provinsi:
          "Provinsi domisili tidak dikenali. Pilih provinsi dari daftar.",
        pendidikanTerakhir:
          "Pendidikan terakhir tidak dikenali. Pilih salah satu dari daftar.",
        kemampuanBahasaJepang:
          "Kemampuan bahasa Jepang tidak dikenali. Pilih salah satu dari daftar.",
      },
    });
  });
});

describe("keIsianFormulir", () => {
  it("draf yang tersimpan dimuat kembali ke isian formulir, sama seperti saat disimpan", () => {
    const isian: IsianFormulirPendaftaran = {
      namaLengkap: "Sari Wulandari",
      jenisKelamin: "Perempuan",
      tempatLahir: "Cilacap",
      tanggalLahir: "2004-02-29",
      kabupatenKota: "Kab. Cilacap",
      provinsi: "Jawa Tengah",
      pendidikanTerakhir: "SMK",
      jurusanPendidikan: "Tata Boga",
      programId: "1",
      bidangKerja: "belum-tahu",
      kemampuanBahasaJepang: "N5",
      pengalamanKerja: "Dua tahun di rumah makan",
      namaKontakDarurat: "Siti Aminah",
      hubunganKontakDarurat: "Ibu",
      nomorHpKontakDarurat: "6281234567890",
    };
    const hasil = periksaDrafFormulirPendaftaran(isian, PILIHAN);
    if (!hasil.sah) throw new Error("Isian contoh seharusnya sah.");
    expect(keIsianFormulir(hasil.draf, PILIHAN)).toEqual(isian);
  });

  it("program dan bidang kerja yang dinonaktifkan sesudah draf disimpan tidak terpilih lagi (PRD §4.3)", () => {
    const hasil = periksa({ programId: "2", bidangKerja: "3" });
    if (!hasil.sah) throw new Error("Isian contoh seharusnya sah.");
    const sesudahDinonaktifkan = { programId: [1], bidangKerjaId: [1] };
    expect(keIsianFormulir(hasil.draf, sesudahDinonaktifkan)).toEqual(
      ISIAN_KOSONG,
    );
  });

  it("akun yang belum pernah menyimpan draf mendapat formulir kosong", () => {
    expect(keIsianFormulir(undefined, PILIHAN)).toEqual(ISIAN_KOSONG);
  });
});
