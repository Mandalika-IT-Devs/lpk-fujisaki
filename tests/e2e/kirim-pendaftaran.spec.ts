import { expect, type Page, test } from "@playwright/test";
import { tungguEmail } from "./kotak-keluar";

// Kirim formulir pendaftaran, nomor pendaftaran, dan halaman akun (issue T13, PRD §6.2–§6.6, UAT-F1 langkah 2,
// UAT-F2, UAT-F3, UAT-F4), juga draf yang tersimpan saat pengiriman ditolak (issue T13-b, UAT-F7). Pengiriman
// bersamaan, nomor yang tidak dipakai ulang, program yang dinonaktifkan (UAT-D1), dan draf yang tidak disimpan selama
// isiannya terkunci diuji dengan database sungguhan di src/server/pendaftaran.test.ts.
// Berkas ini hanya memakai program Tokutei Ginou (SSW), rentang 18–30 (▶ Keputusan OD-01), dan bidang kerja
// Pembersihan gedung, yang tidak pernah dinonaktifkan test lain. Setiap test memakai email dan nomor WhatsApp sendiri.

type CalonPeserta = {
  nama: string;
  email: string;
  nomorWhatsApp: string;
  kataSandi: string;
};

const ALAMAT_FORMULIR = "/akun/formulir-pendaftaran";
const POLA_NOMOR_PENDAFTARAN = /^FGC-\d{4}-\d{4,}$/;
const KABAR_DRAF_OTOMATIS =
  "Isianmu tetap tersimpan sebagai draf, jadi kamu bisa melanjutkannya kapan saja dari halaman akunmu.";

/** Tanggal WIB (UTC+7) hari ini ditambah sejumlah hari, sebagai {tahun, bulanHari "MM-DD"}. */
function tanggalWibHariIni(tambahHari = 0) {
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000 + tambahHari * 864e5);
  const iso = wib.toISOString().slice(0, 10);
  return { tahun: Number(iso.slice(0, 4)), bulanHari: iso.slice(5) };
}

/** Tanggal lahir YYYY-MM-DD: ulang tahun ke-`usia` jatuh hari ini (WIB) ditambah sejumlah hari. */
function tanggalLahirUlangTahunKe(usia: number, tambahHari = 0): string {
  const { tahun, bulanHari } = tanggalWibHariIni(tambahHari);
  return `${tahun - usia}-${bulanHari}`;
}

/** Membuat akun lewat formulir daftar akun; emailnya diverifikasi lewat tautan di email kecuali `verifikasi` false. */
async function buatAkun(
  page: Page,
  calon: CalonPeserta,
  { verifikasi = true } = {},
) {
  const sejak = Date.now();
  await page.goto("/daftar");
  await page.getByLabel("Nama lengkap").fill(calon.nama);
  await page.getByLabel("Email").fill(calon.email);
  await page.getByLabel("Nomor WhatsApp").fill(calon.nomorWhatsApp);
  await page.getByLabel("Kata sandi").fill(calon.kataSandi);
  await page.getByLabel(/Saya setuju data pribadi saya diproses/).check();
  await page.getByRole("button", { name: "Buat akun" }).click();
  await expect(page).toHaveURL("/akun");
  if (!verifikasi) return;

  const email = await tungguEmail(calon.email, sejak);
  const tautan = email.teks.match(/https?:\/\/\S+/)?.[0];
  if (!tautan) throw new Error("Email verifikasi tidak berisi tautan.");
  await page.goto(tautan);
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Emailmu sudah terverifikasi.",
  );
}

function formulir(page: Page) {
  return page.getByRole("form", { name: "Formulir pendaftaran" });
}

