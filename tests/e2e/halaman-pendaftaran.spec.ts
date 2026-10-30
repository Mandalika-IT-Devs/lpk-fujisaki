import { expect, type Locator, type Page, test } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import postgres from "postgres";
import { KODE_LANGKAH } from "../../src/domain/pendaftaran";
import { ADMIN, masukKePanel, STAF } from "./pegawai-uji";

// Halaman pendaftaran dan ubah isian oleh pegawai (issue T15, PRD §6.5, §11.2 bagian isian formulir, UAT-F6), termasuk
// peringatan batas usia saat tanggal lahir atau program diubah (issue T15-b, UAT-K6).
// Pendaftaran uji diisi langsung ke database test, masing-masing dengan akun pemiliknya yang bisa masuk. Semuanya
// dikirim pada 2024, jadi nomornya (FGC-2024-…) tidak bertabrakan dengan nomor test lain. Setiap test memakai
// pendaftarannya sendiri, karena test bisa berjalan bersamaan.

type PendaftaranUji = {
  nomor: string;
  namaLengkap: string;
  email: string;
  nomorWhatsApp: string;
  kabupatenKota: string;
};

const KATA_SANDI = "sandi-calon-uji";

const RINA: PendaftaranUji = {
  nomor: "FGC-2024-0101",
  namaLengkap: "Rina Kartika",
  email: "halaman.uji.rina@contoh.test",
  nomorWhatsApp: "6281200002501",
  kabupatenKota: "Kab. Cilacap",
};
const WATI: PendaftaranUji = {
  nomor: "FGC-2024-0102",
  namaLengkap: "Wati Susanti",
  email: "halaman.uji.wati@contoh.test",
  nomorWhatsApp: "6281200002502",
  kabupatenKota: "Kab. Banyumas",
};
const YANTI: PendaftaranUji = {
  nomor: "FGC-2024-0103",
  namaLengkap: "Yanti Lestari",
  email: "halaman.uji.yanti@contoh.test",
  nomorWhatsApp: "6281200002503",
  kabupatenKota: "Kab. Kebumen",
};
const DEWI: PendaftaranUji = {
  nomor: "FGC-2024-0104",
  namaLengkap: "Dewi Anggraini",
  email: "halaman.uji.dewi@contoh.test",
  nomorWhatsApp: "6281200002504",
  kabupatenKota: "Kab. Purworejo",
};

/** Status langkah pendaftaran uji yang berbeda dari Belum, supaya ketiga status langkah (PRD §7.2) tampil. */
const LANGKAH_BUKAN_BELUM: Record<string, string> = {
  "L1.1": "Selesai",
  "L1.5": "Tidak berlaku",
};

/** Mengisi pendaftaran uji di tahap 1 beserta 22 langkahnya. Aman diulang bila test dicoba lagi. */
async function isiPendaftaranUji() {
  const sql = postgres(process.env.DATABASE_URL ?? "", { onnotice: () => {} });
  try {
    await sql`delete from akun where email like 'halaman.uji.%@contoh.test'`;
    const hash = await hashPassword(KATA_SANDI);
    for (const uji of [RINA, WATI, YANTI, DEWI]) {
      const [{ id: akunId }] = await sql<{ id: string }[]>`
        insert into akun (name, email, email_verified, jenis, nomor_whatsapp, waktu_persetujuan)
        values (${uji.namaLengkap}, ${uji.email}, true, 'pemilik_akun', ${uji.nomorWhatsApp}, now())
        returning id`;
      await sql`
        insert into kredensial (account_id, provider_id, user_id, password)
        values (${akunId}, 'credential', ${akunId}, ${hash})`;
      const [{ id: pendaftaranId }] = await sql<{ id: string }[]>`
        insert into pendaftaran (akun_id, nomor, dikirim_pada, status, tahap, nama_lengkap, jenis_kelamin, tempat_lahir,
          tanggal_lahir, kabupaten_kota, provinsi, pendidikan_terakhir, program_id, bidang_kerja_id,
          bidang_kerja_belum_tahu, kemampuan_bahasa_jepang, nama_kontak_darurat, hubungan_kontak_darurat,
          nomor_hp_kontak_darurat)
        values (${akunId}, ${uji.nomor}, '2024-05-20T03:00:00Z', 'Berjalan', 1, ${uji.namaLengkap},
          'Perempuan', 'Cilacap', '2004-05-17', ${uji.kabupatenKota}, 'Jawa Tengah', 'SMK',
          (select id from program where nama = 'Tokutei Ginou (SSW)'),
          (select id from bidang_kerja where nama = 'Pembersihan gedung'),
          false, 'N5', 'Kontak Darurat Uji', 'Ibu', '6281234567890')
        returning id`;
      for (const kode of KODE_LANGKAH) {
        await sql`
          insert into langkah_pendaftaran (pendaftaran_id, kode, status)
          values (${pendaftaranId}, ${kode}, ${LANGKAH_BUKAN_BELUM[kode] ?? "Belum"})`;
      }
    }
  } finally {
    await sql.end();
  }
}

