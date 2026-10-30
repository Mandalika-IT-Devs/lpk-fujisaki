import { and, asc, desc, eq, type SQL, sql } from "drizzle-orm";
import {
  bagiHalaman,
  type HalamanDaftar,
  type SaringanPendaftaran,
  saringPendaftaran,
} from "@/domain/daftar-pendaftaran";
import {
  BIDANG_KERJA_BELUM_TAHU,
  type IsianWajib,
} from "@/domain/formulir-pendaftaran";
import {
  nomorPendaftaran,
  tahunNomorPendaftaran,
} from "@/domain/nomor-pendaftaran";
import {
  drafDisimpanSaatDitolak,
  KODE_LANGKAH,
  pendaftaranBaru,
  type PeringatanBatasUsia,
  periksaSyaratKirim,
  periksaUbahIsian,
  peringatanBatasUsiaUbahIsian,
  type StatusLangkah,
  type StatusPendaftaran,
  type SyaratKirimGagal,
} from "@/domain/pendaftaran";
import { konfirmasiPenghapusanCocok } from "@/domain/penghapusan";
import {
  type AlasanPenutupan,
  type PenutupanGagal,
  periksaPenutupan,
} from "@/domain/penutupan";
import { db } from "./db";
import {
  akun,
  bidangKerja,
  drafFormulirPendaftaran,
  langkahPendaftaran,
  nomorUrutPendaftaran,
  pendaftaran,
  program,
  verifikasi,
} from "./db/schema";
import type { DrafFormulirPendaftaran } from "./formulir-pendaftaran";

// Pengiriman formulir pendaftaran dan pendaftaran yang dibukanya (PRD §6.2, §6.4–§6.6, §7.1).

type Transaksi = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Mengunci baris akun sampai transaksi selesai, supaya pengiriman formulir dan penyimpanan draf akun yang sama
 * bergiliran. Hasilnya status verifikasi email akun itu, atau undefined bila akunnya tidak ada.
 */
export async function kunciAkun(
  tx: Transaksi,
  akunId: string,
): Promise<{ emailTerverifikasi: boolean } | undefined> {
  const [baris] = await tx
    .select({ emailTerverifikasi: akun.emailVerified })
    .from(akun)
    .where(eq(akun.id, akunId))
    .for("update");
  return baris;
}

/**
 * Mengganti draf sebuah akun seluruhnya, termasuk isian yang dikosongkan, atau membuatnya bila belum ada. Dipanggil di
 * dalam transaksi yang sudah mengunci baris akun itu dan memastikan isiannya belum terkunci (§6.5).
 */
export async function gantiDraf(
  tx: Transaksi,
  akunId: string,
  draf: DrafFormulirPendaftaran,
): Promise<void> {
  await tx
    .insert(drafFormulirPendaftaran)
    .values({ akunId, ...draf })
    .onConflictDoUpdate({ target: drafFormulirPendaftaran.akunId, set: draf });
}

export type HasilKirimPendaftaran =
  | { hasil: "terkirim"; nomorPendaftaran: string }
  | {
      hasil: "ditolak";
      gagal: SyaratKirimGagal[];
      /** Isian yang dikirim kini tersimpan sebagai draf akun itu (§6.2). */
      drafTersimpan: boolean;
    };

/** Nomor pendaftaran Berjalan milik sebuah akun, atau null bila tidak ada (§6.6). */
export async function nomorPendaftaranBerjalan(
  tx: Transaksi,
  akunId: string,
): Promise<string | null> {
  const [baris] = await tx
    .select({ nomor: pendaftaran.nomor })
    .from(pendaftaran)
    .where(
      and(eq(pendaftaran.akunId, akunId), eq(pendaftaran.status, "Berjalan")),
    );
  return baris?.nomor ?? null;
}