/** Mengisi semua isian formulir pendaftaran dengan tanggal lahir yang diberikan. */
async function isiSemuaIsian(page: Page, tanggalLahir: string) {
  const isian = formulir(page);
  await isian.getByLabel("Nama lengkap sesuai KTP").fill("Sari Wulandari");
  await isian.getByRole("radio", { name: "Perempuan" }).check();
  await isian.getByLabel("Tempat lahir").fill("Cilacap");
  await isian.getByLabel("Tanggal lahir").fill(tanggalLahir);
  await isian.getByLabel("Kabupaten/kota domisili").fill("Kab. Cilacap");
  await isian.getByLabel("Provinsi domisili").selectOption("Jawa Tengah");
  await isian
    .getByLabel("Pendidikan terakhir", { exact: true })
    .selectOption("SMK");
  await isian
    .getByLabel("Program", { exact: true })
    .selectOption({ label: "Tokutei Ginou (SSW)" });
  await isian
    .getByLabel("Bidang kerja yang diminati")
    .selectOption({ label: "Pembersihan gedung" });
  await isian.getByLabel("Kemampuan bahasa Jepang saat ini").selectOption("N5");
  await isian.getByLabel("Nama kontak darurat").fill("Siti Aminah");
  await isian.getByLabel("Hubungan kontak darurat").fill("Ibu");
  await isian.getByLabel("Nomor HP kontak darurat").fill("0812-3456-7890");
}

/** Nomor pendaftaran di halaman konfirmasi. */
function nomorPendaftaran(page: Page) {
  return page.getByRole("main").getByText(POLA_NOMOR_PENDAFTARAN);
}

async function kirimFormulir(page: Page) {
  await formulir(page).getByRole("button", { name: "Kirim formulir" }).click();
}

test("formulir lengkap yang dikirim mendapat nomor pendaftaran, halaman konfirmasi dengan tombol WhatsApp, lalu isiannya terkunci (UAT-F1 langkah 2)", async ({
  page,
}) => {
  await buatAkun(page, {
    nama: "Calon Kirim Uji",
    email: "calon.kirim@contoh.test",
    nomorWhatsApp: "0812-0000-1301",
    kataSandi: "sandi-calon-uji",
  });
  await page.goto("/akun");
  await page.getByRole("link", { name: "Isi formulir pendaftaran" }).click();
  await expect(page).toHaveURL(ALAMAT_FORMULIR);

  await isiSemuaIsian(page, tanggalLahirUlangTahunKe(20));
  await kirimFormulir(page);

  await expect(page).toHaveURL("/akun/konfirmasi-pendaftaran");
  await expect(
    page.getByRole("heading", { level: 1, name: "Pendaftaran terkirim" }),
  ).toBeVisible();
  const nomor = (await nomorPendaftaran(page).textContent())?.trim();
  expect(nomor).toMatch(POLA_NOMOR_PENDAFTARAN);
  expect(nomor).toContain(`FGC-${tanggalWibHariIni().tahun}-`);
  await expect(page.getByRole("link", { name: "Chat WhatsApp" })).toBeVisible();

  // Halaman akun menampilkan nomor, program, status Berjalan, dan tahap 1.
  await page.getByRole("link", { name: "Buka akunmu" }).click();
  await expect(page).toHaveURL("/akun");
  const kartu = page.getByRole("region", { name: "Pendaftaranmu" });
  await expect(kartu).toContainText(nomor ?? "");
  await expect(kartu).toContainText("Tokutei Ginou (SSW)");
  await expect(kartu).toContainText("Berjalan");
  await expect(kartu).toContainText("FG 01");
  await expect(kartu).toContainText("Pendaftaran dan seleksi");
  await expect(
    page.getByRole("link", { name: "Isi formulir pendaftaran" }),
  ).toHaveCount(0);

  // Isian terkunci: formulir tidak bisa dibuka lagi untuk diubah.
  await page.goto(ALAMAT_FORMULIR);
  await expect(page).toHaveURL("/akun");
});

