import { expect, type Page, test } from "@playwright/test";
import postgres from "postgres";
import { emailUntuk, tungguEmail } from "./kotak-keluar";
import { masukKePanel, STAF } from "./pegawai-uji";

// Akun calon peserta (PRD §5.1–§5.4, §12.1, issue T11). Kedaluwarsa tautan verifikasi 24 jam diuji dengan jam yang
// disuntikkan di src/server/auth.test.ts, karena jam server e2e tidak bisa dimajukan.
// Setiap test memakai email dan nomor WhatsApp sendiri, karena keduanya hanya boleh dipakai satu akun.

type CalonPeserta = {
  nama: string;
  email: string;
  nomorWhatsApp: string;
  kataSandi: string;
};

const PESAN_KATA_SANDI_PENDEK =
  "Kata sandi kurang dari 8 karakter. Pakai kata sandi minimal 8 karakter.";
const PESAN_NOMOR_TIDAK_SAH =
  "Nomor WhatsApp belum benar. Isi nomor HP Indonesia 10 sampai 13 digit yang diawali 08 atau +62 8, misalnya 0812-3456-7890. Nomor luar negeri dan nomor telepon rumah tidak diterima.";
const PESAN_TANPA_PERSETUJUAN =
  "Persetujuan pemrosesan data belum dicentang. Baca Kebijakan Privasi, lalu centang persetujuannya untuk membuat akun.";
const PESAN_EMAIL_DIPAKAI =
  "Email ini sudah dipakai akun lain. Masuk dengan email itu, atau pakai email lain.";
const PESAN_NOMOR_DIPAKAI =
  "Nomor WhatsApp ini sudah dipakai akun lain. Pakai nomor WhatsApp lain, atau masuk ke akun yang memakai nomor ini.";
const PESAN_PANEL_KHUSUS_PEGAWAI =
  "Panel ini khusus pegawai lembaga, jadi akunmu tidak bisa membukanya. Buka akunmu untuk mengisi formulir pendaftaran dan memantau pendaftaranmu.";

/** Mengisi formulir daftar akun. Persetujuan dicentang kecuali `setuju` false. */
async function isiFormulirDaftar(
  page: Page,
  calon: CalonPeserta,
  { setuju = true } = {},
) {
  await page.goto("/daftar");
  await page.getByLabel("Nama lengkap").fill(calon.nama);
  await page.getByLabel("Email").fill(calon.email);
  await page.getByLabel("Nomor WhatsApp").fill(calon.nomorWhatsApp);
  await page.getByLabel("Kata sandi").fill(calon.kataSandi);
  if (setuju) {
    await page.getByLabel(/Saya setuju data pribadi saya diproses/).check();
  }
  await page.getByRole("button", { name: "Buat akun" }).click();
}

/** Membuat akun lewat formulir daftar akun, lalu menunggu halaman akun terbuka. */
async function buatAkun(page: Page, calon: CalonPeserta) {
  await isiFormulirDaftar(page, calon);
  await expect(page).toHaveURL("/akun");
  await expect(
    page.getByRole("heading", { level: 1, name: `Halo, ${calon.nama}` }),
  ).toBeVisible();
}

async function masukAkun(page: Page, email: string, kataSandi: string) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi").fill(kataSandi);
  await page.getByRole("button", { name: "Masuk" }).click();
}

function tautanDari(teks: string): string {
  const tautan = teks.match(/https?:\/\/\S+/)?.[0];
  if (!tautan) throw new Error("Email tidak berisi tautan.");
  return tautan;
}

/** Baris akun di database test, untuk isian yang tidak tampil di halaman mana pun. */
async function bacaBarisAkun(email: string) {
  const klien = postgres(process.env.DATABASE_URL ?? "", {
    onnotice: () => {},
  });
  try {
    const [baris] = await klien<
      {
        nomorWhatsApp: string;
        waktuPersetujuan: Date | null;
        jenis: string;
      }[]
    >`select nomor_whatsapp as "nomorWhatsApp", waktu_persetujuan as "waktuPersetujuan", jenis
      from akun where email = ${email}`;
    return baris;
  } finally {
    await klien.end();
  }
}

const pengingatVerifikasi = (page: Page) =>
  page.getByRole("region", { name: "Email belum terverifikasi" });