/**
 * Mengambil nomor urut berikutnya dalam sebuah tahun WIB secara atomik: baris tahunnya dinaikkan satu, atau dibuat
 * dengan nomor urut 1 bila belum ada. Baris itu terkunci sampai transaksi selesai, jadi pengiriman lain di tahun yang
 * sama menunggu dan mendapat nomor sesudahnya. Bila transaksi dibatalkan, nomor itu tidak pernah diberikan.
 */
async function ambilNomorUrut(tx: Transaksi, tahun: number): Promise<number> {
  const [baris] = await tx
    .insert(nomorUrutPendaftaran)
    .values({ tahun, nomorUrutTerakhir: 1 })
    .onConflictDoUpdate({
      target: nomorUrutPendaftaran.tahun,
      set: {
        nomorUrutTerakhir: sql`${nomorUrutPendaftaran.nomorUrutTerakhir} + 1`,
      },
    })
    .returning({ nomorUrut: nomorUrutPendaftaran.nomorUrutTerakhir });
  return baris.nomorUrut;
}

/**
 * Isian formulir untuk pemeriksaan isian wajib (§6.1): bidang kerja disimpan dalam dua kolom, id bidang kerja atau
 * tanda "Belum tahu", tetapi diperiksa sebagai satu isian yang berisi salah satunya.
 */
function keFormulirDiperiksa(draf: DrafFormulirPendaftaran) {
  return {
    ...draf,
    bidangKerja: draf.bidangKerjaBelumTahu
      ? BIDANG_KERJA_BELUM_TAHU
      : draf.bidangKerjaId,
  };
}

/**
 * Pemilik akun mengirim formulir pendaftarannya pada saat `dikirimPada`. `draf` adalah isian formulir yang bentuknya
 * sudah diperiksa. Bila semua syarat kirim terpenuhi (§6.2), sistem membuka pendaftaran baru dengan nomor pendaftaran
 * (§6.4), status Berjalan di tahap 1, semua langkah Belum (§6.5), dan isian formulir sebagai bagian dari pendaftaran
 * itu. Draf akun itu lalu dihapus, supaya data pribadinya tidak tersimpan ganda (ADR-0004). Bila ditolak, isian itu
 * disimpan sebagai draf, menggantikan draf sebelumnya, kecuali selama isiannya terkunci (§6.2 ▶ Keputusan 2026-10-30,
 * §6.5), atau bila akunnya sudah tidak ada.
 *
 * Semuanya terjadi dalam satu transaksi. Baris akun dikunci lebih dulu, jadi dua pengiriman bersamaan dari akun yang
 * sama tidak bisa membuka dua pendaftaran Berjalan; indeks unik sebagian di tabel pendaftaran menjaganya juga. Karena
 * itu pula pengiriman yang ditolak tidak bisa menyimpan draf sesudah pengiriman lain dari akun yang sama diterima.
 */
export async function kirimPendaftaran(
  akunId: string,
  draf: DrafFormulirPendaftaran,
  dikirimPada: Date,
): Promise<HasilKirimPendaftaran> {
  return db.transaction(async (tx) => {
    const pemilik = await kunciAkun(tx, akunId);
    const [programDipilih] =
      draf.programId === null
        ? []
        : await tx
            .select({
              usiaMinimal: program.usiaMinimal,
              usiaMaksimal: program.usiaMaksimal,
            })
            .from(program)
            .where(eq(program.id, draf.programId));

    const periksa = periksaSyaratKirim({
      emailTerverifikasi: pemilik?.emailTerverifikasi ?? false,
      formulir: keFormulirDiperiksa(draf),
      rentangUsia: programDipilih ?? null,
      dikirimPada,
      nomorPendaftaranBerjalan: await nomorPendaftaranBerjalan(tx, akunId),
    });
    if (!periksa.boleh) {
      const drafTersimpan =
        pemilik !== undefined && drafDisimpanSaatDitolak(periksa.gagal);
      if (drafTersimpan) await gantiDraf(tx, akunId, draf);
      return { hasil: "ditolak", gagal: periksa.gagal, drafTersimpan };
    }

    const nomorUrut = await ambilNomorUrut(
      tx,
      tahunNomorPendaftaran(dikirimPada),
    );
    const { nomor } = nomorPendaftaran({ dikirimPada, urutan: nomorUrut });
    // Bidang kerja disimpan dalam dua kolom, seperti di draf: id bidang kerja, atau tanda "Belum tahu".
    const { bidangKerja, ...isian } = periksa.formulir;
    const baru = pendaftaranBaru();
    const [dibuka] = await tx
      .insert(pendaftaran)
      .values({
        ...isian,
        bidangKerjaBelumTahu: bidangKerja === BIDANG_KERJA_BELUM_TAHU,
        akunId,
        nomor,
        dikirimPada,
        status: baru.status,
        tahap: baru.tahap,
      })
      .returning({ id: pendaftaran.id });
    await tx.insert(langkahPendaftaran).values(
      baru.langkah.map((langkah) => ({
        pendaftaranId: dibuka.id,
        ...langkah,
      })),
    );
    await tx
      .delete(drafFormulirPendaftaran)
      .where(eq(drafFormulirPendaftaran.akunId, akunId));
    return { hasil: "terkirim", nomorPendaftaran: nomor };
  });
}

