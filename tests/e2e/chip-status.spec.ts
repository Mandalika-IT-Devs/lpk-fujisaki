import { expect, type Page, test } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import postgres from "postgres";
import { KODE_LANGKAH } from "../../src/domain/pendaftaran";
import { masukKePanel, STAF } from "./pegawai-uji";
import { periksaChip } from "./periksa-chip";

// Chip status Berjalan, Ditutup, dan Selesai di halaman akun dan panel pegawai (issue T16-b, docs/DESIGN.md Chips,
// PRD §2.3, §11.1, UAT-F8). Pendaftaran uji diisi langsung ke database test, karena cara membuat pendaftaran Selesai
// baru ada di M3. Eko punya satu pendaftaran Ditutup dan satu Berjalan, seperti sesudah pendaftaran ulang (UAT-F5);
// Fitri punya satu pendaftaran Selesai. Semuanya dikirim pada 2024 dengan nomor FGC-2024-04…, jadi tidak bertabrakan
// dengan nomor test lain.

type PendaftaranUji = {
  nomor: string;
  status: "Berjalan" | "Ditutup" | "Selesai";
  tahap: number;
  dikirimPada: string;
};

type PemilikUji = {
  namaLengkap: string;
  email: string;
  nomorWhatsApp: string;
  pendaftaran: PendaftaranUji[];
};

const KATA_SANDI = "sandi-calon-uji";
const ALASAN_PENUTUPAN = "Mundur";

const LAMA: PendaftaranUji = {
  nomor: "FGC-2024-0401",
  status: "Ditutup",
  tahap: 1,
  dikirimPada: "2024-07-01T03:00:00Z",
};
const BARU: PendaftaranUji = {
  nomor: "FGC-2024-0402",
  status: "Berjalan",
  tahap: 1,
  dikirimPada: "2024-07-15T03:00:00Z",
};
const SELESAI: PendaftaranUji = {
  nomor: "FGC-2024-0403",
  status: "Selesai",
  tahap: 6,
  dikirimPada: "2024-07-20T03:00:00Z",
};

const EKO: PemilikUji = {
  namaLengkap: "Eko Chip Uji",
  email: "chip.uji.eko@contoh.test",
  nomorWhatsApp: "6281200002701",
  pendaftaran: [LAMA, BARU],
};
const FITRI: PemilikUji = {
  namaLengkap: "Fitri Chip Uji",
  email: "chip.uji.fitri@contoh.test",
  nomorWhatsApp: "6281200002702",
  pendaftaran: [SELESAI],
};