test.describe.serial("membuat akun dan email ganda (UAT-E1, UAT-E2)", () => {
  const CALON: CalonPeserta = {
    nama: "Calon Peserta Uji",
    email: "calon.peserta@contoh.test",
    nomorWhatsApp: "0812-3456-7890",
    kataSandi: "sandi-calon-uji",
  };

  test("membuat akun dengan nomor 0812-3456-7890 mengirim email verifikasi, dan sesudah tautannya dibuka email berstatus terverifikasi (UAT-E1)", async ({
    page,
  }) => {
    const sejak = Date.now();
    await buatAkun(page, CALON);
    await expect(pengingatVerifikasi(page)).toContainText(CALON.email);

    // Waktu persetujuan tersimpan, dan nomor disimpan dalam bentuk ternormalisasi (PRD §5.2, §12.1).
    const baris = await bacaBarisAkun(CALON.email);
    expect(baris.jenis).toBe("pemilik_akun");
    expect(baris.nomorWhatsApp).toBe("6281234567890");
    expect(baris.waktuPersetujuan).not.toBeNull();
    expect(baris.waktuPersetujuan?.getTime()).toBeGreaterThanOrEqual(
      sejak - 1000,
    );
    expect(baris.waktuPersetujuan?.getTime()).toBeLessThanOrEqual(Date.now());

    const email = await tungguEmail(CALON.email, sejak);
    expect(email.subjek).toBe("Verifikasi email akunmu");
    expect(email.teks).toContain(`Halo ${CALON.nama},`);
    const tautan = tautanDari(email.teks);
    expect(tautan).toContain("/verifikasi-email?token=");

    await page.goto(tautan);
    await expect(
      page.getByRole("heading", { level: 1, name: "Verifikasi email" }),
    ).toBeVisible();
    await expect(page.getByRole("main").getByRole("status")).toContainText(
      "Emailmu sudah terverifikasi.",
    );

    await page.getByRole("link", { name: "Buka akunmu" }).click();
    await expect(page).toHaveURL("/akun");
    await expect(
      page.getByRole("heading", { level: 1, name: `Halo, ${CALON.nama}` }),
    ).toBeVisible();
    await expect(pengingatVerifikasi(page)).toHaveCount(0);
  });

  test("email yang sama dengan huruf besar dan nomor +62 812 3456 7890 ditolak karena sudah dipakai (UAT-E2)", async ({
    page,
  }) => {
    await isiFormulirDaftar(page, {
      ...CALON,
      nama: "Calon Kedua Uji",
      email: "CALON.Peserta@CONTOH.test",
      nomorWhatsApp: "0812-0000-0201",
    });
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      PESAN_EMAIL_DIPAKAI,
    );
    await expect(page).toHaveURL("/daftar");
    await expect(page.getByLabel("Email")).toHaveValue(
      "CALON.Peserta@CONTOH.test",
    );

    await isiFormulirDaftar(page, {
      ...CALON,
      nama: "Calon Kedua Uji",
      email: "calon.kedua@contoh.test",
      nomorWhatsApp: "+62 812 3456 7890",
    });
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      PESAN_NOMOR_DIPAKAI,
    );
    await expect(page).toHaveURL("/daftar");
    expect(await bacaBarisAkun("calon.kedua@contoh.test")).toBeUndefined();
  });
});

test("kata sandi 7 karakter, nomor 081234567, dan pendaftaran tanpa centang persetujuan ditolak dengan pesan yang jelas (UAT-E3)", async ({
  page,
}) => {
  const sah: CalonPeserta = {
    nama: "Calon Tidak Sah Uji",
    email: "calon.tidak.sah@contoh.test",
    nomorWhatsApp: "0812-0000-0301",
    kataSandi: "sandi-calon-uji",
  };
  const alert = page.getByRole("main").getByRole("alert");

  await isiFormulirDaftar(page, { ...sah, kataSandi: "1234567" });
  await expect(alert).toHaveText(PESAN_KATA_SANDI_PENDEK);
  await expect(page.getByLabel("Nama lengkap")).toHaveValue(sah.nama);

  await isiFormulirDaftar(page, { ...sah, nomorWhatsApp: "081234567" });
  await expect(alert).toHaveText(PESAN_NOMOR_TIDAK_SAH);

  await isiFormulirDaftar(page, sah, { setuju: false });
  await expect(alert).toHaveText(PESAN_TANPA_PERSETUJUAN);

  await expect(page).toHaveURL("/daftar");
  expect(await bacaBarisAkun(sah.email)).toBeUndefined();
});

