import { asc, eq, sql } from "drizzle-orm";
import {
  normalkanEmail,
  type Pegawai,
  type Peran,
  periksaPerubahanPegawai,
} from "@/domain/akun";
import { auth, keAkun, kirimTautanAturKataSandiPegawaiBaru } from "./auth";
import { db } from "./db";
import { akun, sesi } from "./db/schema";
import { kirimEmail } from "./email";

// Akun pegawai yang dikelola Admin (PRD §5.5). Akun pegawai tidak pernah dihapus, supaya riwayat perubahan
// tetap menunjuk orang yang benar: pegawai yang tidak bekerja lagi dinonaktifkan.

/** Satu baris di daftar pegawai: nama, email, peran, dan status aktif. */
export type BarisPegawai = Pegawai & { nama: string; email: string };

const kolomPegawai = {
  id: akun.id,
  nama: akun.name,
  email: akun.email,
  jenis: akun.jenis,
  peran: akun.peran,
  aktif: akun.aktif,
};

function keBarisPegawai(baris: {
  id: string;
  nama: string;
  email: string;
  jenis: "pegawai" | "pemilik_akun";
  peran: Peran | null;
  aktif: boolean;
}): BarisPegawai {
  const akunPegawai = keAkun(baris);
  if (akunPegawai.jenis !== "pegawai") {
    throw new Error(
      `Akun ${baris.email} bukan akun pegawai, padahal daftar pegawai hanya memuat akun berjenis pegawai. Periksa kolom jenis akun itu di tabel akun, lalu coba lagi.`,
    );
  }
  const { id, nama, email } = baris;
  return {
    id,
    nama,
    email,
    peran: akunPegawai.peran,
    aktif: akunPegawai.aktif,
  };
}

/** Semua pegawai, Admin maupun Staf, aktif maupun nonaktif, urut nama lalu email. */
export async function daftarPegawai(): Promise<BarisPegawai[]> {
  const semua = await db
    .select(kolomPegawai)
    .from(akun)
    .where(eq(akun.jenis, "pegawai"))
    .orderBy(asc(akun.name), asc(akun.email));
  return semua.map(keBarisPegawai);
}

export type HasilBuatAkunPegawai =
  | { hasil: "dibuat"; pegawai: BarisPegawai }
  | { hasil: "email-dipakai"; email: string };

/**
 * Admin membuat akun pegawai dengan nama, email, dan peran; pegawai baru menerima email untuk mengatur kata
 * sandinya (PRD §5.5). Email dipakai sekali untuk semua akun, tanpa membedakan huruf besar dan kecil (§5.1).
 * Email dikirim di dalam transaksi pembuatan akun: bila pengirimannya gagal, akun tidak jadi dibuat, jadi Admin
 * bisa mencoba lagi dengan email yang sama.
 */
export async function buatAkunPegawai(isian: {
  nama: string;
  email: string;
  peran: Peran;
}): Promise<HasilBuatAkunPegawai> {
  const email = normalkanEmail(isian.email);
  return db.transaction(async (tx) => {
    const [pemakaiEmail] = await tx
      .select({ id: akun.id })
      .from(akun)
      .where(sql`lower(${akun.email}) = ${email}`)
      .limit(1);
    if (pemakaiEmail) return { hasil: "email-dipakai", email };

    const [baris] = await tx
      .insert(akun)
      .values({
        name: isian.nama,
        email,
        // Email diisi Admin, dan pegawai membuktikannya dengan membuka tautan atur kata sandi.
        emailVerified: true,
        jenis: "pegawai",
        peran: isian.peran,
        aktif: true,
      })
      .returning(kolomPegawai);
    const pegawai = keBarisPegawai(baris);
    await kirimTautanAturKataSandiPegawaiBaru({ auth, kirimEmail }, pegawai);
    return { hasil: "dibuat", pegawai };
  });
}

export type HasilUbahPegawai =
  | { hasil: "diubah"; pegawai: BarisPegawai }
  | { hasil: "admin-terakhir"; pegawai: BarisPegawai }
  | { hasil: "tidak-ditemukan" };

/**
 * Admin mengubah peran pegawai, menonaktifkannya, atau mengaktifkannya kembali (PRD §5.5). Perubahan yang
 * menghabiskan Admin aktif ditolak oleh aturan di modul domain. Serializable: dua perubahan yang berjalan
 * bersamaan tidak bisa sama-sama menurunkan atau menonaktifkan dua Admin aktif terakhir.
 * Pegawai yang dinonaktifkan langsung kehilangan semua sesinya.
 */
export async function ubahPegawai(
  id: string,
  perubahan: { peran: Peran } | { aktif: boolean },
): Promise<HasilUbahPegawai> {
  return db.transaction(
    async (tx) => {
      const semua = (
        await tx
          .select(kolomPegawai)
          .from(akun)
          .where(eq(akun.jenis, "pegawai"))
      ).map(keBarisPegawai);
      const sebelum = semua.find((pegawai) => pegawai.id === id);
      if (!sebelum) return { hasil: "tidak-ditemukan" };

      const sesudah = { ...sebelum, ...perubahan };
      if (!periksaPerubahanPegawai(semua, sesudah).boleh) {
        return { hasil: "admin-terakhir", pegawai: sebelum };
      }
      await tx
        .update(akun)
        .set({ peran: sesudah.peran, aktif: sesudah.aktif })
        .where(eq(akun.id, id));
      if (!sesudah.aktif) await tx.delete(sesi).where(eq(sesi.userId, id));
      return { hasil: "diubah", pegawai: sesudah };
    },
    { isolationLevel: "serializable" },
  );
}
