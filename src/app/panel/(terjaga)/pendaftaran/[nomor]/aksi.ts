"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { forbidden, redirect } from "next/navigation";
import { z } from "zod";
import type { IsianWajib } from "@/domain/formulir-pendaftaran";
import { bolehMembukaMenu } from "@/domain/panel-pegawai";
import type {
  PeringatanBatasUsia,
  TanggalLahirDitolak,
} from "@/domain/pendaftaran";
import { bolehMenghapusPermanen } from "@/domain/penghapusan";
import { ALASAN_PENUTUPAN, type PenutupanGagal } from "@/domain/penutupan";
import { formatTanggal } from "@/lib/format";
import { bacaPilihanUbahIsian } from "@/server/formulir-pendaftaran";
import {
  bacaPendaftaran,
  hapusPermanen,
  tutupPendaftaran,
  ubahIsianPendaftaran,
} from "@/server/pendaftaran";
import { bacaSekarang } from "@/server/waktu";
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
} from "@/app/(publik)/akun/formulir-pendaftaran/isian-formulir";
import { pastikanPegawai } from "../../../penjaga";
import type { Pesan } from "../../pesan-tindakan";
import {
  alamatPendaftaran,
  alamatSesudahHapusPermanen,
  skemaNomorPendaftaran,
} from "../alamat-pendaftaran";
import { ALAMAT_DAFTAR_PENDAFTARAN } from "../saringan";

// Mengubah isian formulir pendaftaran yang sudah dikirim hanya untuk Staf dan Admin (PRD §2.2, §6.5). Kewenangan
// diperiksa di server pada setiap tindakan, jadi permintaan langsung dari pemilik akun atau pengunjung juga ditolak.
// Isian diperiksa dengan aturan dan pesan yang sama seperti formulir pemilik akun (isian-formulir.ts).

export type KeadaanUbahIsian = {
  /** Hasil tindakan terakhir; perubahan yang ditolak membawa satu pesan untuk setiap sebabnya. */
  pesan: Pesan[];
  /** Isian hasil proses terakhir, atau null sebelum formulir pertama kali diproses (isian dari halaman dipakai). */
  isian: IsianFormulirPendaftaran | null;
  galat: GalatIsian;
  /** Kunci baru setiap kali formulir diproses, supaya isian dipasang ulang dari isian hasil proses terakhir. */
  versi: string;
};

const PESAN_TIDAK_ADA =
  "Pendaftaran ini tidak ditemukan. Buka lagi daftar pendaftaran, lalu pilih pendaftarannya dari daftar.";

const PESAN_GANGGUAN =
  "Perubahan belum disimpan karena gangguan di server. Coba simpan lagi beberapa saat lagi; bila tetap gagal, hubungi pengelola server lembaga.";

const peringatan = (teks: string): Pesan => ({ jenis: "peringatan", teks });

/** Sebab perubahan ditolak sesudah bentuk isiannya benar. */
type UbahIsianDitolak = {
  belumDiisi: readonly IsianWajib[];
  tanggalLahirDitolak: TanggalLahirDitolak | null;
};

/** Pesan untuk setiap sebab perubahan ditolak sesudah bentuk isiannya benar, dalam urutan formulir. */
function pesanDitolak({
  belumDiisi,
  tanggalLahirDitolak,
}: UbahIsianDitolak): Pesan[] {
  const pesan: Pesan[] = [];
  if (belumDiisi.length > 0) {
    pesan.push(
      peringatan(
        `Perubahan belum disimpan karena isian wajib berikut belum diisi: ${belumDiisi.map((nama) => LABEL_ISIAN[nama]).join(", ")}. Isi isian yang ditandai, lalu simpan lagi.`,
      ),
    );
  }
  if (tanggalLahirDitolak?.alasan === "sesudah-hari-ini") {
    pesan.push(
      peringatan(
        "Perubahan belum disimpan karena tanggal lahir jatuh sesudah hari ini. Periksa lagi tanggal lahirnya, lalu simpan lagi.",
      ),
    );
  }
  if (tanggalLahirDitolak?.alasan === "sesudah-tanggal-kirim") {
    pesan.push(
      peringatan(
        `Perubahan belum disimpan karena tanggal lahir jatuh sesudah tanggal kirim ${formatTanggal(tanggalLahirDitolak.tanggalKirimWib)}, jadi orangnya belum lahir saat pendaftarannya dikirim. Periksa lagi tanggal lahirnya, lalu simpan lagi.`,
      ),
    );
  }
  return pesan;
}

