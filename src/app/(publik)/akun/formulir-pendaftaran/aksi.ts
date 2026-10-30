"use server";

import { redirect } from "next/navigation";
import { ALAMAT_KONFIRMASI_PENDAFTARAN } from "@/components/tautan-situs";
import type { SyaratKirimGagal } from "@/domain/pendaftaran";
import { formatTanggal } from "@/lib/format";
import {
  bacaPilihanFormulirPendaftaran,
  simpanDrafFormulirPendaftaran,
} from "@/server/formulir-pendaftaran";
import { kirimPendaftaran } from "@/server/pendaftaran";
import { bacaSekarang } from "@/server/waktu";
import type { Pesan } from "@/app/panel/(terjaga)/pesan-tindakan";
import { pastikanPemilikAkun } from "../../penjaga-akun";
import {
  bacaIsianFormulir,
  type GalatIsian,
  galatIsianDitolak,
  type IsianFormulirPendaftaran,
  keIdPilihan,
  keIsianFormulir,
  LABEL_ISIAN,
  labelIsianSalah,
  periksaDrafFormulirPendaftaran,
} from "./isian-formulir";

export type KeadaanFormulirPendaftaran = {
  /** Hasil tindakan terakhir; pengiriman yang ditolak membawa satu pesan untuk setiap syarat yang gagal (§6.2). */
  pesan: Pesan[];
  isian: IsianFormulirPendaftaran;
  galat: GalatIsian;
};

const KABAR_DRAF_TERSIMPAN =
  "Draf tersimpan. Kamu bisa melanjutkannya kapan saja dari halaman akunmu.";

/** Kabar sesudah pengiriman yang ditolak menyimpan isiannya sebagai draf (PRD §6.2 ▶ Keputusan 2026-10-30). */
const KABAR_DRAF_OTOMATIS =
  "Isianmu tetap tersimpan sebagai draf, jadi kamu bisa melanjutkannya kapan saja dari halaman akunmu.";

const PESAN_GANGGUAN_DRAF =
  "Draf belum tersimpan karena gangguan di server. Coba simpan lagi beberapa saat lagi; bila tetap gagal, hubungi lembaga lewat halaman Kontak.";

const PESAN_GANGGUAN_KIRIM =
  "Formulir belum terkirim karena gangguan di server. Coba kirim lagi beberapa saat lagi; bila tetap gagal, hubungi lembaga lewat halaman Kontak.";

const peringatan = (teks: string): Pesan => ({ jenis: "peringatan", teks });

/** Isian formulir sudah terkunci karena formulirnya sudah dikirim (PRD §6.5). */
function pesanTerkunci(nomorPendaftaran: string, tindakan: string): string {
  return `${tindakan} karena formulir pendaftaranmu sudah dikirim dengan nomor ${nomorPendaftaran}, jadi isiannya terkunci. Bila ada isian yang perlu diubah, hubungi lembaga lewat halaman Kontak.`;
}

/**
 * Pemilik akun menyimpan formulir pendaftarannya sebagai draf (PRD §6.2): kapan saja, juga bila belum lengkap.
 * Bentuk setiap isian yang terisi diperiksa lebih dulu; bila ada yang salah, draf belum disimpan dan setiap isian
 * yang salah ditandai. Program dan bidang kerja hanya boleh yang aktif saat disimpan (§4.3). Sesudah formulir
 * dikirim, draf tidak disimpan lagi (§6.5).
 */
export async function simpanDraf(
  _keadaan: KeadaanFormulirPendaftaran,
  formulir: FormData,
): Promise<KeadaanFormulirPendaftaran> {
  const pemilikAkun = await pastikanPemilikAkun();
  const isian = bacaIsianFormulir(formulir);

  try {
    const pilihan = keIdPilihan(await bacaPilihanFormulirPendaftaran());
    const hasil = periksaDrafFormulirPendaftaran(isian, pilihan);
    if (!hasil.sah) {
      return {
        pesan: [
          peringatan(
            `Draf belum tersimpan karena isian berikut belum benar: ${labelIsianSalah(hasil.galat)}. Perbaiki isian yang ditandai, atau kosongkan, lalu simpan lagi.`,
          ),
        ],
        isian,
        galat: hasil.galat,
      };
    }
    const simpan = await simpanDrafFormulirPendaftaran(
      pemilikAkun.id,
      hasil.draf,
    );
    if (simpan.hasil === "terkunci") {
      return {
        pesan: [
          peringatan(
            pesanTerkunci(simpan.nomorPendaftaran, "Draf tidak disimpan"),
          ),
        ],
        isian,
        galat: {},
      };
    }
    // Isian tampil seperti yang tersimpan, sama seperti saat formulir dibuka lagi; misalnya nomor HP dalam bentuk
    // ternormalisasi (§5.2).
    return {
      pesan: [{ jenis: "kabar", teks: KABAR_DRAF_TERSIMPAN }],
      isian: keIsianFormulir(hasil.draf, pilihan),
      galat: {},
    };
  } catch (galat) {
    console.error(galat);
    return { pesan: [peringatan(PESAN_GANGGUAN_DRAF)], isian, galat: {} };
  }
}