/**
 * Isian formulir pendaftaran yang sudah dikirim, dengan bentuk yang sama seperti draf, tetapi isian wajibnya selalu
 * terisi.
 */
type IsianPendaftaran = Omit<
  typeof pendaftaran.$inferSelect,
  | "id"
  | "akunId"
  | "nomor"
  | "dikirimPada"
  | "status"
  | "tahap"
  | "alasanPenutupan"
  | "keteranganPenutupan"
>;

/** Kolom isian formulir pendaftaran di tabel pendaftaran, dalam urutan PRD §6.1. */
const KOLOM_ISIAN = {
  namaLengkap: pendaftaran.namaLengkap,
  jenisKelamin: pendaftaran.jenisKelamin,
  tempatLahir: pendaftaran.tempatLahir,
  tanggalLahir: pendaftaran.tanggalLahir,
  kabupatenKota: pendaftaran.kabupatenKota,
  provinsi: pendaftaran.provinsi,
  pendidikanTerakhir: pendaftaran.pendidikanTerakhir,
  jurusanPendidikan: pendaftaran.jurusanPendidikan,
  programId: pendaftaran.programId,
  bidangKerjaId: pendaftaran.bidangKerjaId,
  bidangKerjaBelumTahu: pendaftaran.bidangKerjaBelumTahu,
  kemampuanBahasaJepang: pendaftaran.kemampuanBahasaJepang,
  pengalamanKerja: pendaftaran.pengalamanKerja,
  namaKontakDarurat: pendaftaran.namaKontakDarurat,
  hubunganKontakDarurat: pendaftaran.hubunganKontakDarurat,
  nomorHpKontakDarurat: pendaftaran.nomorHpKontakDarurat,
};

/** Alasan dan keterangan penutupan sebuah pendaftaran yang Ditutup (PRD §7.5). */
type Penutupan = { alasan: AlasanPenutupan; keterangan: string };

/**
 * Satu pendaftaran: nomor pendaftaran, status, tahap saat ini, isian formulir pendaftarannya, dan penutupannya (null
 * bila tidak Ditutup). Nama program dan bidang kerja ikut dibaca, juga bila keduanya sudah dinonaktifkan (§4.3);
 * bidang kerja berisi "Belum tahu" bila itu yang dipilih.
 */
type Pendaftaran = {
  nomor: string;
  status: StatusPendaftaran;
  tahap: number;
  program: string;
  bidangKerja: string;
  isian: IsianPendaftaran;
  penutupan: Penutupan | null;
};

