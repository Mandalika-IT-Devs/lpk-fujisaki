// Membuat Admin pertama saat pemasangan sistem (PRD §5.5). Jalankan dengan `pnpm admin:pertama`.
// Nama, email, dan kata sandi dibaca dari ADMIN_PERTAMA_NAMA, ADMIN_PERTAMA_EMAIL, dan ADMIN_PERTAMA_KATA_SANDI.
// Skrip menolak berjalan bila sudah ada Admin: Admin berikutnya dibuat oleh Admin di panel pegawai.
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  kataSandiCukupPanjang,
  PANJANG_MINIMAL_KATA_SANDI,
} from "@/domain/akun";
import { auth } from "@/server/auth";
import { db, tutupDatabase } from "@/server/db";
import { akun, kredensial } from "@/server/db/schema";

const skemaIsian = z.object({
  nama: z
    .string("ADMIN_PERTAMA_NAMA belum diisi. Isi dengan nama lengkap Admin.")
    .trim()
    .min(1, "ADMIN_PERTAMA_NAMA belum diisi. Isi dengan nama lengkap Admin."),
  email: z.email(
    "ADMIN_PERTAMA_EMAIL belum berisi email yang sah. Isi dengan email Admin, misalnya nama@contoh.com.",
  ),
  kataSandi: z
    .string(
      `ADMIN_PERTAMA_KATA_SANDI belum diisi. Isi dengan kata sandi Admin, minimal ${PANJANG_MINIMAL_KATA_SANDI} karakter.`,
    )
    .refine(
      kataSandiCukupPanjang,
      `ADMIN_PERTAMA_KATA_SANDI kurang dari ${PANJANG_MINIMAL_KATA_SANDI} karakter. Pakai kata sandi minimal ${PANJANG_MINIMAL_KATA_SANDI} karakter.`,
    ),
});

type Hasil = { berhasil: boolean; pesan: string };

async function pasangAdminPertama(): Promise<Hasil> {
  const isian = skemaIsian.safeParse({
    nama: process.env.ADMIN_PERTAMA_NAMA,
    email: process.env.ADMIN_PERTAMA_EMAIL,
    kataSandi: process.env.ADMIN_PERTAMA_KATA_SANDI,
  });
  if (!isian.success) {
    return {
      berhasil: false,
      pesan: isian.error.issues.map((masalah) => masalah.message).join("\n"),
    };
  }
  const { nama, kataSandi } = isian.data;
  const email = isian.data.email.toLowerCase();
  const hashKataSandi = await (await auth.$context).password.hash(kataSandi);

  // Serializable: dua pemasangan yang berjalan bersamaan tidak bisa sama-sama membuat Admin.
  return db.transaction(
    async (tx) => {
      const [adminLama] = await tx
        .select({ id: akun.id })
        .from(akun)
        .where(and(eq(akun.jenis, "pegawai"), eq(akun.peran, "admin")))
        .limit(1);
      if (adminLama) {
        return {
          berhasil: false,
          pesan:
            "Sudah ada Admin, jadi Admin pertama tidak dibuat. Masuk sebagai Admin yang sudah ada di /panel/masuk; Admin berikutnya dibuat oleh Admin lewat panel pegawai.",
        };
      }

      const [pemakaiEmail] = await tx
        .select({ id: akun.id })
        .from(akun)
        .where(eq(akun.email, email))
        .limit(1);
      if (pemakaiEmail) {
        return {
          berhasil: false,
          pesan: `Email ${email} sudah dipakai akun lain. Pakai email lain untuk Admin pertama.`,
        };
      }

      const [admin] = await tx
        .insert(akun)
        .values({
          name: nama,
          email,
          // Email diisi langsung oleh pemasang sistem, jadi tidak perlu diverifikasi lewat tautan.
          emailVerified: true,
          jenis: "pegawai",
          peran: "admin",
          aktif: true,
        })
        .returning({ id: akun.id });
      await tx.insert(kredensial).values({
        userId: admin.id,
        accountId: admin.id,
        providerId: "credential",
        password: hashKataSandi,
      });
      return {
        berhasil: true,
        pesan: `Admin pertama dibuat dengan email ${email}. Masuk lewat halaman /panel/masuk.`,
      };
    },
    { isolationLevel: "serializable" },
  );
}

void pasangAdminPertama()
  .finally(tutupDatabase)
  .then((hasil) => {
    if (hasil.berhasil) {
      console.log(hasil.pesan);
    } else {
      console.error(hasil.pesan);
      process.exitCode = 1;
    }
  })
  .catch((galat: unknown) => {
    console.error(
      "Admin pertama gagal dibuat karena galat di bawah. Periksa DATABASE_URL dan pastikan PostgreSQL berjalan, lalu jalankan lagi.",
    );
    console.error(galat);
    process.exitCode = 1;
  });
