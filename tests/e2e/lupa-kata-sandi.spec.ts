import { expect, type Page, test } from "@playwright/test";
import { emailUntuk, tungguEmail } from "./kotak-keluar";
import {
  masuk,
  masukKePanel,
  STAF,
  STAF_LUPA_SANDI,
  STAF_SESI_LAIN,
} from "./pegawai-uji";

// Lupa kata sandi pegawai (PRD §5.4, issue T04 dan T04-b). Kedaluwarsa tautan 1 jam diuji dengan jam yang
// disuntikkan di src/server/auth.test.ts, karena jam server e2e tidak bisa dimajukan.

const PESAN_TERKIRIM =
  "Bila email itu terdaftar untuk akun pegawai, tautan atur ulang kata sandi sudah kami kirim ke sana. Tautan berlaku 1 jam. Bila email belum masuk dalam beberapa menit, periksa folder spam, lalu minta tautan lagi.";

async function mintaTautan(page: Page, email: string) {
  await page.goto("/panel/lupa-kata-sandi");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Kirim tautan" }).click();
}

test("pegawai mengatur ulang kata sandi lewat tautan di email, lalu kata sandi lama tidak berlaku lagi (UAT-E4)", async ({
  page,
}) => {
  const sejak = Date.now();
  await page.goto("/panel/masuk");
  await page.getByRole("link", { name: "Lupa kata sandi?" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Lupa kata sandi" }),
  ).toBeVisible();
  await page.getByLabel("Email").fill(STAF_LUPA_SANDI.email);
  await page.getByRole("button", { name: "Kirim tautan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    PESAN_TERKIRIM,
  );

  const email = await tungguEmail(STAF_LUPA_SANDI.email, sejak);
  expect(email.subjek).toBe("Atur ulang kata sandi");
  const tautan = email.teks.match(/https?:\/\/\S+/)?.[0];
  expect(tautan).toContain("/panel/atur-ulang-kata-sandi?token=");

  await page.goto(tautan ?? "");
  await expect(
    page.getByRole("heading", { level: 1, name: "Atur kata sandi baru" }),
  ).toBeVisible();
  const kataSandiBaru = "sandi-baru-staf-lupa";
  await page.getByLabel("Kata sandi baru").fill(kataSandiBaru);
  await page.getByRole("button", { name: "Simpan kata sandi" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Kata sandi baru sudah disimpan",
  );

  await masuk(page, STAF_LUPA_SANDI);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Email atau kata sandi salah",
  );

  await masukKePanel(page, { ...STAF_LUPA_SANDI, kataSandi: kataSandiBaru });
});

test("setelah kata sandi diatur ulang di browser pertama, browser kedua diarahkan ke halaman masuk saat panel dimuat ulang (UAT-E4)", async ({
  page,
  browser,
}) => {
  // Pegawai yang sama masuk di dua browser: `page` adalah browser pertama, `halamanKedua` browser kedua.
  const browserKedua = await browser.newContext();
  const halamanKedua = await browserKedua.newPage();
  await masukKePanel(page, STAF_SESI_LAIN);
  await masukKePanel(halamanKedua, STAF_SESI_LAIN);

  const sejak = Date.now();
  await mintaTautan(page, STAF_SESI_LAIN.email);
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    PESAN_TERKIRIM,
  );
  const email = await tungguEmail(STAF_SESI_LAIN.email, sejak);
  const tautan = email.teks.match(/https?:\/\/\S+/)?.[0];
  await page.goto(tautan ?? "");
  const kataSandiBaru = "sandi-baru-staf-sesi-lain";
  await page.getByLabel("Kata sandi baru").fill(kataSandiBaru);
  await page.getByRole("button", { name: "Simpan kata sandi" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Kata sandi baru sudah disimpan",
  );

  await masuk(page, STAF_SESI_LAIN);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Email atau kata sandi salah",
  );
  await masukKePanel(page, { ...STAF_SESI_LAIN, kataSandi: kataSandiBaru });

  await halamanKedua.reload();
  await expect(halamanKedua).toHaveURL("/panel/masuk");
  await expect(
    halamanKedua.getByRole("heading", { level: 1, name: "Masuk pegawai" }),
  ).toBeVisible();

  await browserKedua.close();
});

test("permintaan untuk email yang tidak terdaftar menampilkan pesan yang sama dan tidak mengirim email", async ({
  page,
}) => {
  const sejak = Date.now();
  const tidakTerdaftar = "tidak.terdaftar@contoh.test";

  await mintaTautan(page, STAF.email);
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    PESAN_TERKIRIM,
  );
  await tungguEmail(STAF.email, sejak);

  await mintaTautan(page, tidakTerdaftar);
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    PESAN_TERKIRIM,
  );
  expect(await emailUntuk(tidakTerdaftar, sejak)).toEqual([]);
});

test("tautan atur ulang yang tidak berlaku ditolak dengan pesan dan jalan untuk meminta tautan baru", async ({
  page,
}) => {
  await page.goto("/panel/atur-ulang-kata-sandi?token=bukan-token-sah");
  await page.getByLabel("Kata sandi baru").fill("sandi-baru-apa-saja");
  await page.getByRole("button", { name: "Simpan kata sandi" }).click();

  const peringatan = page.getByRole("main").getByRole("alert");
  await expect(peringatan).toContainText("tidak berlaku lagi");
  await peringatan
    .getByRole("link", { name: "Buka halaman Lupa kata sandi" })
    .click();
  await expect(page).toHaveURL("/panel/lupa-kata-sandi");
});