test("tautan Kebijakan Privasi di samping centang persetujuan terbuka di tab baru tanpa mencentang kotaknya, dan seluruh baris centang setinggi minimal 44px bisa diklik", async ({
  page,
}) => {
  await page.goto("/daftar");
  const persetujuan = page.getByLabel(/Saya setuju data pribadi saya diproses/);
  const tautan = page
    .getByRole("main")
    .getByRole("link", { name: "Kebijakan Privasi" });
  await expect(persetujuan).not.toBeChecked();
  await expect(tautan).toHaveAttribute("href", "/kebijakan-privasi");

  const [tabBaru] = await Promise.all([
    page.waitForEvent("popup"),
    tautan.click(),
  ]);
  await expect(
    tabBaru.getByRole("heading", { level: 1, name: "Kebijakan Privasi" }),
  ).toBeVisible();
  await tabBaru.close();
  await expect(persetujuan).not.toBeChecked();

  // Target sentuh minimal 44px (docs/DESIGN.md, Do's): baris label, termasuk celah di antara kotak dan teksnya.
  const baris = page.locator("label", { has: persetujuan });
  const kotak = await baris.boundingBox();
  expect(kotak?.height).toBeGreaterThanOrEqual(44);
  await baris.click({ position: { x: 28, y: 4 } });
  await expect(persetujuan).toBeChecked();
});

test("pemilik akun yang belum memverifikasi email bisa keluar, masuk lagi, dan meminta tautan verifikasi baru", async ({
  page,
}) => {
  const calon: CalonPeserta = {
    nama: "Calon Kirim Ulang Uji",
    email: "calon.kirim.ulang@contoh.test",
    nomorWhatsApp: "0812-0000-0401",
    kataSandi: "sandi-calon-uji",
  };
  await buatAkun(page, calon);
  await expect(
    page.getByRole("link", { name: "Isi formulir pendaftaran" }),
  ).toHaveAttribute("href", "/akun/formulir-pendaftaran");

  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL("/masuk");
  await page.goto("/akun");
  await expect(page).toHaveURL("/masuk");

  await masukAkun(page, calon.email, "bukan-sandinya");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Email atau kata sandi salah. Periksa lagi keduanya, lalu coba masuk kembali.",
  );

  await masukAkun(page, calon.email, calon.kataSandi);
  await expect(page).toHaveURL("/akun");
  const pengingat = pengingatVerifikasi(page);
  await expect(pengingat).toBeVisible();

  const sejak = Date.now();
  await pengingat
    .getByRole("button", { name: "Kirim ulang tautan verifikasi" })
    .click();
  await expect(pengingat.getByRole("status")).toHaveText(
    `Tautan verifikasi baru sudah kami kirim ke ${calon.email}. Tautan berlaku 24 jam. Bila email belum masuk dalam beberapa menit, periksa folder spam.`,
  );
  const email = await tungguEmail(calon.email, sejak);
  expect(email.subjek).toBe("Verifikasi email akunmu");

  await page.goto(tautanDari(email.teks));
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Emailmu sudah terverifikasi.",
  );
});

test("tautan verifikasi yang tidak sah ditolak dengan jalan untuk meminta tautan baru", async ({
  page,
}) => {
  await page.goto("/verifikasi-email?token=bukan-token-sah");

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Tautan verifikasi ini tidak berlaku lagi, karena sudah lewat 24 jam atau tidak lengkap. Buka akunmu, lalu minta tautan verifikasi baru.",
  );
  await expect(page.getByRole("link", { name: "Buka akunmu" })).toHaveAttribute(
    "href",
    "/akun",
  );
});

