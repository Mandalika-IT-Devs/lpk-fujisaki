import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect } from "@playwright/test";

// Kotak keluar berkas (src/server/email.ts): server e2e menulis setiap email sebagai berkas JSON nodemailer
// di folder EMAIL_KOTAK_KELUAR dari .env.ci. Nama berkas diawali waktu penulisannya dalam milidetik.

type EmailTerkirim = { kepada: string; subjek: string; teks: string };

function folderKotakKeluar(): string {
  const folder = process.env.EMAIL_KOTAK_KELUAR;
  if (!folder) {
    throw new Error(
      "EMAIL_KOTAK_KELUAR belum diisi, jadi email dari test tidak bisa dibaca. Isi variabel itu di .env.ci.",
    );
  }
  return folder;
}

/** Isi berkas email nodemailer, atau undefined bila berkasnya belum utuh. */
function bacaJson(teks: string) {
  try {
    return JSON.parse(teks);
  } catch {
    return undefined;
  }
}

/** Email untuk sebuah alamat yang ditulis sejak waktu tertentu, terlama lebih dulu. */
export async function emailUntuk(
  kepada: string,
  sejak: number,
): Promise<EmailTerkirim[]> {
  const folder = folderKotakKeluar();
  const berkas = await readdir(folder).catch(() => []);
  const daftar: EmailTerkirim[] = [];
  for (const nama of berkas.filter((n) => parseInt(n, 10) >= sejak).sort()) {
    const isi = bacaJson(await readFile(path.join(folder, nama), "utf8"));
    // Berkas yang masih ditulis server, misalnya email untuk test lain yang berjalan bersamaan, belum utuh. Berkas itu
    // dibaca lagi pada putaran berikutnya di tungguEmail.
    if (isi === undefined) continue;
    const penerima: string[] = isi.to.map(
      (alamat: { address: string }) => alamat.address,
    );
    if (penerima.includes(kepada)) {
      daftar.push({ kepada, subjek: isi.subject, teks: isi.text });
    }
  }
  return daftar;
}

/** Menunggu email terbaru untuk sebuah alamat yang ditulis sejak waktu tertentu. */
export async function tungguEmail(
  kepada: string,
  sejak: number,
): Promise<EmailTerkirim> {
  let terbaru: EmailTerkirim | undefined;
  await expect
    .poll(
      async () => {
        terbaru = (await emailUntuk(kepada, sejak)).at(-1);
        return terbaru !== undefined;
      },
      { message: `Email untuk ${kepada} tidak muncul di kotak keluar berkas.` },
    )
    .toBe(true);
  if (!terbaru) throw new Error(`Email untuk ${kepada} tidak ditemukan.`);
  return terbaru;
}
