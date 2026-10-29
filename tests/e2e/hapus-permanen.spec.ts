import { expect, type Locator, type Page, test } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import postgres from "postgres";
import { KODE_LANGKAH } from "../../src/domain/pendaftaran";
import { ADMIN, masukKePanel, STAF } from "./pegawai-uji";

// Hapus permanen oleh Admin (issue T17, PRD §2.2, §12.5, UAT-L3). Orang uji diisi langsung ke database test, masing-
// masing dengan akun yang bisa masuk dan satu atau dua pendaftaran yang dikirim pada 2024 dengan nomor FGC-2024-03…,
// jadi tidak bertabrakan dengan nomor test lain. Setiap test memakai orangnya sendiri. Nomor yang tidak dipakai ulang
// sesudah dihapus (PRD §6.4) diuji di src/server/pendaftaran.test.ts.

type OrangUji = {
  namaLengkap: string;
  email: string;
  nomorWhatsApp: string;
  /** Pendaftaran orang ini, dari yang paling lama; semua kecuali yang terakhir sudah Ditutup. */
  nomor: string[];
};

const KATA_SANDI = "sandi-calon-uji";

const EKA: OrangUji = {
  namaLengkap: "Eka Hapus Uji",
  email: "hapus.uji.eka@contoh.test",
  nomorWhatsApp: "6281200003001",
  nomor: ["FGC-2024-0301"],
};
const FAJAR: OrangUji = {
  namaLengkap: "Fajar Hapus Uji",
  email: "hapus.uji.fajar@contoh.test",
  nomorWhatsApp: "6281200003002",
  nomor: ["FGC-2024-0302", "FGC-2024-0303"],
};
const GITA: OrangUji = {
  namaLengkap: "Gita Hapus Uji",
  email: "hapus.uji.gita@contoh.test",
  nomorWhatsApp: "6281200003003",
  nomor: ["FGC-2024-0304"],
};

/** Mengisi orang uji beserta pendaftarannya di tahap 1 dan 22 langkahnya. Aman diulang bila test dicoba lagi. */
async function isiOrangUji() {
  const sql = postgres(process.env.DATABASE_URL ?? "", { onnotice: () => {} });
  try {
    await sql`delete from akun where email like 'hapus.uji.%@contoh.test'`;
    const hash = await hashPassword(KATA_SANDI);
    for (const uji of [EKA, FAJAR, GITA]) {
      const [{ id: akunId }] = await sql<{ id: string }[]>`
        insert into akun (name, email, email_verified, jenis, nomor_whatsapp, waktu_persetujuan)
        values (${uji.namaLengkap}, ${uji.email}, true, 'pemilik_akun', ${uji.nomorWhatsApp}, now())
        returning id`;
      await sql`
        insert into kredensial (account_id, provider_id, user_id, password)
        values (${akunId}, 'credential', ${akunId}, ${hash})`;
      for (const [urutan, nomor] of uji.nomor.entries()) {
        const ditutup = urutan < uji.nomor.length - 1;
        const [{ id: pendaftaranId }] = await sql<{ id: string }[]>`
          insert into pendaftaran (akun_id, nomor, dikirim_pada, status, tahap, nama_lengkap, jenis_kelamin,
            tempat_lahir, tanggal_lahir, kabupaten_kota, provinsi, pendidikan_terakhir, program_id, bidang_kerja_id,
            bidang_kerja_belum_tahu, kemampuan_bahasa_jepang, nama_kontak_darurat, hubungan_kontak_darurat,
            nomor_hp_kontak_darurat, alasan_penutupan, keterangan_penutupan)
          values (${akunId}, ${nomor}, ${`2024-07-1${urutan}T03:00:00Z`}, ${ditutup ? "Ditutup" : "Berjalan"}, 1,
            ${uji.namaLengkap}, 'Perempuan', 'Cilacap', '2004-05-17', 'Kab. Cilacap', 'Jawa Tengah', 'SMK',
            (select id from program where nama = 'Tokutei Ginou (SSW)'),
            (select id from bidang_kerja where nama = 'Pembersihan gedung'),
            false, 'N5', 'Kontak Darurat Uji', 'Ibu', '6281234567890',
            ${ditutup ? "Mundur" : null}, ${ditutup ? "Mundur atas permintaan sendiri." : null})
          returning id`;
        for (const kode of KODE_LANGKAH) {
          await sql`
            insert into langkah_pendaftaran (pendaftaran_id, kode, status)
            values (${pendaftaranId}, ${kode}, 'Belum')`;
        }
      }
    }
  } finally {
    await sql.end();
  }
}