/** Pendaftaran pertama yang memenuhi `syarat`, atau undefined bila tidak ada. */
async function bacaSatuPendaftaran(
  syarat: SQL | undefined,
): Promise<Pendaftaran | undefined> {
  const [baris] = await db
    .select({
      nomor: pendaftaran.nomor,
      status: pendaftaran.status,
      tahap: pendaftaran.tahap,
      program: program.nama,
      namaBidangKerja: bidangKerja.nama,
      isian: KOLOM_ISIAN,
      alasanPenutupan: pendaftaran.alasanPenutupan,
      keteranganPenutupan: pendaftaran.keteranganPenutupan,
    })
    .from(pendaftaran)
    .innerJoin(program, eq(program.id, pendaftaran.programId))
    .leftJoin(bidangKerja, eq(bidangKerja.id, pendaftaran.bidangKerjaId))
    .where(syarat);
  if (!baris) return undefined;
  const { namaBidangKerja, alasanPenutupan, keteranganPenutupan, ...isi } =
    baris;
  return {
    ...isi,
    bidangKerja: namaBidangKerja ?? BIDANG_KERJA_BELUM_TAHU,
    // Database menjaga keduanya diisi bersama, hanya untuk pendaftaran yang Ditutup.
    penutupan:
      alasanPenutupan !== null && keteranganPenutupan !== null
        ? { alasan: alasanPenutupan, keterangan: keteranganPenutupan }
        : null,
  };
}

/**
 * Pendaftaran Berjalan seperti yang dilihat pemiliknya di halaman akun (PRD §2.3): nomor, program, status, tahap, dan
 * isian formulir pendaftarannya, termasuk perubahan oleh pegawai (§6.5).
 */
export type PendaftaranBerjalan = Omit<Pendaftaran, "penutupan"> & {
  status: "Berjalan";
};

/** Pendaftaran Berjalan milik sebuah akun, atau undefined bila tidak ada. */
export async function bacaPendaftaranBerjalan(
  akunId: string,
): Promise<PendaftaranBerjalan | undefined> {
  const baris = await bacaSatuPendaftaran(
    and(eq(pendaftaran.akunId, akunId), eq(pendaftaran.status, "Berjalan")),
  );
  if (!baris) return undefined;
  return {
    nomor: baris.nomor,
    status: "Berjalan",
    tahap: baris.tahap,
    program: baris.program,
    bidangKerja: baris.bidangKerja,
    isian: baris.isian,
  };
}

/**
 * Pendaftaran Ditutup seperti yang dilihat pemiliknya di halaman akun (PRD §2.3, ▶ Keputusan OD-14): nomor, program,
 * status Ditutup, dan alasan penutupannya. Keterangan penutupan hanya untuk pegawai, jadi tidak ikut dibaca.
 */
export type PendaftaranDitutup = {
  nomor: string;
  program: string;
  status: "Ditutup";
  alasan: AlasanPenutupan;
};

/** Semua pendaftaran Ditutup milik sebuah akun, dari yang paling baru dikirim. */
export async function bacaPendaftaranDitutup(
  akunId: string,
): Promise<PendaftaranDitutup[]> {
  const semua = await db
    .select({
      nomor: pendaftaran.nomor,
      program: program.nama,
      alasan: pendaftaran.alasanPenutupan,
    })
    .from(pendaftaran)
    .innerJoin(program, eq(program.id, pendaftaran.programId))
    .where(
      and(eq(pendaftaran.akunId, akunId), eq(pendaftaran.status, "Ditutup")),
    )
    .orderBy(desc(pendaftaran.dikirimPada), desc(pendaftaran.nomor));
  return semua.map(({ alasan, ...isi }) => {
    if (alasan === null) {
      throw new Error(
        `Pendaftaran ${isi.nomor} berstatus Ditutup tanpa alasan penutupan. Periksa CHECK pendaftaran_penutupan_hanya_saat_ditutup di database.`,
      );
    }
    return { ...isi, status: "Ditutup", alasan };
  });
}

/**
 * Saat kirim, status, dan isian formulir setiap pendaftaran milik sebuah akun, sebagai bahan isian awal formulir
 * pendaftaran ulang (§6.6).
 */
export async function bacaIsianPendaftaranAkun(akunId: string): Promise<
  {
    status: StatusPendaftaran;
    dikirimPada: Date;
    isian: IsianPendaftaran;
  }[]
