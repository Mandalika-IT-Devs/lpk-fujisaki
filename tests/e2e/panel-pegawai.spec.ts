import { expect, test } from "@playwright/test";
import { ADMIN, masuk, masukKePanel, STAF, STAF_NONAKTIF } from "./pegawai-uji";

// Menu panel pegawai dari issue T03 (PRD §2.2).
const MENU_ADMIN = [
  { nama: "Pendaftaran", alamat: "/panel/pendaftaran" },
  { nama: "Program", alamat: "/panel/program" },
  { nama: "Bidang kerja", alamat: "/panel/bidang-kerja" },
  { nama: "Statistik lembaga", alamat: "/panel/statistik-lembaga" },
  { nama: "Galeri", alamat: "/panel/galeri" },
  { nama: "Kontak", alamat: "/panel/kontak" },
  { nama: "Akun pegawai", alamat: "/panel/akun-pegawai" },
];
const MENU_KHUSUS_ADMIN = MENU_ADMIN.slice(1);

test.describe("pengunjung", () => {
  for (const alamat of ["/panel", "/panel/pendaftaran", "/panel/program"]) {
    test(`yang membuka ${alamat} diarahkan ke halaman masuk`, async ({
      page,
    }) => {
      await page.goto(alamat);

      await expect(page).toHaveURL("/panel/masuk");
      await expect(
        page.getByRole("heading", { level: 1, name: "Masuk pegawai" }),
      ).toBeVisible();
    });
  }
});

test("Admin hasil skrip pemasangan bisa masuk dan melihat semua menu Admin", async ({
  page,
}) => {
  await masukKePanel(page, ADMIN);

  const menu = page.getByRole("navigation", { name: "Menu panel pegawai" });
  const tautan = await menu.getByRole("link").evaluateAll((daftar) =>
    daftar.map((a) => ({
      nama: a.textContent?.trim(),
      alamat: a.getAttribute("href"),
    })),
  );
  expect(tautan).toEqual(MENU_ADMIN);
  await expect(page.getByRole("banner")).toContainText(ADMIN.nama);

  for (const { nama, alamat } of MENU_KHUSUS_ADMIN) {
    await menu.getByRole("link", { name: nama }).click();
    await expect(page).toHaveURL(alamat);
    await expect(
      page.getByRole("heading", { level: 1, name: nama }),
    ).toBeVisible();
  }
});

test("Staf tidak melihat menu Admin, dan alamat menu Admin ditolak di server (UAT-B1)", async ({
  page,
}) => {
  await masukKePanel(page, STAF);

  const menu = page.getByRole("navigation", { name: "Menu panel pegawai" });
  await expect(menu.getByRole("link")).toHaveText(["Pendaftaran"]);
  await expect(
    page.getByRole("heading", { level: 1, name: "Pendaftaran" }),
  ).toBeVisible();

  for (const { nama, alamat } of MENU_KHUSUS_ADMIN) {
    const jawaban = await page.goto(alamat);

    expect(jawaban?.status()).toBe(403);
    await expect(
      page.getByRole("heading", { level: 1, name: "Akses ditolak" }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/^Akses ditolak/);
    await expect(
      page.getByRole("heading", { level: 1, name: nama }),
    ).toHaveCount(0);
  }
});

test("alamat panel yang bukan menu menjawab 404 berbahasa Indonesia", async ({
  page,
}) => {
  await masukKePanel(page, ADMIN);

  const jawaban = await page.goto("/panel/tidak-ada");

  expect(jawaban?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
});

test("pegawai nonaktif ditolak saat masuk", async ({ page }) => {
  await masuk(page, STAF_NONAKTIF);

  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "nonaktif",
  );
  await expect(page).toHaveURL("/panel/masuk");

  await page.goto("/panel/pendaftaran");
  await expect(page).toHaveURL("/panel/masuk");
});

test("kata sandi yang salah ditolak", async ({ page }) => {
  await masuk(page, { ...STAF, kataSandi: "bukan-sandinya" });

  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Email atau kata sandi salah",
  );
  await expect(page).toHaveURL("/panel/masuk");
});

test("kata sandi kosong ditolak di server dengan pesan berbahasa Indonesia", async ({
  page,
}) => {
  await page.goto("/panel/masuk");
  await page.getByLabel("Email").fill(STAF.email);
  // Lewati pemeriksaan isian wajib di browser supaya validasi server yang diuji.
  await page.getByLabel("Kata sandi").evaluate((isian) => {
    isian.removeAttribute("required");
  });
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Kata sandi belum diisi. Isi kata sandimu.",
  );
});

test("pegawai yang keluar harus masuk lagi untuk membuka panel", async ({
  page,
}) => {
  await masukKePanel(page, STAF);

  await page.getByRole("button", { name: "Keluar" }).click();

  await expect(page).toHaveURL("/panel/masuk");
  await page.goto("/panel/pendaftaran");
  await expect(page).toHaveURL("/panel/masuk");
});