test.beforeAll(isiOrangUji);

/** Akun dan pendaftaran orang uji yang masih tersimpan di database. */
async function dataTersimpan(uji: OrangUji) {
  const sql = postgres(process.env.DATABASE_URL ?? "", { onnotice: () => {} });
  try {
    const akun = await sql`select id from akun where email = ${uji.email}`;
    const pendaftaran = await sql<{ nomor: string }[]>`
      select nomor from pendaftaran where nomor in ${sql(uji.nomor)} order by nomor`;
    return {
      akun: akun.length,
      pendaftaran: pendaftaran.map(({ nomor }) => nomor),
    };
  } finally {
    await sql.end();
  }
}

/** Halaman pendaftaran Berjalan orang uji, yaitu pendaftaran terakhirnya. */
const alamat = (uji: OrangUji) =>
  `/panel/pendaftaran/${uji.nomor[uji.nomor.length - 1]}`;

function formulirHapus(page: Page) {
  return page.getByRole("form", { name: "Hapus permanen" });
}

async function hapusLewatHalaman(page: Page, konfirmasi: string) {
  const formulir = formulirHapus(page);
  await formulir.getByLabel("Konfirmasi penghapusan").fill(konfirmasi);
  await formulir.getByRole("button", { name: "Hapus permanen" }).click();
}

async function masukSebagai(page: Page, uji: OrangUji) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(uji.email);
  await page.getByLabel("Kata sandi").fill(KATA_SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
}

/** Semua isian formulir yang akan terkirim, termasuk isian tersimpan Server Action ($ACTION_…). */
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

test("Admin menghapus seseorang dengan mengetik email akunnya: akun itu tidak bisa masuk lagi, sesinya berakhir, dan semua pendaftarannya hilang dari daftar (UAT-L3 langkah 2)", async ({
  page,
  browser,
}) => {
  // Fajar sedang masuk di perangkatnya sendiri.
  const konteksFajar = await browser.newContext();
  const fajar = await konteksFajar.newPage();
  await masukSebagai(fajar, FAJAR);
  await expect(fajar).toHaveURL("/akun");

  await masukKePanel(page, ADMIN);
  await page.goto(alamat(FAJAR));
  const bagian = page.getByRole("region", { name: "Hapus permanen" });
  await expect(bagian).toContainText(
    "Akun pemilik pendaftaran ini dihapus beserta semua pendaftarannya, termasuk yang sudah ditutup.",
  );
  await expect(
    formulirHapus(page).getByLabel("Konfirmasi penghapusan"),
  ).toHaveAccessibleDescription(
    `Ketik nomor pendaftaran ${FAJAR.nomor[1]} atau email akun pemiliknya.`,
  );

  await hapusLewatHalaman(page, FAJAR.email);

  // Admin dibawa ke daftar pendaftaran dengan kabar penghapusan.
  await expect(page).toHaveURL(`/panel/pendaftaran?dihapus=${FAJAR.nomor[1]}`);
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    `Data pemilik pendaftaran ${FAJAR.nomor[1]} sudah dihapus permanen: akunnya beserta semua pendaftarannya.`,
  );

  // Kedua pendaftarannya hilang dari daftar, juga yang sudah Ditutup.
  for (const cari of [FAJAR.namaLengkap, ...FAJAR.nomor]) {
    await page.getByLabel("Cari nama atau nomor pendaftaran").fill(cari);
    await page.getByRole("button", { name: "Terapkan" }).click();
    await expect(page).toHaveURL(/cari=/);
    await expect(
      page.getByText(
        "Tidak ada pendaftaran yang cocok dengan saringan dan pencarian ini.",
        { exact: false },
      ),
    ).toBeVisible();
  }
  const jawaban = await page.goto(alamat(FAJAR));
  expect(jawaban?.status()).toBe(404);
  expect(await dataTersimpan(FAJAR)).toEqual({ akun: 0, pendaftaran: [] });

  // Sesi Fajar yang sedang berjalan ikut berakhir, dan akunnya tidak bisa masuk lagi.
  await fajar.goto("/akun");
  await expect(fajar).toHaveURL("/masuk");
  await masukSebagai(fajar, FAJAR);
  await expect(fajar.getByRole("main").getByRole("alert")).toHaveText(
    "Email atau kata sandi salah. Periksa lagi keduanya, lalu coba masuk kembali.",
  );
  await expect(fajar).toHaveURL("/masuk");

  await konteksFajar.close();
});