/** Mengisi pemilik akun uji beserta pendaftarannya dan 22 langkahnya. Aman diulang bila test dicoba lagi. */
async function isiPendaftaranUji() {
  const sql = postgres(process.env.DATABASE_URL ?? "", { onnotice: () => {} });
  try {
    await sql`delete from akun where email like 'chip.uji.%@contoh.test'`;
    const hash = await hashPassword(KATA_SANDI);
    for (const pemilik of [EKO, FITRI]) {
      const [{ id: akunId }] = await sql<{ id: string }[]>`
        insert into akun (name, email, email_verified, jenis, nomor_whatsapp, waktu_persetujuan)
        values (${pemilik.namaLengkap}, ${pemilik.email}, true, 'pemilik_akun', ${pemilik.nomorWhatsApp}, now())
        returning id`;
      await sql`
        insert into kredensial (account_id, provider_id, user_id, password)
        values (${akunId}, 'credential', ${akunId}, ${hash})`;
      for (const uji of pemilik.pendaftaran) {
        const ditutup = uji.status === "Ditutup";
        const [{ id: pendaftaranId }] = await sql<{ id: string }[]>`
          insert into pendaftaran (akun_id, nomor, dikirim_pada, status, tahap, nama_lengkap, jenis_kelamin,
            tempat_lahir, tanggal_lahir, kabupaten_kota, provinsi, pendidikan_terakhir, program_id, bidang_kerja_id,
            bidang_kerja_belum_tahu, kemampuan_bahasa_jepang, nama_kontak_darurat, hubungan_kontak_darurat,
            nomor_hp_kontak_darurat, alasan_penutupan, keterangan_penutupan)
          values (${akunId}, ${uji.nomor}, ${uji.dikirimPada}, ${uji.status}, ${uji.tahap}, ${pemilik.namaLengkap},
            'Laki-laki', 'Cilacap', '2004-05-17', 'Kab. Cilacap', 'Jawa Tengah', 'SMK',
            (select id from program where nama = 'Tokutei Ginou (SSW)'),
            (select id from bidang_kerja where nama = 'Pembersihan gedung'),
            false, 'N5', 'Kontak Darurat Uji', 'Ibu', '6281234567890',
            ${ditutup ? ALASAN_PENUTUPAN : null},
            ${ditutup ? "Keterangan penutupan uji chip." : null})
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

test.beforeAll(isiPendaftaranUji);

const alamat = (uji: PendaftaranUji) => `/panel/pendaftaran/${uji.nomor}`;

/** Masuk sebagai pemilik akun uji, lalu menunggu halaman akunnya terbuka. */
async function masukSebagaiPemilikAkun(page: Page, pemilik: PemilikUji) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(pemilik.email);
  await page.getByLabel("Kata sandi").fill(KATA_SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL("/akun");
}

/** Membuka daftar pendaftaran di panel, dicari menurut "Chip Uji", sehingga hanya ketiga pendaftaran uji yang tampil. */
async function bukaDaftarUji(page: Page) {
  await page.goto("/panel/pendaftaran");
  await page.getByLabel("Cari nama atau nomor pendaftaran").fill("Chip Uji");
  await page.getByRole("button", { name: "Terapkan" }).click();
  const tabel = page.getByRole("table", { name: "Daftar pendaftaran" });
  await expect(tabel.locator("tbody tr")).toHaveCount(3);
  return tabel;
}

function ringkasan(page: Page) {
  return page.getByRole("region", { name: "Ringkasan pendaftaran" });
}

async function periksaTanpaGulirSamping(page: Page) {
  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
}

test("daftar pendaftaran dan halaman pendaftaran di panel menampilkan chip yang sama untuk Berjalan, Ditutup, dan Selesai (UAT-F8 langkah 2)", async ({
  page,
}) => {
  await masukKePanel(page, STAF);
  const tabel = await bukaDaftarUji(page);
  for (const uji of [BARU, LAMA, SELESAI]) {
    await periksaChip(
      tabel.locator("tbody tr").filter({ hasText: uji.nomor }),
      uji.status,
    );
  }

  for (const uji of [BARU, LAMA, SELESAI]) {
    await page.goto(alamat(uji));
    await periksaChip(ringkasan(page), uji.status);
  }
});

test("halaman akun dengan chip Berjalan dan chip Ditutup beserta alasannya tidak bergulir ke samping di lebar 375 px (UAT-F8 langkah 1)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await masukSebagaiPemilikAkun(page, EKO);

  await periksaChip(
    page.getByRole("region", { name: "Pendaftaranmu" }),
    "Berjalan",
  );
  const lama = page
    .getByRole("region", { name: "Pendaftaran yang ditutup" })
    .getByRole("listitem")
    .filter({ hasText: LAMA.nomor });
  await periksaChip(lama, "Ditutup");
  await expect(lama).toContainText(ALASAN_PENUTUPAN);

  await periksaTanpaGulirSamping(page);
});

test("daftar pendaftaran dan halaman pendaftaran dengan chip tidak bergulir ke samping di lebar 375 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await masukKePanel(page, STAF);
  await bukaDaftarUji(page);
  await periksaTanpaGulirSamping(page);

  for (const uji of [BARU, LAMA, SELESAI]) {
    await page.goto(alamat(uji));
    await periksaChip(ringkasan(page), uji.status);
    await periksaTanpaGulirSamping(page);
  }
});
