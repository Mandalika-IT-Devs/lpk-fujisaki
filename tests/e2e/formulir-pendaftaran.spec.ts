import { expect, type Page, test } from "@playwright/test";
import postgres from "postgres";

// Formulir pendaftaran dan draf (issue T12, PRD §6.1, §6.2, §12.2, UAT-F1 langkah 1, UAT-L1 bagian formulir).
// Isi awal program dan bidang kerja dari issue T06. Berkas ini berjalan sesudah test lain (playwright.config.ts),
// karena salah satu test menambah program dan bidang kerja nonaktif. Test konter cek usia menonaktifkan Pelajar
// sebentar, jadi berkas ini hanya mengandalkan Tokutei Ginou (SSW) dan Pembersihan gedung, yang tidak pernah
// dinonaktifkan.
// Setiap test memakai email dan nomor WhatsApp sendiri, karena keduanya hanya boleh dipakai satu akun.

type CalonPeserta = {
  nama: string;
  email: string;
  nomorWhatsApp: string;
  kataSandi: string;
};

const ALAMAT_FORMULIR = "/akun/formulir-pendaftaran";

const PESAN_NOMOR_HP_TIDAK_SAH =
  "Nomor HP kontak darurat belum benar. Isi nomor HP Indonesia 10 sampai 13 digit yang diawali 08 atau +62 8, misalnya 0812-3456-7890. Nomor luar negeri dan nomor telepon rumah tidak diterima.";
const KABAR_DRAF_TERSIMPAN =
  "Draf tersimpan. Kamu bisa melanjutkannya kapan saja dari halaman akunmu.";

/** Membuat akun lewat formulir daftar akun, lalu membuka formulir pendaftaran dari halaman akun. */
async function buatAkunLaluBukaFormulir(page: Page, calon: CalonPeserta) {
  await page.goto("/daftar");
  await page.getByLabel("Nama lengkap").fill(calon.nama);
  await page.getByLabel("Email").fill(calon.email);
  await page.getByLabel("Nomor WhatsApp").fill(calon.nomorWhatsApp);
  await page.getByLabel("Kata sandi").fill(calon.kataSandi);
  await page.getByLabel(/Saya setuju data pribadi saya diproses/).check();
  await page.getByRole("button", { name: "Buat akun" }).click();
  await expect(page).toHaveURL("/akun");
  await page.getByRole("link", { name: "Isi formulir pendaftaran" }).click();
  await expect(page).toHaveURL(ALAMAT_FORMULIR);
  await expect(
    page.getByRole("heading", { level: 1, name: "Formulir pendaftaran" }),
  ).toBeVisible();
}

function formulir(page: Page) {
  return page.getByRole("form", { name: "Formulir pendaftaran" });
}

async function simpanDraf(page: Page) {
  await formulir(page).getByRole("button", { name: "Simpan draf" }).click();
}

/** Teks pilihan sebuah isian pilihan, tanpa pilihan kosong "Pilih salah satu". */
async function teksPilihan(page: Page, label: string) {
  return formulir(page)
    .getByLabel(label, { exact: true })
    .locator("option:not([value=''])")
    .allTextContents();
}

/** Isian teks dan tanggal (label → nilai) untuk test yang mengisi semua isian. */
const ISIAN_TEKS = {
  "Nama lengkap sesuai KTP": "Sari Wulandari",
  "Tempat lahir": "Cilacap",
  "Tanggal lahir": "2004-02-29",
  "Kabupaten/kota domisili": "Kab. Cilacap",
  "Jurusan pendidikan terakhir": "Tata Boga",
  "Pengalaman kerja": "Dua tahun di rumah makan",
  "Nama kontak darurat": "Siti Aminah",
  "Hubungan kontak darurat": "Ibu",
};

/** Isian pilihan (label → teks pilihan) untuk test yang mengisi semua isian. */
const ISIAN_PILIHAN = {
  "Provinsi domisili": "Jawa Tengah",
  "Pendidikan terakhir": "SMK",
  Program: "Tokutei Ginou (SSW)",
  "Bidang kerja yang diminati": "Pembersihan gedung",
  "Kemampuan bahasa Jepang saat ini": "N5",
};

/** Mengisi semua isian formulir, dengan nomor HP kontak darurat yang diberikan. */
async function isiSemuaIsian(page: Page, nomorHp: string) {
  const isian = formulir(page);
  for (const [label, nilai] of Object.entries(ISIAN_TEKS)) {
    await isian.getByLabel(label).fill(nilai);
  }
  await isian.getByRole("radio", { name: "Perempuan" }).check();
  for (const [label, teks] of Object.entries(ISIAN_PILIHAN)) {
    await isian
      .getByLabel(label, { exact: true })
      .selectOption({ label: teks });
  }
  await isian.getByLabel("Nomor HP kontak darurat").fill(nomorHp);
}