test("akun yang belum terverifikasi bisa menyimpan draf tetapi tidak bisa mengirim (UAT-F2)", async ({
  page,
}) => {
  const calon = {
    nama: "Calon Belum Verifikasi Uji",
    email: "calon.belum.verifikasi@contoh.test",
    nomorWhatsApp: "0812-0000-1302",
    kataSandi: "sandi-calon-uji",
  };
  await buatAkun(page, calon, { verifikasi: false });
  await page.goto(ALAMAT_FORMULIR);

  await isiSemuaIsian(page, tanggalLahirUlangTahunKe(20));
  await formulir(page).getByRole("button", { name: "Simpan draf" }).click();
  await expect(formulir(page).getByRole("status")).toHaveText(
    "Draf tersimpan. Kamu bisa melanjutkannya kapan saja dari halaman akunmu.",
  );

  await kirimFormulir(page);
  await expect(formulir(page).getByRole("alert")).toHaveText(
    `Formulir belum terkirim karena emailmu belum terverifikasi. Buka tautan verifikasi yang kami kirim ke ${calon.email}, atau minta tautan baru di halaman akunmu, lalu kirim lagi.`,
  );
  await expect(page).toHaveURL(ALAMAT_FORMULIR);
  await page.goto("/akun");
  await expect(page.getByRole("region", { name: "Pendaftaranmu" })).toHaveCount(
    0,
  );
});

test("usia 17 tahun ditolak dengan pesan yang menyebut usia dan rentang program, lalu usia tepat 18 tahun diterima (UAT-F3)", async ({
  page,
}) => {
  await buatAkun(page, {
    nama: "Calon Usia Uji",
    email: "calon.usia@contoh.test",
    nomorWhatsApp: "0812-0000-1303",
    kataSandi: "sandi-calon-uji",
  });
  await page.goto(ALAMAT_FORMULIR);

  // Ulang tahun ke-18 jatuh besok, jadi hari ini usianya 17 tahun.
  await isiSemuaIsian(page, tanggalLahirUlangTahunKe(18, 1));
  await kirimFormulir(page);
  const peringatan = formulir(page).getByRole("alert");
  await expect(peringatan).toContainText("usiamu 17 tahun");
  await expect(peringatan).toContainText(
    "Tokutei Ginou (SSW) menerima usia 18–30 tahun",
  );
  await expect(page).toHaveURL(ALAMAT_FORMULIR);
  // Pengiriman yang ditolak karena usia menyimpan isiannya sebagai draf (PRD §6.2 ▶ Keputusan 2026-10-30).
  await expect(formulir(page).getByRole("status")).toHaveText(
    KABAR_DRAF_OTOMATIS,
  );
  await page.reload();
  await expect(formulir(page).getByLabel("Tanggal lahir")).toHaveValue(
    tanggalLahirUlangTahunKe(18, 1),
  );
  await expect(
    formulir(page).getByLabel("Nama lengkap sesuai KTP"),
  ).toHaveValue("Sari Wulandari");

  // Ulang tahun ke-18 jatuh hari ini.
  await formulir(page)
    .getByLabel("Tanggal lahir")
    .fill(tanggalLahirUlangTahunKe(18));
  await kirimFormulir(page);
  await expect(page).toHaveURL("/akun/konfirmasi-pendaftaran");
  await expect(nomorPendaftaran(page)).toBeVisible();
});