> {
  return db
    .select({
      status: pendaftaran.status,
      dikirimPada: pendaftaran.dikirimPada,
      isian: KOLOM_ISIAN,
    })
    .from(pendaftaran)
    .where(eq(pendaftaran.akunId, akunId));
}

/** Pendaftaran dengan nomor pendaftaran tertentu, atau undefined bila tidak ada. */
export async function bacaPendaftaran(
  nomor: string,
): Promise<Pendaftaran | undefined> {
  return bacaSatuPendaftaran(eq(pendaftaran.nomor, nomor));
}

/**
 * Status setiap langkah sebuah pendaftaran, dalam urutan PRD §7.1, untuk halaman pendaftaran di panel pegawai (§11.2).
 * Kosong bila nomor pendaftaran itu tidak ada.
 */
export async function bacaLangkahPendaftaran(
  nomor: string,
): Promise<{ kode: string; status: StatusLangkah }[]> {
  const langkah = await db
    .select({
      kode: langkahPendaftaran.kode,
      status: langkahPendaftaran.status,
    })
    .from(langkahPendaftaran)
    .innerJoin(
      pendaftaran,
      eq(pendaftaran.id, langkahPendaftaran.pendaftaranId),
    )
    .where(eq(pendaftaran.nomor, nomor));
  const urutan = (kode: string) => KODE_LANGKAH.indexOf(kode);
  return langkah.toSorted((a, b) => urutan(a.kode) - urutan(b.kode));
}

export type HasilUbahIsianPendaftaran =
  | {
      hasil: "tersimpan";
      /** Peringatan batas usia beserta nama program sesudah diubah, atau null bila tidak ada (§11.2). */
      peringatanBatasUsia:
        (PeringatanBatasUsia & { namaProgram: string }) | null;
    }
  | {
      hasil: "ditolak";
      belumDiisi: IsianWajib[];
      tanggalLahirTidakBenar: boolean;
    }
  | { hasil: "tidak-ada" };

/**
 * Pegawai mengubah isian formulir pendaftaran yang sudah dikirim (PRD §2.2, §6.5) pada saat `sekarang`. `draf` adalah
 * isian yang bentuknya sudah diperiksa, dengan aturan yang sama seperti formulir pemilik akun. Isian wajib tetap harus
 * terisi (§6.1) dan tanggal lahir tidak boleh jatuh sesudah hari ini (§6.3); bila tidak, tidak ada yang disimpan.
 * Isian diganti seluruhnya, termasuk isian tidak wajib yang dikosongkan.
 *
 * Bila tanggal lahir atau program berubah dan usia pada tanggal kirim pendaftaran itu di luar rentang program sesudah
 * diubah, perubahan tetap disimpan, dan hasilnya membawa peringatan batas usia (§11.2, ▶ Keputusan 2026-10-30). Baris
 * pendaftaran dikunci lebih dulu dalam satu transaksi, jadi dua perubahan bersamaan bergiliran, dan yang kedua
 * dibandingkan dengan isian yang disimpan perubahan pertama.
 */