/** Semua isian selain nomor HP kontak darurat masih berisi nilai dari isiSemuaIsian. */
async function periksaSemuaIsianTetap(page: Page) {
  const isian = formulir(page);
  for (const [label, nilai] of Object.entries(ISIAN_TEKS)) {
    await expect(isian.getByLabel(label)).toHaveValue(nilai);
  }
  await expect(isian.getByRole("radio", { name: "Perempuan" })).toBeChecked();
  for (const [label, teks] of Object.entries(ISIAN_PILIHAN)) {
    await expect(
      isian.getByLabel(label, { exact: true }).locator("option:checked"),
    ).toHaveText(teks);
  }
}

test("draf yang sebagian terisi tetap ada setelah keluar lalu masuk lagi (UAT-F1 langkah 1)", async ({
  page,
}) => {
  const calon: CalonPeserta = {
    nama: "Calon Draf Uji",
    email: "calon.draf@contoh.test",
    nomorWhatsApp: "0812-0000-1201",
    kataSandi: "sandi-calon-uji",
  };
  await buatAkunLaluBukaFormulir(page, calon);

  const isian = formulir(page);
  await isian.getByLabel("Nama lengkap sesuai KTP").fill("Sari Wulandari");
  await isian.getByRole("radio", { name: "Perempuan" }).check();
  await isian.getByLabel("Tanggal lahir").fill("2004-02-29");
  await isian.getByLabel("Provinsi domisili").selectOption("Jawa Tengah");
  await isian
    .getByLabel("Pendidikan terakhir", { exact: true })
    .selectOption("Paket C");
  await isian
    .getByLabel("Program", { exact: true })
    .selectOption("Tokutei Ginou (SSW)");
  await isian
    .getByLabel("Bidang kerja yang diminati")
    .selectOption("Belum tahu");
  await isian.getByLabel("Hubungan kontak darurat").fill("Ibu");
  await isian.getByLabel("Nomor HP kontak darurat").fill("0812-3456-7890");
  await simpanDraf(page);
  await expect(isian.getByRole("status")).toHaveText(KABAR_DRAF_TERSIMPAN);

  await page.getByRole("link", { name: "Kembali ke akunmu" }).click();
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL("/masuk");
  await page.getByLabel("Email").fill(calon.email);
  await page.getByLabel("Kata sandi").fill(calon.kataSandi);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL("/akun");
  await page.getByRole("link", { name: "Isi formulir pendaftaran" }).click();

  await expect(isian.getByLabel("Nama lengkap sesuai KTP")).toHaveValue(
    "Sari Wulandari",
  );
  await expect(isian.getByRole("radio", { name: "Perempuan" })).toBeChecked();
  await expect(isian.getByLabel("Tanggal lahir")).toHaveValue("2004-02-29");
  await expect(isian.getByLabel("Provinsi domisili")).toHaveValue(
    "Jawa Tengah",
  );
  await expect(
    isian.getByLabel("Pendidikan terakhir", { exact: true }),
  ).toHaveValue("Paket C");
  await expect(
    isian.getByLabel("Program", { exact: true }).locator("option:checked"),
  ).toHaveText("Tokutei Ginou (SSW)");
  await expect(
    isian.getByLabel("Bidang kerja yang diminati").locator("option:checked"),
  ).toHaveText("Belum tahu");
  await expect(isian.getByLabel("Hubungan kontak darurat")).toHaveValue("Ibu");
  // Nomor HP disimpan dalam bentuk ternormalisasi (PRD §5.2).
  await expect(isian.getByLabel("Nomor HP kontak darurat")).toHaveValue(
    "6281234567890",
  );
  // Isian yang belum diisi tetap kosong.
  await expect(isian.getByLabel("Tempat lahir")).toHaveValue("");
  await expect(
    isian.getByRole("radio", { name: "Laki-laki" }),
  ).not.toBeChecked();
  await expect(
    isian.getByLabel("Kemampuan bahasa Jepang saat ini"),
  ).toHaveValue("");
});