test("formulir kedua yang dikirim saat masih ada pendaftaran Berjalan ditolak (UAT-F4)", async ({
  page,
  context,
}) => {
  await buatAkun(page, {
    nama: "Calon Dua Kali Uji",
    email: "calon.dua.kali@contoh.test",
    nomorWhatsApp: "0812-0000-1304",
    kataSandi: "sandi-calon-uji",
  });
  // Formulir yang sama sudah terbuka di tab kedua sebelum formulir pertama dikirim.
  await page.goto(ALAMAT_FORMULIR);
  const tabKedua = await context.newPage();
  await tabKedua.goto(ALAMAT_FORMULIR);

  await isiSemuaIsian(page, tanggalLahirUlangTahunKe(20));
  await kirimFormulir(page);
  await expect(page).toHaveURL("/akun/konfirmasi-pendaftaran");
  const nomor = (await nomorPendaftaran(page).textContent())?.trim();

  await isiSemuaIsian(tabKedua, tanggalLahirUlangTahunKe(20));
  await kirimFormulir(tabKedua);
  await expect(formulir(tabKedua).getByRole("alert")).toHaveText(
    `Formulir belum terkirim karena kamu masih punya pendaftaran yang sedang berjalan, ${nomor}. Satu akun hanya boleh punya satu pendaftaran yang sedang berjalan; lihat pendaftaranmu di halaman akun.`,
  );
  await expect(tabKedua).toHaveURL(ALAMAT_FORMULIR);
  // Isiannya terkunci (PRD §6.5), jadi isian tab kedua tidak disimpan sebagai draf.
  await expect(formulir(tabKedua).getByRole("status")).toHaveCount(0);
});