/**
 * Pesan pada setiap isian yang membuat perubahan ditolak sesudah bentuknya benar: pesan yang sama seperti formulir
 * pemilik akun, ditambah tanggal lahir yang jatuh sesudah tanggal kirim pendaftaran itu (PRD §11.2, ▶ Keputusan
 * 2026-10-30), yang hanya bisa terjadi saat pegawai mengubah isian.
 */
function galatUbahIsianDitolak({
  belumDiisi,
  tanggalLahirDitolak,
}: UbahIsianDitolak): GalatIsian {
  const galat = galatIsianDitolak({
    belumDiisi,
    tanggalLahirTidakBenar: tanggalLahirDitolak?.alasan === "sesudah-hari-ini",
  });
  if (tanggalLahirDitolak?.alasan === "sesudah-tanggal-kirim") {
    galat.tanggalLahir = `Tanggal lahir jatuh sesudah tanggal kirim ${formatTanggal(tanggalLahirDitolak.tanggalKirimWib)}. Periksa lagi tanggal lahirnya.`;
  }
  return galat;
}

/**
 * Peringatan bagi pegawai bila usia pada tanggal kirim di luar rentang program sesudah tanggal lahir atau program diubah
 * (PRD §11.2, ▶ Keputusan 2026-10-30). Perubahannya tetap disimpan, jadi pesannya menyebut usia dan rentangnya, lalu
 * meminta pegawai memeriksa ulang.
 */
function pesanPeringatanBatasUsia(
  peringatanBatasUsia: PeringatanBatasUsia & { namaProgram: string },
): Pesan {
  const { namaProgram, usiaMinimal, usiaMaksimal } = peringatanBatasUsia;
  const tanggalKirim = formatTanggal(peringatanBatasUsia.tanggalKirimWib);
  return peringatan(
    `Perubahan tetap disimpan, tetapi usianya ${peringatanBatasUsia.usia} tahun pada tanggal kirim ${tanggalKirim}, di luar batas usia ${namaProgram}, yaitu ${usiaMinimal}–${usiaMaksimal} tahun. Periksa lagi tanggal lahir dan programnya; bila keduanya sudah benar, perubahan ini boleh dibiarkan.`,
  );
}

/**
 * Pegawai menyimpan perubahan isian formulir sebuah pendaftaran. Keadaan sebelumnya yang dikirim browser tidak dipakai:
 * semua yang dibutuhkan dibaca dari isian formulir dan database. Perubahan yang membuat usia pada tanggal kirim di luar
 * rentang program tetap disimpan, dengan peringatan sesudah kabar tersimpannya.
 */