test("konfirmasi yang salah ketik ditolak, dan tidak ada yang terhapus", async ({
  page,
}) => {
  await masukKePanel(page, ADMIN);
  await page.goto(alamat(GITA));

  await hapusLewatHalaman(page, "hapus.uji.gita@contoh.tes");

  const formulir = formulirHapus(page);
  const isian = formulir.getByLabel("Konfirmasi penghapusan");
  await expect(formulir.getByRole("alert")).toHaveText(
    "Data belum dihapus karena konfirmasi tidak cocok dengan nomor pendaftaran atau email akun pemiliknya. Periksa ketikannya, lalu hapus lagi.",
  );
  await expect(isian).toHaveAttribute("aria-invalid", "true");
  await expect(isian).toHaveValue("hapus.uji.gita@contoh.tes");
  await expect(page).toHaveURL(alamat(GITA));

  // Konfirmasi kosong juga ditolak.
  await hapusLewatHalaman(page, "");
  await expect(formulir.getByRole("alert")).toHaveText(
    "Data belum dihapus karena konfirmasi tidak cocok dengan nomor pendaftaran atau email akun pemiliknya. Periksa ketikannya, lalu hapus lagi.",
  );

  await page.reload();
  await expect(
    page.getByRole("region", { name: "Ringkasan pendaftaran" }),
  ).toContainText(GITA.namaLengkap);
  expect(await dataTersimpan(GITA)).toEqual({
    akun: 1,
    pendaftaran: GITA.nomor,
  });
});

test("Staf tidak melihat tombol hapus permanen, dan server menolak permintaan langsung dari Staf (UAT-L3 langkah 1)", async ({
  page,
  browser,
}) => {
  await masukKePanel(page, STAF);
  await page.goto(alamat(EKA));
  await expect(
    page.getByRole("region", { name: "Ringkasan pendaftaran" }),
  ).toContainText(EKA.namaLengkap);
  await expect(
    page.getByRole("region", { name: "Hapus permanen" }),
  ).toHaveCount(0);
  await expect(formulirHapus(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /hapus/i })).toHaveCount(0);

  // Admin membuka halaman yang sama tanpa JavaScript, jadi formulir hapus memuat isian Server Action dari server.
  const konteksAdmin = await browser.newContext({ javaScriptEnabled: false });
  const admin = await konteksAdmin.newPage();
  await masukKePanel(admin, ADMIN);
  await admin.goto(alamat(EKA));
  await formulirHapus(admin)
    .getByLabel("Konfirmasi penghapusan")
    .fill(EKA.email);
  const isian = await isianTerkirim(formulirHapus(admin));
  expect(isian.nomor).toBe(EKA.nomor[0]);
  expect(isian.konfirmasi).toBe(EKA.email);

  // Permintaan langsung dari Staf dengan konfirmasi yang benar ditolak sebelum diproses.
  const jawabanStaf = await page.request.post(alamat(EKA), {
    multipart: isian,
    maxRedirects: 0,
  });
  expect(jawabanStaf.ok(), "hapus langsung oleh Staf").toBe(false);
  expect(await dataTersimpan(EKA)).toEqual({ akun: 1, pendaftaran: EKA.nomor });

  // Pembanding: permintaan yang sama dari Admin diterima, jadi penolakan di atas memang karena kewenangan.
  await admin.request.post(alamat(EKA), { multipart: isian });
  expect(await dataTersimpan(EKA)).toEqual({ akun: 0, pendaftaran: [] });

  await konteksAdmin.close();
});

test("halaman pendaftaran dengan formulir hapus permanen tidak bergulir ke samping di lebar 375 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await masukKePanel(page, ADMIN);
  await page.goto(alamat(GITA));
  await expect(formulirHapus(page)).toBeVisible();

  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
});