export async function ubahIsianPendaftaran(
  nomor: string,
  draf: DrafFormulirPendaftaran,
  sekarang: Date,
): Promise<HasilUbahIsianPendaftaran> {
  const periksa = periksaUbahIsian(keFormulirDiperiksa(draf), sekarang);
  if (!periksa.sah) {
    return {
      hasil: "ditolak",
      belumDiisi: periksa.belumDiisi,
      tanggalLahirTidakBenar: periksa.tanggalLahirTidakBenar,
    };
  }
  const { bidangKerja, ...isian } = periksa.formulir;
  return db.transaction(async (tx) => {
    const [tersimpan] = await tx
      .select({
        id: pendaftaran.id,
        dikirimPada: pendaftaran.dikirimPada,
        tanggalLahir: pendaftaran.tanggalLahir,
        programId: pendaftaran.programId,
      })
      .from(pendaftaran)
      .where(eq(pendaftaran.nomor, nomor))
      .for("update");
    if (!tersimpan) return { hasil: "tidak-ada" };
    const [programDipilih] = await tx
      .select({
        nama: program.nama,
        usiaMinimal: program.usiaMinimal,
        usiaMaksimal: program.usiaMaksimal,
      })
      .from(program)
      .where(eq(program.id, isian.programId));
    if (!programDipilih) {
      throw new Error(
        `Program dengan id ${isian.programId} tidak ada. Pilihan program harus diperiksa terhadap daftar program sebelum isian diubah.`,
      );
    }

    await tx
      .update(pendaftaran)
      .set({
        ...isian,
        bidangKerjaBelumTahu: bidangKerja === BIDANG_KERJA_BELUM_TAHU,
      })
      .where(eq(pendaftaran.id, tersimpan.id));
    const { nama, ...rentangUsia } = programDipilih;
    const peringatan = peringatanBatasUsiaUbahIsian({
      tersimpan,
      diubah: isian,
      rentangUsia,
      dikirimPada: tersimpan.dikirimPada,
    });
    return {
      hasil: "tersimpan",
      peringatanBatasUsia: peringatan && { ...peringatan, namaProgram: nama },
    };
  });
}

export type HasilTutupPendaftaran =
  | { hasil: "ditutup" }
  | { hasil: "ditolak"; gagal: PenutupanGagal[] }
  | { hasil: "tidak-ada" };

/**
 * Pegawai menutup sebuah pendaftaran (PRD §7.5) dengan alasan (null bila belum dipilih) dan keterangan. Bila syarat
 * penutupan terpenuhi, statusnya menjadi Ditutup beserta alasan dan keterangannya; bila tidak, tidak ada yang berubah.
 * Tidak ada jalan sebaliknya: pendaftaran yang Ditutup tidak bisa dibuka kembali atau ditutup lagi.
 *
 * Baris pendaftaran dikunci lebih dulu dalam satu transaksi, jadi dua penutupan bersamaan bergiliran, dan yang kedua
 * melihat pendaftaran itu sudah Ditutup.
 */
export async function tutupPendaftaran(
  nomor: string,
  penutupan: { alasan: AlasanPenutupan | null; keterangan: string },
): Promise<HasilTutupPendaftaran> {
  return db.transaction(async (tx) => {
    const [tercatat] = await tx
      .select({
        id: pendaftaran.id,
        status: pendaftaran.status,
        tahap: pendaftaran.tahap,
      })
      .from(pendaftaran)
      .where(eq(pendaftaran.nomor, nomor))
      .for("update");
    if (!tercatat) return { hasil: "tidak-ada" };

    const periksa = periksaPenutupan({ ...tercatat, ...penutupan });
    if (!periksa.boleh) return { hasil: "ditolak", gagal: periksa.gagal };
    await tx
      .update(pendaftaran)
      .set({
        status: "Ditutup",
        alasanPenutupan: periksa.alasan,
        keteranganPenutupan: periksa.keterangan,
      })
      .where(eq(pendaftaran.id, tercatat.id));
    return { hasil: "ditutup" };
  });
}

export type HasilHapusPermanen =
  | { hasil: "terhapus" }
  | { hasil: "konfirmasi-salah" }
  | { hasil: "tidak-ada" };

/**
 * Admin menghapus secara permanen orang yang memiliki pendaftaran `nomor` (PRD §12.5), dengan `konfirmasi` berupa
 * nomor pendaftaran itu atau email akunnya. Yang terhapus adalah akunnya beserta semua datanya: kredensial, sesi (jadi
 * setiap perangkat yang masih masuk ikut keluar), tautan atur ulang kata sandi yang belum dipakai, draf formulir
 * pendaftaran, dan semua pendaftarannya beserta langkahnya, apa pun statusnya. Konfirmasi yang tidak cocok tidak
 * menghapus apa pun. Penghitung nomor urut tidak ikut turun, jadi nomor pendaftarannya tidak pernah dipakai ulang
 * (§6.4). Kewenangan Admin diperiksa pemanggilnya.
 *
 * Baris akun dikunci lebih dulu dalam satu transaksi, jadi penghapusan dan pengiriman formulir oleh orang itu pada saat
 * yang sama bergiliran: pengiriman yang datang sesudahnya ditolak karena akunnya sudah tidak ada, dan pendaftaran yang
 * terkirim sebelumnya ikut terhapus.
 */
