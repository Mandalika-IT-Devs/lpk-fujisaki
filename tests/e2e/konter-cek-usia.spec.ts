import { expect, type Page, test } from "@playwright/test";
import { ADMIN, masukKePanel } from "./pegawai-uji";

// Konter cek usia di Beranda (issue T10, PRD §6.3, UAT-F3 bagian konter). Isi awal program dari issue T06: empat
// program dengan batas usia 18–30 tahun (▶ Keputusan OD-01). Teks jawaban dari docs/design/prototipe/beranda.html.
// Berkas ini berjalan sesudah test lain (playwright.config.ts), karena salah satu test menonaktifkan program Pelajar
// sebentar lalu mengaktifkannya kembali.

const PROGRAM_AWAL = [
  "Tokutei Ginou (SSW)",
  "Pemagangan",
  "Gijinkoku",
  "Pelajar",
];
const JUDUL =
  "Dari Cilacap ke Jepang, lewat jalur yang bisa kamu pantau sendiri.";
const PAPAN_CILACAP =
  "Papan stasiun FG 01 Cilacap, stasiun awal: pendaftaran dan seleksi. Berikutnya: belajar bahasa Jepang, FG 02.";
const HP = { width: 390, height: 844 };

// Contoh PRD §6.3: "hari ini" adalah 23-10-2026 pukul 10.00 WIB.
const HARI_INI = new Date("2026-10-23T03:00:00Z");

function konter(page: Page) {
  return page.getByRole("region", { name: "Cek usiamu, lalu daftar" });
}

/** Mengisi tanggal lahir dan program di konter, lalu mengembalikan jawabannya. */
async function cekUsia(page: Page, tanggalLahir: string, program: string) {
  const isi = konter(page);
  await isi.getByLabel("Program", { exact: true }).selectOption({
    label: program,
  });
  await isi.getByLabel("Tanggal lahir").fill(tanggalLahir);
  return isi.getByRole("status");
}

test.describe("jawaban langsung", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(HARI_INI);
    await page.goto("/");
  });

  test("sebelum tanggal lahir diisi, konter mengajak mengisinya", async ({
    page,
  }) => {
    await expect(konter(page).getByRole("status")).toHaveText(
      "Isi tanggal lahirmu untuk melihat apakah usiamu masuk rentang program.",
    );
  });

  test("usia 17 hari ini untuk program 18–30 menampilkan usia 17 dan tanggal mulai boleh mendaftar; usia tepat 18 bisa mendaftar (UAT-F3, bagian konter)", async ({
    page,
  }) => {
    const jawaban = await cekUsia(page, "2008-10-24", "Tokutei Ginou (SSW)");
    await expect(jawaban).toHaveText(
      "Usiamu 17 tahun. Tokutei Ginou (SSW) menerima usia 18–30 tahun. Kamu bisa mendaftar mulai 24-10-2026.",
    );

    await konter(page).getByLabel("Tanggal lahir").fill("2008-10-23");
    await expect(jawaban).toHaveText(
      "Usiamu 18 tahun. Tokutei Ginou (SSW) menerima usia 18–30 tahun, jadi kamu bisa mendaftar.",
    );
  });

  test("usia di atas batas menampilkan usia dan batasnya", async ({ page }) => {
    const jawaban = await cekUsia(page, "1995-10-23", "Pemagangan");

    await expect(jawaban).toHaveText(
      "Usiamu 31 tahun, di atas batas 30 tahun untuk Pemagangan. Tanyakan program lain di loket kami.",
    );
  });

  test("tanggal lahir sesudah hari ini belum benar", async ({ page }) => {
    const jawaban = await cekUsia(page, "2026-10-24", "Gijinkoku");

    await expect(jawaban).toHaveText(
      "Tanggal lahir belum benar. Periksa lagi tahunnya.",
    );
  });

  test("jawaban ikut berubah saat program diganti", async ({ page }) => {
    const jawaban = await cekUsia(page, "2008-10-23", "Gijinkoku");
    await expect(jawaban).toHaveText(/^Usiamu 18 tahun\. Gijinkoku /);

    await konter(page)
      .getByLabel("Program", { exact: true })
      .selectOption({ label: "Pemagangan" });
    await expect(jawaban).toHaveText(/^Usiamu 18 tahun\. Pemagangan /);
  });
});

test("di 390×844, konter dan tombol Daftar sekarang terlihat tanpa menggulir, bersama judul dan papan Cilacap", async ({
  page,
}) => {
  await page.setViewportSize(HP);
  await page.goto("/");

  for (const elemen of [
    page.getByRole("heading", { level: 1, name: JUDUL }),
    page.getByRole("img", { name: PAPAN_CILACAP }),
    konter(page),
    konter(page).getByRole("link", { name: "Daftar sekarang" }),
  ]) {
    await expect(elemen).toBeInViewport({ ratio: 1 });
  }
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("Daftar sekarang menuju halaman daftar akun, dan tautan Masuk menuju halaman masuk", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    konter(page).getByRole("link", { name: "Masuk" }),
  ).toHaveAttribute("href", "/masuk");

  await konter(page).getByRole("link", { name: "Daftar sekarang" }).click();

  await expect(page).toHaveURL("/daftar");
  await expect(
    page.getByRole("heading", { level: 1, name: "Daftar akun" }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/^Daftar akun/);
});

test("pilihan program hanya berisi program aktif", async ({ page }) => {
  const pilihan = () =>
    konter(page).getByLabel("Program", { exact: true }).locator("option");
  await page.goto("/");
  await expect(pilihan()).toHaveText(PROGRAM_AWAL);

  await masukKePanel(page, ADMIN);
  await page.goto("/panel/program");
  await page.getByRole("button", { name: "Nonaktifkan Pelajar" }).click();
  await expect(
    page.getByRole("region", { name: "Daftar program" }).getByRole("status"),
  ).toHaveText("Pelajar sekarang nonaktif dan tidak tampil di situs publik.");

  await page.goto("/");
  await expect(pilihan()).toHaveText([
    "Tokutei Ginou (SSW)",
    "Pemagangan",
    "Gijinkoku",
  ]);

  await page.goto("/panel/program");
  await page.getByRole("button", { name: "Aktifkan kembali Pelajar" }).click();
  await expect(
    page.getByRole("region", { name: "Daftar program" }).getByRole("status"),
  ).toHaveText("Pelajar aktif kembali dan tampil lagi di situs publik.");

  await page.goto("/");
  await expect(pilihan()).toHaveText(PROGRAM_AWAL);
});