test("lupa kata sandi berhasil, kata sandi lama tidak berlaku lagi, dan browser kedua diminta masuk lagi (UAT-E4)", async ({
  page,
  browser,
}) => {
  const calon: CalonPeserta = {
    nama: "Calon Lupa Sandi Uji",
    email: "calon.lupa.sandi@contoh.test",
    nomorWhatsApp: "0812-0000-0501",
    kataSandi: "sandi-calon-lama",
  };
  await buatAkun(page, calon);
  await page.getByRole("button", { name: "Keluar" }).click();

  // Pemilik akun yang sama masuk di browser kedua.
  const browserKedua = await browser.newContext();
  const halamanKedua = await browserKedua.newPage();
  await masukAkun(halamanKedua, calon.email, calon.kataSandi);
  await expect(halamanKedua).toHaveURL("/akun");

  const sejak = Date.now();
  await page.goto("/masuk");
  await page.getByRole("link", { name: "Lupa kata sandi?" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Lupa kata sandi" }),
  ).toBeVisible();
  await page.getByLabel("Email").fill(calon.email);
  await page.getByRole("button", { name: "Kirim tautan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    "Bila email itu terdaftar, tautan atur ulang kata sandi sudah kami kirim ke sana. Tautan berlaku 1 jam. Bila email belum masuk dalam beberapa menit, periksa folder spam, lalu minta tautan lagi.",
  );

  const email = await tungguEmail(calon.email, sejak);
  expect(email.subjek).toBe("Atur ulang kata sandi");
  const tautan = tautanDari(email.teks);
  expect(new URL(tautan).pathname).toBe("/atur-ulang-kata-sandi");

  await page.goto(tautan);
  const kataSandiBaru = "sandi-calon-baru";
  await page.getByLabel("Kata sandi baru").fill(kataSandiBaru);
  await page.getByRole("button", { name: "Simpan kata sandi" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Kata sandi baru sudah disimpan",
  );
  await page
    .getByRole("main")
    .getByRole("link", { name: "Masuk", exact: true })
    .click();
  await expect(page).toHaveURL("/masuk");

  await masukAkun(page, calon.email, calon.kataSandi);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Email atau kata sandi salah",
  );
  await masukAkun(page, calon.email, kataSandiBaru);
  await expect(page).toHaveURL("/akun");

  await halamanKedua.reload();
  await expect(halamanKedua).toHaveURL("/masuk");
  await expect(
    halamanKedua.getByRole("heading", { level: 1, name: "Masuk" }),
  ).toBeVisible();

  await browserKedua.close();
});

test("tautan atur ulang kata sandi yang tidak sah ditolak dengan jalan ke halaman Lupa kata sandi pemilik akun", async ({
  page,
}) => {
  await page.goto("/atur-ulang-kata-sandi?token=bukan-token-sah");
  await page.getByLabel("Kata sandi baru").fill("sandi-baru-apa-saja");
  await page.getByRole("button", { name: "Simpan kata sandi" }).click();

  const peringatan = page.getByRole("main").getByRole("alert");
  await expect(peringatan).toContainText("tidak berlaku lagi");
  await peringatan
    .getByRole("link", { name: "Buka halaman Lupa kata sandi" })
    .click();
  await expect(page).toHaveURL("/lupa-kata-sandi");
});

test("lupa kata sandi untuk email yang tidak terdaftar menampilkan pesan yang sama dan tidak mengirim email", async ({
  page,
}) => {
  const sejak = Date.now();
  const tidakTerdaftar = "calon.tidak.terdaftar@contoh.test";

  await page.goto("/lupa-kata-sandi");
  await page.getByLabel("Email").fill(tidakTerdaftar);
  await page.getByRole("button", { name: "Kirim tautan" }).click();

  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Bila email itu terdaftar",
  );
  expect(await emailUntuk(tidakTerdaftar, sejak)).toEqual([]);
});

/** Halaman Masuk pegawai bagi pemilik akun yang membuka panel pegawai: pesan dan tautan ke akunnya (UAT-B2). */
async function periksaPesanPanelKhususPegawai(page: Page) {
  await expect(page).toHaveURL("/panel/masuk");
  await expect(
    page.getByRole("heading", { level: 1, name: "Masuk pegawai" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Menu panel pegawai" }),
  ).toHaveCount(0);
  const peringatan = page.getByRole("main").getByRole("alert");
  await expect(peringatan).toHaveText(PESAN_PANEL_KHUSUS_PEGAWAI);
  await expect(
    peringatan.getByRole("link", { name: "Buka akunmu" }),
  ).toHaveAttribute("href", "/akun");
}

test("pemilik akun yang membuka panel pegawai ditolak, lalu melihat pesan bahwa panel itu khusus pegawai beserta tautan ke halaman akunnya (UAT-B2)", async ({
  page,
}) => {
  const calon: CalonPeserta = {
    nama: "Calon Panel Uji",
    email: "calon.panel@contoh.test",
    nomorWhatsApp: "0812-0000-0601",
    kataSandi: "sandi-calon-uji",
  };
  await buatAkun(page, calon);

  for (const alamat of ["/panel", "/panel/pendaftaran", "/panel/program"]) {
    await page.goto(alamat);
    await periksaPesanPanelKhususPegawai(page);
  }

  // Sesinya tetap sesi pemilik akun: tautan di pesan membuka akunnya.
  await page
    .getByRole("main")
    .getByRole("alert")
    .getByRole("link", { name: "Buka akunmu" })
    .click();
  await expect(page).toHaveURL("/akun");
  await expect(
    page.getByRole("heading", { level: 1, name: `Halo, ${calon.nama}` }),
  ).toBeVisible();
});

test("pemilik akun yang masuk lewat halaman Masuk pegawai mendapat pesan yang sama, bukan panel pegawai (UAT-B2)", async ({
  page,
}) => {
  const calon: CalonPeserta = {
    nama: "Calon Masuk Panel Uji",
    email: "calon.masuk.panel@contoh.test",
    nomorWhatsApp: "0812-0000-0702",
    kataSandi: "sandi-calon-uji",
  };
  await buatAkun(page, calon);
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL("/masuk");

  await page.goto("/panel/masuk");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await page.getByLabel("Email").fill(calon.email);
  await page.getByLabel("Kata sandi").fill(calon.kataSandi);
  await page.getByRole("button", { name: "Masuk" }).click();

  await periksaPesanPanelKhususPegawai(page);
});

test("bar atas menampilkan Masuk bagi pengunjung dan Akun saya bagi pemilik akun yang sedang masuk (UAT-C8)", async ({
  page,
}) => {
  const calon: CalonPeserta = {
    nama: "Calon Bar Atas Uji",
    email: "calon.bar.atas@contoh.test",
    nomorWhatsApp: "0812-0000-0701",
    kataSandi: "sandi-calon-uji",
  };
  await buatAkun(page, calon);
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL("/masuk");

  const bar = page.getByRole("banner");
  const tautanMasuk = bar.getByRole("link", { name: "Masuk", exact: true });
  const tautanAkunSaya = bar.getByRole("link", {
    name: "Akun saya",
    exact: true,
  });

  // 1. Beranda tanpa masuk.
  await page.goto("/");
  await expect(tautanMasuk).toHaveAttribute("href", "/masuk");
  await expect(tautanAkunSaya).toHaveCount(0);

  // 2. Masuk lewat tautan di bar atas, buka Beranda lagi, lalu klik tulisan di bar atas.
  await tautanMasuk.click();
  await expect(page).toHaveURL("/masuk");
  await page.getByLabel("Email").fill(calon.email);
  await page.getByLabel("Kata sandi").fill(calon.kataSandi);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL("/akun");
  await expect(tautanAkunSaya).toHaveAttribute("href", "/akun");
  await expect(tautanMasuk).toHaveCount(0);

  await bar.getByRole("link", { name: "Fujisaki Gakuin Center" }).click();
  await expect(page).toHaveURL("/");
  await expect(tautanMasuk).toHaveCount(0);
  await tautanAkunSaya.click();
  await expect(page).toHaveURL("/akun");
  await expect(
    page.getByRole("heading", { level: 1, name: `Halo, ${calon.nama}` }),
  ).toBeVisible();

  // Sesudah keluar, bar atas kembali menampilkan Masuk.
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL("/masuk");
  await expect(tautanMasuk).toBeVisible();
  await expect(tautanAkunSaya).toHaveCount(0);
});

test("pegawai yang membuka halaman akun dibawa ke panel pegawai", async ({
  page,
}) => {
  await masukKePanel(page, STAF);

  await page.goto("/akun");

  await expect(page).toHaveURL("/panel/pendaftaran");
});
