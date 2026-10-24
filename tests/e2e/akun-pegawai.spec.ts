import { expect, type Page, test } from "@playwright/test";
import { tungguEmail } from "./kotak-keluar";
import {
  ADMIN,
  masuk,
  masukKePanel,
  type PegawaiUji,
  STAF,
} from "./pegawai-uji";

// Kelola akun pegawai (PRD §5.5, issue T05, UAT-E5). Kedaluwarsa tautan atur kata sandi 24 jam diuji dengan
// jam yang disuntikkan di src/server/auth.test.ts, karena jam server e2e tidak bisa dimajukan.
// Test di berkas ini berjalan berurutan. Admin Uji adalah satu-satunya Admin aktif, kecuali sebentar
// di test ubah peran yang ada paling akhir.

async function bukaAkunPegawai(page: Page) {
  await masukKePanel(page, ADMIN);
  await page
    .getByRole("navigation", { name: "Menu panel pegawai" })
    .getByRole("link", { name: "Akun pegawai" })
    .click();
  await expect(page).toHaveURL("/panel/akun-pegawai");
  await expect(
    page.getByRole("heading", { level: 1, name: "Akun pegawai" }),
  ).toBeVisible();
}

function bagianDaftar(page: Page) {
  return page.getByRole("region", { name: "Daftar pegawai" });
}

function bagianBuatAkun(page: Page) {
  return page.getByRole("region", { name: "Buat akun pegawai" });
}

function barisPegawai(page: Page, email: string) {
  return bagianDaftar(page).getByRole("row").filter({ hasText: email });
}

async function isiFormulirBuatAkun(
  page: Page,
  isian: { nama: string; email: string; peran: "Admin" | "Staf" },
) {
  const bagian = bagianBuatAkun(page);
  await bagian.getByLabel("Nama").fill(isian.nama);
  await bagian.getByLabel("Email").fill(isian.email);
  await bagian.getByLabel("Peran").selectOption({ label: isian.peran });
  await bagian.getByRole("button", { name: "Buat akun" }).click();
}

/** Mengambil tautan atur kata sandi dari email terbaru untuk pegawai itu. */
async function tautanAturKataSandi(email: string, sejak: number) {
  const pesan = await tungguEmail(email, sejak);
  expect(pesan.subjek).toBe("Atur kata sandi akun pegawai");
  const tautan = pesan.teks.match(/https?:\/\/\S+/)?.[0];
  expect(tautan).toContain("/panel/atur-kata-sandi?token=");
  return tautan ?? "";
}

/** Pegawai baru membuka tautan dari email dan mengatur kata sandinya. */
async function aturKataSandi(page: Page, tautan: string, kataSandi: string) {
  await page.context().clearCookies();
  await page.goto(tautan);
  await expect(
    page.getByRole("heading", { level: 1, name: "Atur kata sandi" }),
  ).toBeVisible();
  await page.getByLabel("Kata sandi baru").fill(kataSandi);
  await page.getByRole("button", { name: "Simpan kata sandi" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Kata sandi sudah disimpan",
  );
}

/** Admin membuat akun Staf, lalu Staf itu mengatur kata sandinya. Selesai tanpa sesi yang masuk. */
async function siapkanStafBaru(page: Page, staf: PegawaiUji) {
  const sejak = Date.now();
  await bukaAkunPegawai(page);
  await isiFormulirBuatAkun(page, { ...staf, peran: "Staf" });
  await expect(barisPegawai(page, staf.email)).toBeVisible();
  await aturKataSandi(
    page,
    await tautanAturKataSandi(staf.email, sejak),
    staf.kataSandi,
  );
  await page.context().clearCookies();
}

/** Admin menekan sebuah tombol tindakan di baris pegawai pada daftar pegawai. */
async function tekanTindakan(page: Page, email: string, tindakan: string) {
  await barisPegawai(page, email)
    .getByRole("button", { name: new RegExp(`^${tindakan}`) })
    .click();
}

test("Admin membuat akun Staf; Staf baru menerima email, mengatur kata sandinya, lalu bisa masuk (UAT-E5)", async ({
  page,
}) => {
  const staf: PegawaiUji = {
    nama: "Staf Baru Uji",
    email: "staf.baru@contoh.test",
    kataSandi: "sandi-staf-baru-uji",
  };
  const sejak = Date.now();
  await bukaAkunPegawai(page);

  await isiFormulirBuatAkun(page, { ...staf, peran: "Staf" });

  await expect(bagianBuatAkun(page).getByRole("status")).toHaveText(
    "Akun pegawai untuk Staf Baru Uji sudah dibuat. Email untuk mengatur kata sandi sudah dikirim ke staf.baru@contoh.test, dan tautannya berlaku 24 jam.",
  );
  await expect(barisPegawai(page, staf.email).getByRole("cell")).toHaveText([
    staf.email,
    "Staf",
    "Aktif",
    /.*/,
  ]);
  await expect(
    barisPegawai(page, staf.email).getByRole("rowheader"),
  ).toHaveText(staf.nama);

  await aturKataSandi(
    page,
    await tautanAturKataSandi(staf.email, sejak),
    staf.kataSandi,
  );

  await masukKePanel(page, staf);
  await expect(
    page
      .getByRole("navigation", { name: "Menu panel pegawai" })
      .getByRole("link"),
  ).toHaveText(["Pendaftaran"]);
});

test("pegawai yang dinonaktifkan tidak bisa masuk, dan bisa masuk lagi setelah diaktifkan kembali (UAT-E5)", async ({
  page,
}) => {
  const staf: PegawaiUji = {
    nama: "Staf Dinonaktifkan Uji",
    email: "staf.dinonaktifkan@contoh.test",
    kataSandi: "sandi-staf-dinonaktifkan-uji",
  };
  await siapkanStafBaru(page, staf);

  await bukaAkunPegawai(page);
  await tekanTindakan(page, staf.email, "Nonaktifkan");
  await expect(bagianDaftar(page).getByRole("status")).toHaveText(
    "Staf Dinonaktifkan Uji sekarang nonaktif dan tidak bisa masuk.",
  );
  await expect(barisPegawai(page, staf.email)).toContainText("Nonaktif");

  await page.context().clearCookies();
  await masuk(page, staf);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "nonaktif",
  );
  await expect(page).toHaveURL("/panel/masuk");

  await bukaAkunPegawai(page);
  await tekanTindakan(page, staf.email, "Aktifkan kembali");
  await expect(bagianDaftar(page).getByRole("status")).toHaveText(
    "Staf Dinonaktifkan Uji aktif kembali dan bisa masuk lagi.",
  );
  await expect(
    barisPegawai(page, staf.email).getByRole("cell").nth(2),
  ).toHaveText("Aktif");

  await page.context().clearCookies();
  await masukKePanel(page, staf);
});