test("pilihan pendidikan terakhir persis ▶ Keputusan OD-10, dan pilihan kemampuan bahasa Jepang serta provinsi sesuai PRD §6.1", async ({
  page,
}) => {
  await buatAkunLaluBukaFormulir(page, {
    nama: "Calon Pilihan Uji",
    email: "calon.pilihan@contoh.test",
    nomorWhatsApp: "0812-0000-1202",
    kataSandi: "sandi-calon-uji",
  });

  expect(await teksPilihan(page, "Pendidikan terakhir")).toEqual([
    "SMP",
    "SMA",
    "SMK",
    "Paket C",
    "D1",
    "D2",
    "D3",
    "D4",
    "S1",
    "S2",
  ]);
  expect(await teksPilihan(page, "Kemampuan bahasa Jepang saat ini")).toEqual([
    "Belum pernah belajar",
    "N5",
    "N4",
    "N3",
    "N2",
  ]);
  const provinsi = await teksPilihan(page, "Provinsi domisili");
  expect(provinsi).toHaveLength(38);
  expect(provinsi).toContain("Jawa Tengah");
  await expect(
    formulir(page)
      .getByRole("radiogroup", { name: "Jenis kelamin" })
      .getByRole("radio"),
  ).toHaveCount(2);
});

test("nomor HP kontak darurat yang tidak sah ditandai salah di isiannya, dan draf belum tersimpan sampai nomornya diperbaiki", async ({
  page,
}) => {
  await buatAkunLaluBukaFormulir(page, {
    nama: "Calon Nomor Darurat Uji",
    email: "calon.nomor.darurat@contoh.test",
    nomorWhatsApp: "0812-0000-1203",
    kataSandi: "sandi-calon-uji",
  });
  const isian = formulir(page);
  const nomorHp = isian.getByLabel("Nomor HP kontak darurat");

  await isian.getByLabel("Nama kontak darurat").fill("Siti Aminah");
  await nomorHp.fill("081234567");
  await simpanDraf(page);

  await expect(nomorHp).toHaveAttribute("aria-invalid", "true");
  await expect(nomorHp).toHaveAccessibleDescription(
    new RegExp(PESAN_NOMOR_HP_TIDAK_SAH.replace(/[.+()]/g, "\\$&")),
  );
  await expect(isian.getByLabel("Nama kontak darurat")).not.toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(isian.getByRole("alert")).toHaveText(
    "Draf belum tersimpan karena isian berikut belum benar: Nomor HP kontak darurat. Perbaiki isian yang ditandai, atau kosongkan, lalu simpan lagi.",
  );
  // Isian yang diketik tetap ada, supaya bisa diperbaiki.
  await expect(nomorHp).toHaveValue("081234567");
  await expect(isian.getByLabel("Nama kontak darurat")).toHaveValue(
    "Siti Aminah",
  );

  await page.reload();
  await expect(isian.getByLabel("Nama kontak darurat")).toHaveValue("");

  await isian.getByLabel("Nama kontak darurat").fill("Siti Aminah");
  await nomorHp.fill("+62 812 3456 7890");
  await simpanDraf(page);
  await expect(isian.getByRole("status")).toHaveText(KABAR_DRAF_TERSIMPAN);
  await expect(nomorHp).not.toHaveAttribute("aria-invalid", "true");
  await expect(isian.getByRole("alert")).toHaveCount(0);
});

test("sesudah Simpan draf semua isian dan pilihan tetap terisi, dan simpan kedua tidak menghapus pilihan yang tersimpan", async ({
  page,
}) => {
  await buatAkunLaluBukaFormulir(page, {
    nama: "Calon Simpan Ulang Uji",
    email: "calon.simpan.ulang@contoh.test",
    nomorWhatsApp: "0812-0000-1207",
    kataSandi: "sandi-calon-uji",
  });
  const isian = formulir(page);
  const nomorHp = isian.getByLabel("Nomor HP kontak darurat");

  await isiSemuaIsian(page, "0812-3456-7890");
  await simpanDraf(page);
  await expect(isian.getByRole("status")).toHaveText(KABAR_DRAF_TERSIMPAN);
  await periksaSemuaIsianTetap(page);
  // Sesudah disimpan, nomor tampil dalam bentuk tersimpan, sama seperti sesudah dimuat ulang (PRD §5.2).
  await expect(nomorHp).toHaveValue("6281234567890");

  await simpanDraf(page);
  await expect(isian.getByRole("status")).toHaveText(KABAR_DRAF_TERSIMPAN);
  await periksaSemuaIsianTetap(page);

  await page.reload();
  await periksaSemuaIsianTetap(page);
  await expect(nomorHp).toHaveValue("6281234567890");
});