export async function simpanIsianPendaftaran(
  _sebelum: unknown,
  formulir: FormData,
): Promise<KeadaanUbahIsian> {
  const pegawai = await pastikanPegawai();
  const nomor = skemaNomorPendaftaran.safeParse(formulir.get("nomor"));
  const isian = bacaIsianFormulir(formulir);
  if (!bolehMembukaMenu(pegawai.peran, "pendaftaran")) forbidden();

  const versi = randomUUID();
  const ditolak = (pesan: Pesan[], galat: GalatIsian = {}) => ({
    pesan,
    isian,
    galat,
    versi,
  });
  if (!nomor.success) return ditolak([peringatan(PESAN_TIDAK_ADA)]);

  try {
    const tercatat = await bacaPendaftaran(nomor.data);
    if (!tercatat) return ditolak([peringatan(PESAN_TIDAK_ADA)]);
    const pilihan = keIdPilihan(await bacaPilihanUbahIsian(tercatat.isian));
    const bentuk = periksaDrafFormulirPendaftaran(isian, pilihan);
    if (!bentuk.sah) {
      return ditolak(
        [
          peringatan(
            `Perubahan belum disimpan karena isian berikut belum benar: ${labelIsianSalah(bentuk.galat)}. Perbaiki isian yang ditandai, lalu simpan lagi.`,
          ),
        ],
        bentuk.galat,
      );
    }
    const hasil = await ubahIsianPendaftaran(
      nomor.data,
      bentuk.draf,
      bacaSekarang(),
    );
    if (hasil.hasil === "tidak-ada") {
      return ditolak([peringatan(PESAN_TIDAK_ADA)]);
    }
    if (hasil.hasil === "ditolak") {
      return ditolak(pesanDitolak(hasil), galatUbahIsianDitolak(hasil));
    }
    revalidatePath(alamatPendaftaran(nomor.data));
    // Isian tampil seperti yang tersimpan, sama seperti saat halaman dibuka lagi; misalnya nomor HP dalam bentuk
    // ternormalisasi (§5.2).
    // Pemilik akun hanya melihat isian pendaftarannya yang Berjalan; yang Ditutup tampil dengan alasannya saja (OD-14).
    return {
      pesan: [
        {
          jenis: "kabar",
          teks:
            tercatat.status === "Berjalan"
              ? `Perubahan isian formulir ${nomor.data} sudah disimpan dan terlihat oleh pemilik akunnya.`
              : `Perubahan isian formulir ${nomor.data} sudah disimpan.`,
        },
        ...(hasil.peringatanBatasUsia
          ? [pesanPeringatanBatasUsia(hasil.peringatanBatasUsia)]
          : []),
      ],
      isian: keIsianFormulir(bentuk.draf, pilihan),
      galat: {},
      versi,
    };
  } catch (galat) {
    console.error(galat);
    return ditolak([peringatan(PESAN_GANGGUAN)]);
  }
}

// Menutup pendaftaran hanya untuk Staf dan Admin (PRD §2.2, §7.5, §11.2), diperiksa di server pada setiap tindakan.
// Aturan penutupan ada di modul domain (periksaPenutupan); tindakan ini hanya membaca isian dan menyusun pesannya.

/** Isian formulir tutup pendaftaran, seperti yang dikirim browser. */
type IsianPenutupan = { alasan: string; keterangan: string };

/** Pesan pada isian formulir tutup pendaftaran yang membuat penutupan ditolak. */
type GalatPenutupan = Partial<Record<keyof IsianPenutupan, string>>;

export type KeadaanTutupPendaftaran = {
  /** Hasil tindakan terakhir; penutupan yang ditolak membawa satu pesan untuk setiap sebabnya. */
  pesan: Pesan[];
  /** Isian hasil proses terakhir, supaya isian yang ditolak tidak hilang. */
  isian: IsianPenutupan;
  galat: GalatPenutupan;
  /** Kunci baru setiap kali formulir diproses, supaya isian dipasang ulang dari isian hasil proses terakhir. */
  versi: string;
};

const PESAN_GANGGUAN_TUTUP =
  "Pendaftaran belum ditutup karena gangguan di server. Coba tutup lagi beberapa saat lagi; bila tetap gagal, hubungi pengelola server lembaga.";

const GALAT_ALASAN_TIDAK_DIKENALI =
  "Alasan penutupan tidak dikenali. Pilih salah satu alasan yang tersedia.";

/** Alasan yang dipilih: salah satu alasan penutupan, atau null bila belum dipilih (PRD §7.5). */
const skemaAlasan = z
  .string()
  .transform((isi) => isi.trim() || null)
  .pipe(z.enum(ALASAN_PENUTUPAN, GALAT_ALASAN_TIDAK_DIKENALI).nullable());

/** Teks isian formulir yang dikirim browser; isian yang tidak ada dibaca kosong. */
function teksIsian(formulir: FormData, nama: keyof IsianPenutupan): string {
  const nilai = formulir.get(nama);
  return typeof nilai === "string" ? nilai : "";
}