/** Pesan untuk satu syarat kirim yang gagal, dengan sebabnya dan langkah berikutnya (PRD §6.2, §6.3, §6.6). */
function pesanSyaratGagal(
  gagal: SyaratKirimGagal,
  konteks: { email: string; namaProgram: string },
): string {
  switch (gagal.syarat) {
    case "email-terverifikasi":
      return `Formulir belum terkirim karena emailmu belum terverifikasi. Buka tautan verifikasi yang kami kirim ke ${konteks.email}, atau minta tautan baru di halaman akunmu, lalu kirim lagi.`;
    case "isian-wajib-terisi":
      return `Formulir belum terkirim karena isian wajib berikut belum diisi: ${gagal.belumDiisi.map((nama) => LABEL_ISIAN[nama]).join(", ")}. Isi isian yang ditandai, lalu kirim lagi.`;
    case "batas-usia": {
      const hasil = gagal.batasUsia;
      if (hasil.alasan === "tanggal-lahir-tidak-benar") {
        return "Formulir belum terkirim karena tanggal lahir jatuh sesudah hari ini. Periksa lagi tanggal lahirmu, lalu kirim lagi.";
      }
      const sebab = `Formulir belum terkirim karena usiamu ${hasil.usia} tahun pada ${formatTanggal(hasil.tanggalKirimWib)}, sedangkan ${konteks.namaProgram} menerima usia ${hasil.usiaMinimal}–${hasil.usiaMaksimal} tahun.`;
      if (hasil.alasan === "terlalu-muda") {
        return `${sebab} Kamu bisa mengirim formulir untuk program ini mulai ${formatTanggal(hasil.bolehMendaftarMulai)}, atau pilih program lain.`;
      }
      return `${sebab} Pilih program lain, atau tanyakan program yang sesuai lewat halaman Kontak.`;
    }
    case "satu-pendaftaran-berjalan":
      return `Formulir belum terkirim karena kamu masih punya pendaftaran yang sedang berjalan, ${gagal.nomorPendaftaran}. Satu akun hanya boleh punya satu pendaftaran yang sedang berjalan; lihat pendaftaranmu di halaman akun.`;
  }
}

/** Tanda pada isian yang menyebabkan syarat kirim gagal. */
function galatSyaratGagal(daftarGagal: SyaratKirimGagal[]): GalatIsian {
  return galatIsianDitolak({
    belumDiisi: daftarGagal.flatMap((gagal) =>
      gagal.syarat === "isian-wajib-terisi" ? gagal.belumDiisi : [],
    ),
    tanggalLahirTidakBenar: daftarGagal.some(
      (gagal) =>
        gagal.syarat === "batas-usia" &&
        gagal.batasUsia.alasan === "tanggal-lahir-tidak-benar",
    ),
  });
}

/**
 * Pemilik akun mengirim formulir pendaftarannya (PRD §6.2). Bentuk setiap isian diperiksa lebih dulu, seperti saat
 * menyimpan draf; bila ada yang salah, draf belum disimpan. Lalu keempat syarat kirim diperiksa di server; setiap
 * syarat yang gagal punya pesannya sendiri, dan isiannya disimpan sebagai draf kecuali selama isiannya terkunci (§6.5).
 * Bila diterima, pemilik akun diarahkan ke halaman konfirmasi yang berisi nomor pendaftarannya (§6.5).
 */
export async function kirimFormulir(
  _keadaan: KeadaanFormulirPendaftaran,
  formulir: FormData,
): Promise<KeadaanFormulirPendaftaran> {
  const pemilikAkun = await pastikanPemilikAkun();
  const isian = bacaIsianFormulir(formulir);

  try {
    const pilihan = await bacaPilihanFormulirPendaftaran();
    const idPilihan = keIdPilihan(pilihan);
    const bentuk = periksaDrafFormulirPendaftaran(isian, idPilihan);
    if (!bentuk.sah) {
      return {
        pesan: [
          peringatan(
            `Formulir belum terkirim karena isian berikut belum benar: ${labelIsianSalah(bentuk.galat)}. Perbaiki isian yang ditandai, lalu kirim lagi.`,
          ),
        ],
        isian,
        galat: bentuk.galat,
      };
    }
    const hasil = await kirimPendaftaran(
      pemilikAkun.id,
      bentuk.draf,
      bacaSekarang(),
    );
    if (hasil.hasil === "ditolak") {
      const namaProgram =
        pilihan.program.find((p) => p.id === bentuk.draf.programId)?.nama ??
        "Program ini";
      const pesan = hasil.gagal.map((gagal) =>
        peringatan(
          pesanSyaratGagal(gagal, { email: pemilikAkun.email, namaProgram }),
        ),
      );
      const galat = galatSyaratGagal(hasil.gagal);
      if (!hasil.drafTersimpan) return { pesan, isian, galat };
      // Isian tampil seperti yang tersimpan, sama seperti sesudah "Simpan draf".
      return {
        pesan: [...pesan, { jenis: "kabar", teks: KABAR_DRAF_OTOMATIS }],
        isian: keIsianFormulir(bentuk.draf, idPilihan),
        galat,
      };
    }
  } catch (galat) {
    console.error(galat);
    return { pesan: [peringatan(PESAN_GANGGUAN_KIRIM)], isian, galat: {} };
  }
  redirect(ALAMAT_KONFIRMASI_PENDAFTARAN);
}