test("sesudah Simpan draf ditolak karena nomor HP kontak darurat salah, semua isian dan pilihan lain tetap terisi untuk diperbaiki", async ({
  page,
}) => {
  await buatAkunLaluBukaFormulir(page, {
    nama: "Calon Ditolak Uji",
    email: "calon.ditolak@contoh.test",
    nomorWhatsApp: "0812-0000-1208",
    kataSandi: "sandi-calon-uji",
  });
  const isian = formulir(page);
  const nomorHp = isian.getByLabel("Nomor HP kontak darurat");

  await isiSemuaIsian(page, "081234567");
  await simpanDraf(page);
  await expect(isian.getByRole("alert")).toContainText(
    "Draf belum tersimpan karena isian berikut belum benar: Nomor HP kontak darurat.",
  );
  await periksaSemuaIsianTetap(page);
  await expect(nomorHp).toHaveValue("081234567");

  await nomorHp.fill("0812-3456-7890");
  await simpanDraf(page);
  await expect(isian.getByRole("status")).toHaveText(KABAR_DRAF_TERSIMPAN);
  await page.reload();
  await periksaSemuaIsianTetap(page);
});

test("hanya program dan bidang kerja aktif yang muncul, ditambah pilihan Belum tahu untuk bidang kerja (PRD §4.3)", async ({
  page,
}) => {
  const programNonaktif = "Program Nonaktif Formulir Uji";
  const bidangNonaktif = "Bidang Nonaktif Formulir Uji";
  const klien = postgres(process.env.DATABASE_URL ?? "", {
    onnotice: () => {},
  });
  try {
    await klien`insert into program (nama, deskripsi, syarat, lama_pelatihan, usia_minimal, usia_maksimal, aktif)
      values (${programNonaktif}, 'Deskripsi uji', 'Syarat uji', '6 bulan', 18, 30, false)`;
    await klien`insert into bidang_kerja (nama, aktif) values (${bidangNonaktif}, false)`;
  } finally {
    await klien.end();
  }

  await buatAkunLaluBukaFormulir(page, {
    nama: "Calon Program Aktif Uji",
    email: "calon.program.aktif@contoh.test",
    nomorWhatsApp: "0812-0000-1204",
    kataSandi: "sandi-calon-uji",
  });

  const program = await teksPilihan(page, "Program");
  expect(program).toContain("Tokutei Ginou (SSW)");
  expect(program).not.toContain(programNonaktif);

  const bidangKerja = await teksPilihan(page, "Bidang kerja yang diminati");
  expect(bidangKerja).toContain("Pembersihan gedung");
  expect(bidangKerja).not.toContain(bidangNonaktif);
  expect(bidangKerja.at(-1)).toBe("Belum tahu");
});

test("formulir hanya memuat isian PRD §6.1, tanpa isian NIK, tinggi badan, atau berat badan (UAT-L1, bagian formulir)", async ({
  page,
}) => {
  await buatAkunLaluBukaFormulir(page, {
    nama: "Calon Isian Uji",
    email: "calon.isian@contoh.test",
    nomorWhatsApp: "0812-0000-1205",
    kataSandi: "sandi-calon-uji",
  });
  const isian = formulir(page);

  await expect(isian.getByLabel(/NIK|tinggi badan|berat badan/i)).toHaveCount(
    0,
  );
  await expect(isian.getByText(/NIK|tinggi badan|berat badan/i)).toHaveCount(0);
  await expect(isian.locator('input[type="file"]')).toHaveCount(0);

  const namaIsian = await isian
    .locator("input, select, textarea")
    .evaluateAll((daftar) => [
      ...new Set(daftar.map((el) => el.getAttribute("name"))),
    ]);
  expect(namaIsian).toEqual([
    "namaLengkap",
    "jenisKelamin",
    "tempatLahir",
    "tanggalLahir",
    "kabupatenKota",
    "provinsi",
    "pendidikanTerakhir",
    "jurusanPendidikan",
    "programId",
    "bidangKerja",
    "kemampuanBahasaJepang",
    "pengalamanKerja",
    "namaKontakDarurat",
    "hubunganKontakDarurat",
    "nomorHpKontakDarurat",
  ]);
});

test("formulir pendaftaran hanya untuk pemilik akun: pengunjung diarahkan ke halaman masuk", async ({
  page,
}) => {
  await page.goto(ALAMAT_FORMULIR);
  await expect(page).toHaveURL("/masuk");
});

test("formulir pendaftaran tidak bergulir ke samping di lebar 375 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await buatAkunLaluBukaFormulir(page, {
    nama: "Calon Layar Kecil Uji",
    email: "calon.layar.kecil@contoh.test",
    nomorWhatsApp: "0812-0000-1206",
    kataSandi: "sandi-calon-uji",
  });

  const lebar = await page.evaluate(() => ({
    gulir: document.documentElement.scrollWidth,
    layar: document.documentElement.clientWidth,
  }));
  expect(lebar.gulir).toBeLessThanOrEqual(lebar.layar);
});
