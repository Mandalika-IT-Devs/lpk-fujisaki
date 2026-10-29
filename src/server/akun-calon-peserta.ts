import { eq, sql } from "drizzle-orm";
import { normalkanEmail } from "@/domain/akun";
import { auth, kirimTautanVerifikasiEmail } from "./auth";
import { db } from "./db";
import { akun, kredensial } from "./db/schema";
import { kirimEmail } from "./email";

// Akun calon peserta yang dibuat pengunjung sendiri (PRD §5.1). Akun ini berjenis pemilik akun, sama seperti
// siswa dan alumni nanti: satu orang memakai satu akun sepanjang perjalanannya (§2.1).

export type HasilBuatAkunCalonPeserta =
  | { hasil: "dibuat"; email: string }
  | { hasil: "email-dipakai" }
  | { hasil: "nomor-dipakai" }
  | { hasil: "kata-sandi-terlalu-panjang"; panjangMaksimal: number };

/**
 * Membuat akun calon peserta, lalu mengirim email verifikasi (PRD §5.1, §5.3).
 *
 * - Email dipakai sekali untuk semua akun, termasuk akun pegawai, tanpa membedakan huruf besar dan kecil.
 * - Nomor WhatsApp dipakai sekali untuk semua akun. `nomorWhatsApp` sudah dalam bentuk ternormalisasi (§5.2).
 * - `waktuPersetujuan` adalah saat persetujuan pemrosesan data dicentang dan dikirim (§12.1).
 *
 * Email verifikasi dikirim di dalam transaksi pembuatan akun: bila pengirimannya gagal, akun tidak jadi dibuat,
 * jadi pengunjung bisa mencoba lagi dengan email dan nomor yang sama. Batasan unik di tabel akun tetap menjaga
 * kedua aturan itu bila dua pendaftaran yang sama berjalan bersamaan.
 */
export async function buatAkunCalonPeserta(
  isian: {
    nama: string;
    email: string;
    nomorWhatsApp: string;
    kataSandi: string;
  },
  waktuPersetujuan: Date,
): Promise<HasilBuatAkunCalonPeserta> {
  const konteks = await auth.$context;
  // Better Auth menolak masuk dengan kata sandi yang lebih panjang dari batasnya, jadi batas itu berlaku juga di sini.
  const panjangMaksimal = konteks.password.config.maxPasswordLength;
  if (isian.kataSandi.length > panjangMaksimal) {
    return { hasil: "kata-sandi-terlalu-panjang", panjangMaksimal };
  }
  const email = normalkanEmail(isian.email);
  const hashKataSandi = await konteks.password.hash(isian.kataSandi);

  return db.transaction(async (tx) => {
    const [pemakaiEmail] = await tx
      .select({ id: akun.id })
      .from(akun)
      .where(sql`lower(${akun.email}) = ${email}`)
      .limit(1);
    if (pemakaiEmail) return { hasil: "email-dipakai" };

    const [pemakaiNomor] = await tx
      .select({ id: akun.id })
      .from(akun)
      .where(eq(akun.nomorWhatsApp, isian.nomorWhatsApp))
      .limit(1);
    if (pemakaiNomor) return { hasil: "nomor-dipakai" };

    const [baris] = await tx
      .insert(akun)
      .values({
        name: isian.nama,
        email,
        emailVerified: false,
        jenis: "pemilik_akun",
        nomorWhatsApp: isian.nomorWhatsApp,
        waktuPersetujuan,
      })
      .returning({ id: akun.id });
    await tx.insert(kredensial).values({
      userId: baris.id,
      accountId: baris.id,
      providerId: "credential",
      password: hashKataSandi,
    });
    await kirimTautanVerifikasiEmail(
      { auth, kirimEmail },
      { nama: isian.nama, email },
    );
    return { hasil: "dibuat", email };
  });
}