/** Pesan pada isian dan pesan tindakan untuk setiap syarat penutupan yang gagal, dalam urutan formulir. */
function pesanPenutupanGagal(gagal: PenutupanGagal): {
  isian?: keyof IsianPenutupan;
  galat?: string;
  pesan: string;
} {
  switch (gagal.syarat) {
    case "status-berjalan":
      return {
        pesan:
          gagal.status === "Ditutup"
            ? "Pendaftaran ini sudah ditutup, jadi tidak bisa ditutup lagi atau dibuka kembali. Pemiliknya bisa mengirim formulir pendaftaran baru."
            : `Pendaftaran ini berstatus ${gagal.status}, jadi tidak bisa ditutup. Hanya pendaftaran Berjalan yang bisa ditutup.`,
      };
    case "alasan-dipilih":
      return {
        isian: "alasan",
        galat: "Alasan penutupan belum dipilih. Pilih salah satu alasan.",
        pesan:
          "Pendaftaran belum ditutup karena alasan penutupan belum dipilih. Pilih alasannya, lalu tutup lagi.",
      };
    case "alasan-sesuai-tahap":
      return {
        isian: "alasan",
        galat: `${gagal.alasan} hanya untuk pendaftaran di tahap 1. Pilih alasan lain.`,
        pesan: `Pendaftaran belum ditutup karena alasan ${gagal.alasan} hanya untuk pendaftaran di tahap 1, sedangkan pendaftaran ini di tahap ${gagal.tahap}. Pilih alasan lain, lalu tutup lagi.`,
      };
    case "keterangan-diisi":
      return {
        isian: "keterangan",
        galat:
          "Keterangan penutupan belum diisi. Keterangan wajib diisi untuk menutup pendaftaran.",
        pesan:
          "Pendaftaran belum ditutup karena keterangan penutupan belum diisi. Tulis keterangannya, lalu tutup lagi.",
      };
  }
}

/**
 * Pegawai menutup sebuah pendaftaran dengan alasan dan keterangan (PRD §7.5). Keadaan sebelumnya yang dikirim browser
 * tidak dipakai: semua yang dibutuhkan dibaca dari isian formulir dan database. Sesudah ditutup, halaman pendaftaran
 * menampilkan status Ditutup beserta alasan dan keterangannya, tanpa formulir ini.
 */
export async function tutupPendaftaranDariPanel(
  _sebelum: unknown,
  formulir: FormData,
): Promise<KeadaanTutupPendaftaran> {
  const pegawai = await pastikanPegawai();
  const nomor = skemaNomorPendaftaran.safeParse(formulir.get("nomor"));
  const isian: IsianPenutupan = {
    alasan: teksIsian(formulir, "alasan"),
    keterangan: teksIsian(formulir, "keterangan"),
  };
  const alasan = skemaAlasan.safeParse(isian.alasan);
  if (!bolehMembukaMenu(pegawai.peran, "pendaftaran")) forbidden();

  const versi = randomUUID();
  const ditolak = (pesan: Pesan[], galat: GalatPenutupan = {}) => ({
    pesan,
    isian,
    galat,
    versi,
  });
  if (!nomor.success) return ditolak([peringatan(PESAN_TIDAK_ADA)]);
  if (!alasan.success) {
    return ditolak(
      [
        peringatan(
          "Pendaftaran belum ditutup karena alasan penutupan tidak dikenali. Pilih salah satu alasan, lalu tutup lagi.",
        ),
      ],
      { alasan: GALAT_ALASAN_TIDAK_DIKENALI },
    );
  }

  try {
    const hasil = await tutupPendaftaran(nomor.data, {
      alasan: alasan.data,
      keterangan: isian.keterangan,
    });
    if (hasil.hasil === "tidak-ada") {
      return ditolak([peringatan(PESAN_TIDAK_ADA)]);
    }
    if (hasil.hasil === "ditolak") {
      const galat: GalatPenutupan = {};
      const pesan = hasil.gagal.map((gagal) => {
        const uraian = pesanPenutupanGagal(gagal);
        if (uraian.isian) galat[uraian.isian] = uraian.galat;
        return peringatan(uraian.pesan);
      });
      return ditolak(pesan, galat);
    }
    revalidatePath(alamatPendaftaran(nomor.data));
    return {
      pesan: [
        {
          jenis: "kabar",
          teks: `Pendaftaran ${nomor.data} sudah ditutup.`,
        },
      ],
      isian: { alasan: "", keterangan: "" },
      galat: {},
      versi,
    };
  } catch (galat) {
    console.error(galat);
    return ditolak([peringatan(PESAN_GANGGUAN_TUTUP)]);
  }
}