export async function hapusPermanen(
  nomor: string,
  konfirmasi: string,
): Promise<HasilHapusPermanen> {
  return db.transaction(async (tx) => {
    const [orang] = await tx
      .select({ akunId: akun.id, email: akun.email })
      .from(pendaftaran)
      .innerJoin(akun, eq(akun.id, pendaftaran.akunId))
      .where(eq(pendaftaran.nomor, nomor))
      .for("update", { of: akun });
    if (!orang) return { hasil: "tidak-ada" };
    if (
      !konfirmasiPenghapusanCocok(konfirmasi, {
        nomorPendaftaran: nomor,
        email: orang.email,
      })
    ) {
      return { hasil: "konfirmasi-salah" };
    }
    // Token atur ulang kata sandi Better Auth menyimpan id akun sebagai nilainya, tanpa foreign key ke akun.
    await tx.delete(verifikasi).where(eq(verifikasi.value, orang.akunId));
    // Kredensial, sesi, draf, pendaftaran, dan langkahnya ikut terhapus lewat foreign key on delete cascade.
    await tx.delete(akun).where(eq(akun.id, orang.akunId));
    return { hasil: "terhapus" };
  });
}

/**
 * Satu baris daftar pendaftaran di panel pegawai (PRD §11.1). Nama program dan bidang kerja ikut dibaca, juga bila
 * keduanya sudah dinonaktifkan (§4.3). Bidang kerja berisi "Belum tahu" bila belum dipilih.
 */
export type BarisDaftarPendaftaran = {
  nomor: string;
  namaLengkap: string;
  programId: number;
  program: string;
  bidangKerjaId: number | null;
  bidangKerja: string;
  tahap: number;
  status: StatusPendaftaran;
  dikirimPada: Date;
};

/**
 * Satu halaman daftar pendaftaran untuk pegawai: pendaftaran yang cocok dengan saringan dan pencarian, dari yang
 * paling baru dikirim (§11.1). Saringan, urutan, dan pembagian halaman mengikuti modul domain, jadi semua pendaftaran
 * dibaca lebih dulu; lembaga menerima sekitar 100 pendaftaran per tahun (§1.1).
 */
export async function bacaDaftarPendaftaran(
  saringan: SaringanPendaftaran,
  halaman: number,
): Promise<HalamanDaftar<BarisDaftarPendaftaran>> {
  const semua = await db
    .select({
      nomor: pendaftaran.nomor,
      namaLengkap: pendaftaran.namaLengkap,
      programId: pendaftaran.programId,
      program: program.nama,
      bidangKerjaId: pendaftaran.bidangKerjaId,
      namaBidangKerja: bidangKerja.nama,
      tahap: pendaftaran.tahap,
      status: pendaftaran.status,
      dikirimPada: pendaftaran.dikirimPada,
    })
    .from(pendaftaran)
    .innerJoin(program, eq(program.id, pendaftaran.programId))
    .leftJoin(bidangKerja, eq(bidangKerja.id, pendaftaran.bidangKerjaId))
    // Urutan tetap sebelum diurutkan menurut saat kirim, supaya pendaftaran yang dikirim pada saat yang sama tidak
    // berpindah halaman di antara dua pembacaan.
    .orderBy(asc(pendaftaran.nomor));
  const baris = semua.map(({ namaBidangKerja, ...isi }) => ({
    ...isi,
    bidangKerja: namaBidangKerja ?? BIDANG_KERJA_BELUM_TAHU,
  }));
  return bagiHalaman(saringPendaftaran(baris, saringan), halaman);
}
