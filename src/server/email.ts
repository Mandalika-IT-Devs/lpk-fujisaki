import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createTransport } from "nodemailer";
import { z } from "zod";

/** Satu email yang dikirim sistem, dalam teks biasa. */
export type Email = { kepada: string; subjek: string; teks: string };

export type KirimEmail = (email: Email) => Promise<void>;

// Variabel lingkungan yang kosong diperlakukan sama dengan yang tidak diisi.
const kosongJadiTiada = (nilai: unknown) =>
  typeof nilai === "string" && nilai.trim() === "" ? undefined : nilai;

const PESAN_PENGIRIM =
  'EMAIL_PENGIRIM belum diisi, jadi email tidak bisa dikirim. Isi dengan alamat pengirim, misalnya "LPKS Fujisaki Gakuin Center <no-reply@lpkfujisaki.com>", di .env, lalu mulai ulang aplikasi.';
const PESAN_HOST =
  "SMTP_HOST belum diisi, jadi email tidak bisa dikirim. Isi dengan alamat server SMTP (untuk Mailpit lokal: localhost) di .env, lalu mulai ulang aplikasi.";
const PESAN_PORT =
  "SMTP_PORT belum berisi nomor port yang sah, jadi email tidak bisa dikirim. Isi dengan port server SMTP (untuk Mailpit lokal: 56025) di .env, lalu mulai ulang aplikasi.";

const teksOpsional = z.preprocess(
  kosongJadiTiada,
  z
    .string(
      "Variabel lingkungan email harus berupa teks. Periksa isian email di .env, lalu mulai ulang aplikasi.",
    )
    .optional(),
);

const skemaPengaturan = z.object({
  EMAIL_PENGIRIM: z.preprocess(
    kosongJadiTiada,
    z.string(PESAN_PENGIRIM).trim().min(1, PESAN_PENGIRIM),
  ),
  EMAIL_KOTAK_KELUAR: teksOpsional,
  SMTP_HOST: teksOpsional,
  SMTP_PORT: z.preprocess(
    kosongJadiTiada,
    z.coerce
      .number(PESAN_PORT)
      .int(PESAN_PORT)
      .min(1, PESAN_PORT)
      .max(65535, PESAN_PORT)
      .optional(),
  ),
  SMTP_USER: teksOpsional,
  SMTP_PASSWORD: teksOpsional,
});

type Pengaturan =
  | { pengirim: string; kotakKeluar: string }
  | {
      pengirim: string;
      smtp: { host: string; port: number; user?: string; pass?: string };
    };

/** Membaca dan memeriksa pengaturan email dari variabel lingkungan, saat email akan dikirim. */
function bacaPengaturan(env: NodeJS.ProcessEnv): Pengaturan {
  const isian = skemaPengaturan.safeParse(env);
  if (!isian.success) {
    throw new Error(isian.error.issues.map((m) => m.message).join("\n"));
  }
  const { EMAIL_PENGIRIM, EMAIL_KOTAK_KELUAR, SMTP_HOST, SMTP_PORT } =
    isian.data;
  if (EMAIL_KOTAK_KELUAR) {
    return { pengirim: EMAIL_PENGIRIM, kotakKeluar: EMAIL_KOTAK_KELUAR };
  }
  const masalah = [
    ...(SMTP_HOST ? [] : [PESAN_HOST]),
    ...(SMTP_PORT ? [] : [PESAN_PORT]),
  ];
  if (!SMTP_HOST || !SMTP_PORT) throw new Error(masalah.join("\n"));
  return {
    pengirim: EMAIL_PENGIRIM,
    smtp: {
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: isian.data.SMTP_USER,
      pass: isian.data.SMTP_PASSWORD,
    },
  };
}

/**
 * Pengirim email sistem: SMTP lewat nodemailer (keputusan M1). Pengaturannya dibaca dari variabel lingkungan
 * yang dicatat di .env.example. Bila EMAIL_KOTAK_KELUAR berisi sebuah folder, email tidak dikirim, melainkan
 * ditulis sebagai berkas JSON di folder itu: test e2e membacanya, sehingga tidak ada email sungguhan dari test.
 */
export const kirimEmail: KirimEmail = async ({ kepada, subjek, teks }) => {
  const pengaturan = bacaPengaturan(process.env);
  const pesan = {
    from: pengaturan.pengirim,
    to: kepada,
    subject: subjek,
    text: teks,
  };

  if ("kotakKeluar" in pengaturan) {
    const info = await createTransport({ jsonTransport: true }).sendMail(pesan);
    await mkdir(pengaturan.kotakKeluar, { recursive: true });
    await writeFile(
      path.join(pengaturan.kotakKeluar, `${Date.now()}-${randomUUID()}.json`),
      info.message,
    );
    return;
  }

  const { host, port, user, pass } = pengaturan.smtp;
  await createTransport({
    host,
    port,
    // Port 465 memakai TLS sejak awal; port lain memakai STARTTLS bila server mendukungnya.
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
  }).sendMail(pesan);
};