test("formulir yang isian wajibnya belum diisi ditolak, dan setiap isian wajib yang kosong ditandai", async ({
  page,
}) => {
  await buatAkun(page, {
    nama: "Calon Isian Kosong Uji",
    email: "calon.isian.kosong@contoh.test",
    nomorWhatsApp: "0812-0000-1305",
    kataSandi: "sandi-calon-uji",
  });
  await page.goto(ALAMAT_FORMULIR);
  const isian = formulir(page);
  await isian.getByLabel("Nama lengkap sesuai KTP").fill("Sari Wulandari");

  await kirimFormulir(page);

  await expect(isian.getByRole("alert")).toHaveText(
    "Formulir belum terkirim karena isian wajib berikut belum diisi: Jenis kelamin, Tempat lahir, Tanggal lahir, Kabupaten/kota domisili, Provinsi domisili, Pendidikan terakhir, Program, Bidang kerja yang diminati, Kemampuan bahasa Jepang saat ini, Nama kontak darurat, Hubungan kontak darurat, Nomor HP kontak darurat. Isi isian yang ditandai, lalu kirim lagi.",
  );
  await expect(isian.getByLabel("Tempat lahir")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(isian.getByLabel("Program", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(isian.getByLabel("Nama lengkap sesuai KTP")).not.toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(
    isian.getByLabel("Jurusan pendidikan terakhir"),
  ).not.toHaveAttribute("aria-invalid", "true");
  await expect(isian.getByLabel("Nama lengkap sesuai KTP")).toHaveValue(
    "Sari Wulandari",
  );
});

test("pengiriman yang ditolak karena email belum terverifikasi menyimpan isiannya sebagai draf, juga sesudah keluar dan masuk lagi (UAT-F7)", async ({
  page,
}) => {
  const calon = {
    nama: "Calon Draf Otomatis Uji",
    email: "calon.draf.otomatis@contoh.test",
    nomorWhatsApp: "0812-0000-1306",
    kataSandi: "sandi-calon-uji",
  };
  await buatAkun(page, calon, { verifikasi: false });
  await page.goto(ALAMAT_FORMULIR);

  // Tanpa menekan "Simpan draf".
  const tanggalLahir = tanggalLahirUlangTahunKe(20);
  await isiSemuaIsian(page, tanggalLahir);
  await kirimFormulir(page);

  await expect(formulir(page).getByRole("alert")).toHaveText(
    `Formulir belum terkirim karena emailmu belum terverifikasi. Buka tautan verifikasi yang kami kirim ke ${calon.email}, atau minta tautan baru di halaman akunmu, lalu kirim lagi.`,
  );
  await expect(formulir(page).getByRole("status")).toHaveText(
    KABAR_DRAF_OTOMATIS,
  );

  await page.getByRole("link", { name: "Kembali ke akunmu" }).click();
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL("/masuk");
  await page.getByLabel("Email").fill(calon.email);
  await page.getByLabel("Kata sandi").fill(calon.kataSandi);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL("/akun");
  await page.getByRole("link", { name: "Isi formulir pendaftaran" }).click();

  const isian = formulir(page);
  await expect(isian.getByLabel("Nama lengkap sesuai KTP")).toHaveValue(
    "Sari Wulandari",
  );
  await expect(isian.getByRole("radio", { name: "Perempuan" })).toBeChecked();
  await expect(isian.getByLabel("Tempat lahir")).toHaveValue("Cilacap");
  await expect(isian.getByLabel("Tanggal lahir")).toHaveValue(tanggalLahir);
  await expect(isian.getByLabel("Kabupaten/kota domisili")).toHaveValue(
    "Kab. Cilacap",
  );
  await expect(isian.getByLabel("Provinsi domisili")).toHaveValue(
    "Jawa Tengah",
  );
  await expect(
    isian.getByLabel("Pendidikan terakhir", { exact: true }),
  ).toHaveValue("SMK");
  await expect(
    isian.getByLabel("Program", { exact: true }).locator("option:checked"),
  ).toHaveText("Tokutei Ginou (SSW)");
  await expect(
    isian.getByLabel("Bidang kerja yang diminati").locator("option:checked"),
  ).toHaveText("Pembersihan gedung");
  await expect(
    isian.getByLabel("Kemampuan bahasa Jepang saat ini"),
  ).toHaveValue("N5");
  await expect(isian.getByLabel("Nama kontak darurat")).toHaveValue(
    "Siti Aminah",
  );
  await expect(isian.getByLabel("Hubungan kontak darurat")).toHaveValue("Ibu");
  // Nomor HP disimpan dalam bentuk ternormalisasi (PRD §5.2).
  await expect(isian.getByLabel("Nomor HP kontak darurat")).toHaveValue(
    "6281234567890",
  );
});

test("pengiriman yang ditolak karena ada isian berbentuk salah tidak menyimpan draf, dan isian itu ditandai salah (PRD §6.2 ▶ Keputusan 2026-10-30)", async ({
  page,
}) => {
  await buatAkun(page, {
    nama: "Calon Bentuk Salah Uji",
    email: "calon.bentuk.salah@contoh.test",
    nomorWhatsApp: "0812-0000-1307",
    kataSandi: "sandi-calon-uji",
  });
  await page.goto(ALAMAT_FORMULIR);

  await isiSemuaIsian(page, tanggalLahirUlangTahunKe(20));
  const nomorHp = formulir(page).getByLabel("Nomor HP kontak darurat");
  await nomorHp.fill("081234567");
  await kirimFormulir(page);

  await expect(formulir(page).getByRole("alert")).toHaveText(
    "Formulir belum terkirim karena isian berikut belum benar: Nomor HP kontak darurat. Perbaiki isian yang ditandai, lalu kirim lagi.",
  );
  await expect(nomorHp).toHaveAttribute("aria-invalid", "true");
  await expect(
    formulir(page).getByLabel("Nama kontak darurat"),
  ).not.toHaveAttribute("aria-invalid", "true");
  await expect(formulir(page).getByRole("status")).toHaveCount(0);
  // Yang diketik tetap di layar, supaya bisa diperbaiki.
  await expect(nomorHp).toHaveValue("081234567");
  await expect(
    formulir(page).getByLabel("Nama lengkap sesuai KTP"),
  ).toHaveValue("Sari Wulandari");

  // Tidak ada draf: formulir yang dibuka lagi masih kosong.
  await page.reload();
  await expect(
    formulir(page).getByLabel("Nama lengkap sesuai KTP"),
  ).toHaveValue("");
  await expect(
    formulir(page).getByLabel("Nomor HP kontak darurat"),
  ).toHaveValue("");
});
