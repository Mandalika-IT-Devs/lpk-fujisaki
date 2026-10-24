import { spawnSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";

// Pegawai sintetis untuk test e2e. Admin dibuat oleh skrip pemasangan `pnpm admin:pertama`;
// Para Staf uji dibuat langsung oleh siapkan-database.ts. Membuat akun lewat panel diuji di akun-pegawai.spec.ts.
export type PegawaiUji = { nama: string; email: string; kataSandi: string };

export const ADMIN: PegawaiUji = {
  nama: "Admin Uji",
  email: "admin@contoh.test",
  kataSandi: "sandi-admin-uji",
};

export const STAF: PegawaiUji = {
  nama: "Staf Uji",
  email: "staf@contoh.test",
  kataSandi: "sandi-staf-uji",
};

export const STAF_NONAKTIF: PegawaiUji = {
  nama: "Staf Nonaktif Uji",
  email: "staf.nonaktif@contoh.test",
  kataSandi: "sandi-staf-nonaktif-uji",
};

// Hanya dipakai test lupa kata sandi, karena kata sandinya diganti di tengah test.
export const STAF_LUPA_SANDI: PegawaiUji = {
  nama: "Staf Lupa Sandi Uji",
  email: "staf.lupa.sandi@contoh.test",
  kataSandi: "sandi-staf-lupa-uji",
};

/** Menjalankan `pnpm admin:pertama` dengan isian Admin dari variabel lingkungan. */
export function jalankanAdminPertama(admin: PegawaiUji) {
  const hasil = spawnSync("pnpm", ["--silent", "admin:pertama"], {
    encoding: "utf8",
    env: {
      ...process.env,
      ADMIN_PERTAMA_NAMA: admin.nama,
      ADMIN_PERTAMA_EMAIL: admin.email,
      ADMIN_PERTAMA_KATA_SANDI: admin.kataSandi,
    },
  });
  return { kodeKeluar: hasil.status, keluaran: hasil.stdout + hasil.stderr };
}

/** Masuk lewat halaman masuk pegawai. */
export async function masuk(page: Page, pegawai: PegawaiUji) {
  await page.goto("/panel/masuk");
  await page.getByLabel("Email").fill(pegawai.email);
  await page.getByLabel("Kata sandi").fill(pegawai.kataSandi);
  await page.getByRole("button", { name: "Masuk" }).click();
}

/** Masuk, lalu menunggu panel pegawai terbuka. */
export async function masukKePanel(page: Page, pegawai: PegawaiUji) {
  await masuk(page, pegawai);
  await expect(page).toHaveURL("/panel/pendaftaran");
}
