import { expect, test } from "@playwright/test";
import { ADMIN, jalankanAdminPertama, masuk } from "./pegawai-uji";

// Admin pertama sudah dibuat oleh siapkan-database.ts lewat skrip yang sama.
const ADMIN_KEDUA = {
  nama: "Admin Kedua Uji",
  email: "admin.kedua@contoh.test",
  kataSandi: "sandi-admin-kedua-uji",
};

test("skrip pemasangan menolak membuat Admin pertama bila sudah ada Admin", async ({
  page,
}) => {
  const hasil = jalankanAdminPertama(ADMIN_KEDUA);

  expect(hasil.kodeKeluar).not.toBe(0);
  expect(hasil.keluaran).toContain("Sudah ada Admin");

  await masuk(page, ADMIN_KEDUA);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Email atau kata sandi salah",
  );
});

test("skrip pemasangan menolak kata sandi kurang dari 8 karakter", () => {
  const hasil = jalankanAdminPertama({ ...ADMIN, kataSandi: "1234567" });

  expect(hasil.kodeKeluar).not.toBe(0);
  expect(hasil.keluaran).toContain("minimal 8 karakter");
});