// Hapus permanen hanya untuk Admin (PRD §2.2, §12.5). Kewenangan diperiksa di server pada setiap tindakan, jadi
// permintaan langsung dari Staf ditolak, dan konfirmasi diperiksa di server dengan aturan domain sebelum apa pun dihapus.

export type KeadaanHapusPermanen = {
  /** Hasil tindakan terakhir yang ditolak; penghapusan yang berhasil membawa Admin ke daftar pendaftaran. */
  pesan: Pesan | null;
  /** Ketikan konfirmasi terakhir, supaya ketikan yang ditolak bisa diperbaiki. */
  konfirmasi: string;
  /** Pesan pada isian konfirmasi bila konfirmasinya tidak cocok. */
  galat: string | null;
  /** Kunci baru setiap kali formulir diproses, supaya isian dipasang ulang dari ketikan terakhir. */
  versi: string;
};

const PESAN_KONFIRMASI_SALAH =
  "Data belum dihapus karena konfirmasi tidak cocok dengan nomor pendaftaran atau email akun pemiliknya. Periksa ketikannya, lalu hapus lagi.";

const PESAN_GANGGUAN_HAPUS =
  "Data belum dihapus karena gangguan di server. Coba hapus lagi beberapa saat lagi; bila tetap gagal, hubungi pengelola server lembaga.";

/** Ketikan konfirmasi seperti yang dikirim browser; isian yang tidak ada dibaca kosong, dan kosong tidak pernah cocok. */
const skemaKonfirmasi = z.string().catch("");

/**
 * Admin menghapus permanen pemilik sebuah pendaftaran, beserta akunnya dan semua pendaftarannya (PRD §12.5), sesudah
 * mengetik nomor pendaftaran itu atau email akun pemiliknya. Keadaan sebelumnya yang dikirim browser tidak dipakai.
 * Sesudah terhapus, Admin dibawa ke daftar pendaftaran, yang menampilkan kabar penghapusannya.
 */
export async function hapusPermanenDariPanel(
  _sebelum: unknown,
  formulir: FormData,
): Promise<KeadaanHapusPermanen> {
  const pegawai = await pastikanPegawai();
  const nomor = skemaNomorPendaftaran.safeParse(formulir.get("nomor"));
  const konfirmasi = skemaKonfirmasi.parse(formulir.get("konfirmasi"));
  if (!bolehMenghapusPermanen(pegawai.peran)) forbidden();

  const ditolak = (teks: string, galat: string | null = null) => ({
    pesan: peringatan(teks),
    konfirmasi,
    galat,
    versi: randomUUID(),
  });
  if (!nomor.success) return ditolak(PESAN_TIDAK_ADA);

  try {
    const hasil = await hapusPermanen(nomor.data, konfirmasi);
    if (hasil.hasil === "tidak-ada") return ditolak(PESAN_TIDAK_ADA);
    if (hasil.hasil === "konfirmasi-salah") {
      return ditolak(
        PESAN_KONFIRMASI_SALAH,
        `Konfirmasi tidak cocok. Ketik nomor pendaftaran ${nomor.data} atau email akun pemiliknya persis seperti tercatat.`,
      );
    }
  } catch (galat) {
    console.error(galat);
    return ditolak(PESAN_GANGGUAN_HAPUS);
  }
  revalidatePath(ALAMAT_DAFTAR_PENDAFTARAN, "layout");
  // redirect dipanggil di luar try, karena ia bekerja dengan melempar galat khusus Next.js.
  redirect(alamatSesudahHapusPermanen(nomor.data));
}