test("email yang sudah dipakai ditolak, juga bila ditulis dengan huruf besar", async ({
  page,
}) => {
  await bukaAkunPegawai(page);

  for (const email of [STAF.email, STAF.email.toUpperCase()]) {
    await isiFormulirBuatAkun(page, {
      nama: "Pegawai Kembar Uji",
      email,
      peran: "Staf",
    });

    await expect(bagianBuatAkun(page).getByRole("alert")).toHaveText(
      "Email staf@contoh.test sudah dipakai akun lain. Pakai email lain untuk pegawai ini.",
    );
    await expect(bagianBuatAkun(page).getByLabel("Email")).toHaveValue(email);
  }
  await expect(barisPegawai(page, STAF.email)).toHaveCount(1);
  await expect(
    bagianDaftar(page).getByRole("row").filter({ hasText: "Pegawai Kembar" }),
  ).toHaveCount(0);
});

test("menonaktifkan atau menurunkan Admin aktif terakhir ditolak (UAT-E5)", async ({
  page,
}) => {
  await bukaAkunPegawai(page);

  await tekanTindakan(page, ADMIN.email, "Nonaktifkan");
  await expect(bagianDaftar(page).getByRole("alert")).toHaveText(
    "Admin Uji adalah Admin aktif terakhir, jadi tidak bisa dinonaktifkan. Sistem selalu menyisakan minimal satu Admin aktif. Jadikan pegawai aktif lain Admin lebih dulu, lalu coba lagi.",
  );

  await tekanTindakan(page, ADMIN.email, "Jadikan Staf");
  await expect(bagianDaftar(page).getByRole("alert")).toHaveText(
    "Admin Uji adalah Admin aktif terakhir, jadi tidak bisa diturunkan menjadi Staf. Sistem selalu menyisakan minimal satu Admin aktif. Jadikan pegawai aktif lain Admin lebih dulu, lalu coba lagi.",
  );

  await page.reload();
  await expect(
    barisPegawai(page, ADMIN.email).getByRole("cell").nth(1),
  ).toHaveText("Admin");
  await expect(
    barisPegawai(page, ADMIN.email).getByRole("cell").nth(2),
  ).toHaveText("Aktif");
});

test.describe("hanya Admin yang bisa membuka halaman Akun pegawai", () => {
  test("Staf ditolak dengan 403", async ({ page }) => {
    await masukKePanel(page, STAF);

    const jawaban = await page.goto("/panel/akun-pegawai");

    expect(jawaban?.status()).toBe(403);
    await expect(
      page.getByRole("heading", { level: 1, name: "Akses ditolak" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Daftar pegawai" }),
    ).toHaveCount(0);
  });

  test("pengunjung diarahkan ke halaman masuk", async ({ page }) => {
    await page.goto("/panel/akun-pegawai");

    await expect(page).toHaveURL("/panel/masuk");
  });
});

// Paling akhir, karena untuk sementara ada dua Admin aktif.
test("Admin mengubah peran Staf menjadi Admin, lalu kembali menjadi Staf", async ({
  page,
}) => {
  const staf: PegawaiUji = {
    nama: "Staf Naik Peran Uji",
    email: "staf.naik.peran@contoh.test",
    kataSandi: "sandi-staf-naik-peran-uji",
  };
  await siapkanStafBaru(page, staf);

  await bukaAkunPegawai(page);
  await tekanTindakan(page, staf.email, "Jadikan Admin");
  await expect(bagianDaftar(page).getByRole("status")).toHaveText(
    "Staf Naik Peran Uji sekarang berperan Admin.",
  );
  await expect(
    barisPegawai(page, staf.email).getByRole("cell").nth(1),
  ).toHaveText("Admin");

  await page.context().clearCookies();
  await masukKePanel(page, staf);
  await expect(
    page
      .getByRole("navigation", { name: "Menu panel pegawai" })
      .getByRole("link", { name: "Akun pegawai" }),
  ).toBeVisible();

  await page.context().clearCookies();
  await bukaAkunPegawai(page);
  await tekanTindakan(page, staf.email, "Jadikan Staf");
  await expect(bagianDaftar(page).getByRole("status")).toHaveText(
    "Staf Naik Peran Uji sekarang berperan Staf.",
  );
  await expect(
    barisPegawai(page, staf.email).getByRole("cell").nth(1),
  ).toHaveText("Staf");
});
