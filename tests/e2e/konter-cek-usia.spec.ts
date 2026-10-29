import { expect, type Page, test } from "@playwright/test";
import { ADMIN, masukKePanel } from "./pegawai-uji";

// Konter cek usia di Beranda (issue T10, PRD §6.3, UAT-F3 bagian konter). Isi awal program dari issue T06: empat
// program dengan batas usia 18–30 tahun (▶ Keputusan OD-01). Teks jawaban dari docs/design/prototipe/beranda.html;
// semua jenis jawaban diuji di src/app/(publik)/konter-cek-usia.test.tsx.
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

function konter(page: Page) {
  return page.getByRole("region", { name: "Cek usiamu, lalu daftar" });
}

/**
 * Tanggal hari ini di WIB menurut jam mesin test, yang juga menjalankan server e2e. Konter membaca jam server, jadi
 * tanggal lahir di test ini dibuat relatif terhadap hari ini. Kalimat persis untuk contoh PRD §6.3 dengan "sekarang"
 * tetap ada di src/app/(publik)/konter-cek-usia.test.tsx.
 */
function hariIniWib(): Date {
  const teks = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
  return new Date(`${teks}T00:00:00Z`);
}

function hariSesudah(tanggal: Date, jumlahHari: number): Date {
  return new Date(tanggal.getTime() + jumlahHari * 24 * 60 * 60 * 1000);
}

const dua = (angka: number) => String(angka).padStart(2, "0");

/** Bulan dan hari yang sama, sejumlah tahun sebelumnya, sebagai YYYY-MM-DD. */
function tahunSebelumnya(tanggal: Date, jumlahTahun: number): string {
  return `${tanggal.getUTCFullYear() - jumlahTahun}-${dua(tanggal.getUTCMonth() + 1)}-${dua(tanggal.getUTCDate())}`;
}

function tulisDdMmYyyy(tanggal: Date): string {
  return `${dua(tanggal.getUTCDate())}-${dua(tanggal.getUTCMonth() + 1)}-${tanggal.getUTCFullYear()}`;
}

const tanggal29Februari = (tanggal: Date) =>
  tanggal.getUTCMonth() === 1 && tanggal.getUTCDate() === 29;

test("usia 17 hari ini untuk program 18–30 menampilkan usia 17 dan tanggal mulai boleh mendaftar; usia tepat 18 bisa mendaftar (UAT-F3, bagian konter)", async ({
  page,
}) => {
  await page.goto("/");
  const hariIni = hariIniWib();
  // Ulang tahun ke-18 jatuh besok, jadi hari ini usianya 17. Bila besok 29 Februari, tahun lahirnya bukan kabisat,
  // jadi ulang tahunnya digeser ke 1 Maret.
  const besok = hariSesudah(hariIni, 1);
  const ulangTahunKe18 = tanggal29Februari(besok)
    ? hariSesudah(besok, 1)
    : besok;
  // Bila hari ini 29 Februari, lahir 28 Februari 18 tahun lalu: ulang tahunnya kemarin, usianya tetap 18.
  const lahir18 = tanggal29Februari(hariIni)
    ? hariSesudah(hariIni, -1)
    : hariIni;
  const isi = konter(page);
  await isi
    .getByLabel("Program", { exact: true })
    .selectOption({ label: "Tokutei Ginou (SSW)" });
  const jawaban = isi.getByRole("status");

  await isi
    .getByLabel("Tanggal lahir")
    .fill(tahunSebelumnya(ulangTahunKe18, 18));
  await expect(jawaban).toHaveText(
    `Usiamu 17 tahun. Tokutei Ginou (SSW) menerima usia 18–30 tahun. Kamu bisa mendaftar mulai ${tulisDdMmYyyy(ulangTahunKe18)}.`,
  );

  await isi.getByLabel("Tanggal lahir").fill(tahunSebelumnya(lahir18, 18));
  await expect(jawaban).toHaveText(
    "Usiamu 18 tahun. Tokutei Ginou (SSW) menerima usia 18–30 tahun, jadi kamu bisa mendaftar.",
  );
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