test.beforeAll(isiPendaftaranUji);

const PESAN_NOMOR_HP_TIDAK_SAH =
  "Nomor HP kontak darurat belum benar. Isi nomor HP Indonesia 10 sampai 13 digit yang diawali 08 atau +62 8, misalnya 0812-3456-7890. Nomor luar negeri dan nomor telepon rumah tidak diterima.";

const alamat = (uji: PendaftaranUji) => `/panel/pendaftaran/${uji.nomor}`;

/** Teks sebagai pola yang cocok persis di dalam teks lain, misalnya di keterangan isian. */
const polaTeks = (teks: string) =>
  new RegExp(teks.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

function formulirIsian(page: Page) {
  return page.getByRole("form", { name: "Isian formulir pendaftaran" });
}

async function simpanPerubahan(page: Page) {
  await formulirIsian(page)
    .getByRole("button", { name: "Simpan perubahan" })
    .click();
}

/** Masuk sebagai pemilik akun sebuah pendaftaran uji, lalu menunggu halaman akunnya terbuka. */
async function masukSebagaiPemilikAkun(page: Page, uji: PendaftaranUji) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(uji.email);
  await page.getByLabel("Kata sandi").fill(KATA_SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL("/akun");
}

/** Pendaftaran seperti yang dilihat pemilik akun di halaman akunnya. */
function pendaftaranDiAkun(page: Page) {
  return page.getByRole("region", { name: "Pendaftaranmu" });
}

/**
 * Semua isian formulir yang akan terkirim, termasuk isian tersimpan Server Action dari formulir yang dirender server
 * ($ACTION_…). Dengan isian ini, test mengirim permintaan langsung ke server tanpa melewati halaman.
 */
async function isianTerkirim(
  formulir: Locator,
): Promise<Record<string, string>> {
  return formulir.evaluate((f) =>
    Object.fromEntries(
      [...new FormData(f as HTMLFormElement)].map(([nama, nilai]) => [
        nama,
        String(nilai),
      ]),
    ),
  );
}

test("Staf membuka pendaftaran dari daftar, mengubah kabupaten/kota, lalu perubahannya tersimpan dan terlihat oleh pemilik akun (UAT-F6)", async ({
  page,
  browser,
}) => {
  await masukKePanel(page, STAF);
  await page.getByLabel("Cari nama atau nomor pendaftaran").fill(RINA.nomor);
  await page.getByRole("button", { name: "Terapkan" }).click();
  await page
    .getByRole("table", { name: "Daftar pendaftaran" })
    .getByRole("link", { name: RINA.nomor })
    .click();

  await expect(page).toHaveURL(alamat(RINA));
  await expect(
    page.getByRole("heading", { level: 1, name: RINA.nomor }),
  ).toBeVisible();
  const ringkasan = page.getByRole("region", { name: "Ringkasan pendaftaran" });
  await expect(ringkasan).toContainText(RINA.namaLengkap);
  await expect(ringkasan).toContainText("Tokutei Ginou (SSW)");
  await expect(ringkasan).toContainText("Berjalan");
  await expect(ringkasan).toContainText("FG 01");
  await expect(ringkasan).toContainText("Pendaftaran dan seleksi");

  // Langkah tahap 1 beserta statusnya, hanya untuk dibaca.
  const langkah = page.getByRole("region", { name: "Langkah tahap 1" });
  await expect(langkah.getByRole("listitem")).toHaveText([
    /L1\.1.*Berkas pendaftaran diterima.*Selesai/,
    /L1\.2.*Pemeriksaan fisik.*Belum/,
    /L1\.3.*Psikotes.*Belum/,
    /L1\.4.*Tes matematika.*Belum/,
    /L1\.5.*Pra-MCU.*Tidak berlaku/,
  ]);
  await expect(langkah.getByRole("button")).toHaveCount(0);
  await expect(langkah.getByRole("textbox")).toHaveCount(0);
  await expect(langkah.getByRole("combobox")).toHaveCount(0);

  const isian = formulirIsian(page);
  const kabupatenKota = isian.getByLabel("Kabupaten/kota domisili");
  await expect(kabupatenKota).toHaveValue(RINA.kabupatenKota);
  await expect(isian.getByLabel("Nama lengkap sesuai KTP")).toHaveValue(
    RINA.namaLengkap,
  );
  await expect(
    isian.getByLabel("Program", { exact: true }).locator("option:checked"),
  ).toHaveText("Tokutei Ginou (SSW)");

  await kabupatenKota.fill("Kota Semarang");
  await simpanPerubahan(page);

  await expect(isian.getByRole("status")).toHaveText(
    `Perubahan isian formulir ${RINA.nomor} sudah disimpan dan terlihat oleh pemilik akunnya.`,
  );
  await page.reload();
  await expect(kabupatenKota).toHaveValue("Kota Semarang");
  await expect(
    isian.getByLabel("Program", { exact: true }).locator("option:checked"),
  ).toHaveText("Tokutei Ginou (SSW)");
  await expect(
    isian.getByLabel("Bidang kerja yang diminati").locator("option:checked"),
  ).toHaveText("Pembersihan gedung");

  // Pemilik akun melihat perubahannya di halaman akunnya.
  const konteksPemilik = await browser.newContext();
  const pemilik = await konteksPemilik.newPage();
  await masukSebagaiPemilikAkun(pemilik, RINA);
  const diAkun = pendaftaranDiAkun(pemilik);
  await expect(diAkun).toContainText(RINA.nomor);
  await expect(diAkun).toContainText("Kota Semarang");
  await expect(diAkun).not.toContainText(RINA.kabupatenKota);
  await konteksPemilik.close();
});

test("isian tidak sah dari pegawai ditolak dengan pesan yang sama seperti di formulir pemilik akun, dan isian tersimpan tidak berubah", async ({
  page,
}) => {
  // Admin juga bisa melakukan semua tugas Staf (PRD §2.2).
  await masukKePanel(page, ADMIN);
  await page.goto(alamat(WATI));
  const isian = formulirIsian(page);
  const nomorHp = isian.getByLabel("Nomor HP kontak darurat");
  const kabupatenKota = isian.getByLabel("Kabupaten/kota domisili");

  // Bentuk isian salah: pesan yang sama seperti di formulir pemilik akun (PRD §5.2).
  await nomorHp.fill("021-555-1234");
  await simpanPerubahan(page);

  await expect(nomorHp).toHaveAttribute("aria-invalid", "true");
  await expect(nomorHp).toHaveAccessibleDescription(
    polaTeks(PESAN_NOMOR_HP_TIDAK_SAH),
  );
  await expect(isian.getByRole("alert")).toHaveText(
    "Perubahan belum disimpan karena isian berikut belum benar: Nomor HP kontak darurat. Perbaiki isian yang ditandai, lalu simpan lagi.",
  );
  await expect(nomorHp).toHaveValue("021-555-1234");

  // Isian wajib dikosongkan: pendaftaran yang sudah dikirim tetap mewajibkannya (PRD §6.1).
  await nomorHp.fill("0812-3456-7890");
  await kabupatenKota.fill("");
  await simpanPerubahan(page);

  await expect(kabupatenKota).toHaveAttribute("aria-invalid", "true");
  await expect(kabupatenKota).toHaveAccessibleDescription(
    polaTeks(
      "Kabupaten/kota domisili belum diisi. Isian ini wajib diisi sebelum formulir dikirim.",
    ),
  );
  await expect(nomorHp).not.toHaveAttribute("aria-invalid", "true");
  await expect(isian.getByRole("alert")).toHaveText(
    "Perubahan belum disimpan karena isian wajib berikut belum diisi: Kabupaten/kota domisili. Isi isian yang ditandai, lalu simpan lagi.",
  );

  // Tanggal lahir sesudah hari ini: pesan yang sama seperti di formulir pemilik akun (PRD §6.3).
  const tanggalLahir = isian.getByLabel("Tanggal lahir");
  await kabupatenKota.fill("Kab. Purworejo");
  await tanggalLahir.fill("2099-12-31");
  await simpanPerubahan(page);

  await expect(tanggalLahir).toHaveAttribute("aria-invalid", "true");
  await expect(tanggalLahir).toHaveAccessibleDescription(
    polaTeks(
      "Tanggal lahir jatuh sesudah hari ini. Periksa lagi tanggal lahirmu.",
    ),
  );
  await expect(kabupatenKota).not.toHaveAttribute("aria-invalid", "true");
  await expect(isian.getByRole("alert")).toHaveText(
    "Perubahan belum disimpan karena tanggal lahir jatuh sesudah hari ini. Periksa lagi tanggal lahirnya, lalu simpan lagi.",
  );
  await expect(tanggalLahir).toHaveValue("2099-12-31");

  await page.reload();
  await expect(kabupatenKota).toHaveValue(WATI.kabupatenKota);
  await expect(nomorHp).toHaveValue("6281234567890");
  await expect(tanggalLahir).toHaveValue("2004-05-17");
});

test("Staf mengubah tanggal lahir sehingga usia pada tanggal kirim di luar rentang program: perubahan tersimpan, dengan peringatan usia dan rentangnya (UAT-K6)", async ({
  page,
}) => {
  // Pendaftaran uji Tokutei Ginou (SSW), 18–30 tahun, dikirim 20-05-2024 dengan tanggal lahir 17-05-2004 (usia 20).
  await masukKePanel(page, STAF);
  await page.goto(alamat(DEWI));
  const isian = formulirIsian(page);
  const tanggalLahir = isian.getByLabel("Tanggal lahir");
  const kabupatenKota = isian.getByLabel("Kabupaten/kota domisili");
  const kabar = isian.getByRole("status");
  const peringatan = isian.getByRole("alert");
  const KABAR_TERSIMPAN = `Perubahan isian formulir ${DEWI.nomor} sudah disimpan dan terlihat oleh pemilik akunnya.`;

  // Usia 17 pada tanggal kirim, meski hari ini sudah lebih dari 18.
  await tanggalLahir.fill("2006-05-21");
  await simpanPerubahan(page);

  await expect(kabar).toHaveText(KABAR_TERSIMPAN);
  await expect(peringatan).toHaveText(
    "Perubahan tetap disimpan, tetapi usianya 17 tahun pada tanggal kirim 20-05-2024, di luar batas usia Tokutei Ginou (SSW), yaitu 18–30 tahun. Periksa lagi tanggal lahir dan programnya; bila keduanya sudah benar, perubahan ini boleh dibiarkan.",
  );
  await expect(tanggalLahir).not.toHaveAttribute("aria-invalid", "true");

  // Isian lain diubah tanpa mengubah tanggal lahir atau program: tanpa peringatan, meski usia tersimpan di luar rentang.
  await kabupatenKota.fill("Kab. Wonosobo");
  await simpanPerubahan(page);

  await expect(peringatan).toHaveCount(0);
  await expect(kabar).toHaveText(KABAR_TERSIMPAN);

  // Usia 31 pada tanggal kirim.
  await tanggalLahir.fill("1993-05-20");
  await simpanPerubahan(page);

  await expect(peringatan).toHaveText(
    /usianya 31 tahun pada tanggal kirim 20-05-2024, di luar batas usia Tokutei Ginou \(SSW\), yaitu 18–30 tahun/,
  );

  // Usia 18 pada tanggal kirim, di dalam rentang: tanpa peringatan.
  await tanggalLahir.fill("2006-05-20");
  await simpanPerubahan(page);

  await expect(peringatan).toHaveCount(0);
  await expect(kabar).toHaveText(KABAR_TERSIMPAN);

  await page.reload();
  await expect(tanggalLahir).toHaveValue("2006-05-20");
  await expect(kabupatenKota).toHaveValue("Kab. Wonosobo");
});

test("pemilik akun tidak bisa mengubah isian yang sudah dikirim, juga lewat permintaan langsung ke server", async ({
  browser,
}) => {
  // Staf membuka halaman pendaftaran tanpa JavaScript, jadi formulirnya memuat isian Server Action dari server.
  const konteksStaf = await browser.newContext({ javaScriptEnabled: false });
  const staf = await konteksStaf.newPage();
  await masukKePanel(staf, STAF);
  await staf.goto(alamat(YANTI));
  const isian = await isianTerkirim(formulirIsian(staf));
  expect(isian.kabupatenKota).toBe(YANTI.kabupatenKota);
  // Keadaan Server Action di isian tersembunyi tidak memuat isian pendaftaran; isiannya hanya ada di isian formulir.
  const tersembunyi = await formulirIsian(staf)
    .locator('input[type="hidden"]')
    .evaluateAll((daftar) =>
      daftar.map((i) => i.getAttribute("value") ?? "").join("\n"),
    );
  expect(tersembunyi).toContain(YANTI.nomor);
  expect(tersembunyi).not.toContain(YANTI.kabupatenKota);
  expect(tersembunyi).not.toContain(YANTI.namaLengkap);

  const konteksPemilik = await browser.newContext();
  const pemilik = await konteksPemilik.newPage();
  await masukSebagaiPemilikAkun(pemilik, YANTI);

  // Formulir pendaftarannya sendiri tidak bisa dibuka lagi, dan halaman pendaftaran di panel pegawai ditolak.
  await pemilik.goto("/akun/formulir-pendaftaran");
  await expect(pemilik).toHaveURL("/akun");
  await pemilik.goto(alamat(YANTI));
  await expect(pemilik).toHaveURL("/panel/masuk");
  await expect(formulirIsian(pemilik)).toHaveCount(0);

  // Permintaan langsung ke Server Action pegawai, dengan isian yang sama, ditolak dan tidak mengubah apa pun.
  const jawaban = await pemilik.request.post(alamat(YANTI), {
    multipart: { ...isian, kabupatenKota: "Diubah Pemilik Akun" },
    maxRedirects: 0,
  });
  expect(jawaban.ok(), "ubah isian langsung oleh pemilik akun").toBe(false);
  await pemilik.goto("/akun");
  await expect(pendaftaranDiAkun(pemilik)).toContainText(YANTI.kabupatenKota);
  await expect(pendaftaranDiAkun(pemilik)).not.toContainText(
    "Diubah Pemilik Akun",
  );

  // Pembanding: permintaan langsung yang sama dari Staf diterima, jadi penolakan di atas memang karena kewenangan.
  const jawabanStaf = await staf.request.post(alamat(YANTI), {
    multipart: { ...isian, kabupatenKota: "Kab. Purbalingga" },
  });
  expect(jawabanStaf.status()).toBe(200);
  await pemilik.reload();
  await expect(pendaftaranDiAkun(pemilik)).toContainText("Kab. Purbalingga");

  await konteksStaf.close();
  await konteksPemilik.close();
});

test("nomor pendaftaran yang tidak ada menampilkan halaman tidak ditemukan", async ({
  page,
}) => {
  await masukKePanel(page, STAF);

  const jawaban = await page.goto("/panel/pendaftaran/FGC-1999-0001");

  expect(jawaban?.status()).toBe(404);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Pendaftaran tidak ditemukan",
    }),
  ).toBeVisible();
});

test("pengunjung tidak bisa membuka halaman pendaftaran", async ({ page }) => {
  await page.goto(alamat(RINA));

  await expect(page).toHaveURL("/panel/masuk");
  await expect(page.getByText(RINA.namaLengkap)).toHaveCount(0);
});

test("halaman pendaftaran tidak bergulir ke samping di lebar 375 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await masukKePanel(page, STAF);
  await page.goto(alamat(RINA));
  await expect(formulirIsian(page)).toBeVisible();

  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
});
