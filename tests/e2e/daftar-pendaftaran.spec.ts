import { expect, type Page, test } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import postgres from "postgres";
import { ADMIN, masukKePanel, STAF } from "./pegawai-uji";

// Daftar pendaftaran di panel pegawai (issue T14, PRD §11.1, UAT-K1 tanpa saringan kelas).
// Pendaftaran uji diisi langsung ke database test, karena penutupan dan pindah tahap belum punya halaman. Semuanya
// dikirim pada 2025, jadi nomornya (FGC-2025-…) tidak pernah bertabrakan dengan nomor yang diberikan test lain saat
// mengirim formulir. Test lain bisa menambah pendaftaran kapan saja, jadi pemeriksaan di sini hanya memastikan bahwa
// setiap baris yang tampil cocok, bahwa pendaftaran uji yang cocok tampil berurutan, dan yang tidak cocok tidak tampil.

type PendaftaranUji = {
  nomor: string;
  namaLengkap: string;
  program: string;
  /** null berarti "Belum tahu". */
  bidangKerja: string | null;
  tahap: number;
  status: "Berjalan" | "Ditutup" | "Selesai";
  dikirimPada: string;
};

const SITI: PendaftaranUji = {
  nomor: "FGC-2025-0905",
  namaLengkap: "Siti Aminah",
  program: "Tokutei Ginou (SSW)",
  bidangKerja: "Pembersihan gedung",
  tahap: 1,
  status: "Berjalan",
  dikirimPada: "2025-03-10T02:00:00Z",
};
const DEWI: PendaftaranUji = {
  nomor: "FGC-2025-0904",
  namaLengkap: "Dewi Lestari",
  program: "Tokutei Ginou (SSW)",
  bidangKerja: null,
  tahap: 1,
  status: "Ditutup",
  dikirimPada: "2025-03-09T02:00:00Z",
};
const AGUS: PendaftaranUji = {
  nomor: "FGC-2025-0903",
  namaLengkap: "Agus Setiawan",
  program: "Pemagangan",
  bidangKerja: "Pembersihan gedung",
  tahap: 1,
  status: "Ditutup",
  dikirimPada: "2025-03-08T02:00:00Z",
};
const AHMAD: PendaftaranUji = {
  nomor: "FGC-2025-0902",
  namaLengkap: "Ahmad Fauzi",
  program: "Tokutei Ginou (SSW)",
  bidangKerja: "Pembersihan gedung",
  tahap: 2,
  status: "Berjalan",
  dikirimPada: "2025-03-07T02:00:00Z",
};
const BUDI: PendaftaranUji = {
  nomor: "FGC-2025-0901",
  namaLengkap: "Budi Santoso",
  program: "Gijinkoku",
  bidangKerja: "Pembersihan gedung",
  tahap: 6,
  status: "Selesai",
  dikirimPada: "2025-03-06T02:00:00Z",
};
const PENDAFTARAN_UJI = [SITI, DEWI, AGUS, AHMAD, BUDI];

/** 30 pendaftaran untuk pembagian halaman, dikirim satu jam sekali sejak 01-01-2025, di tahap 3. */
const NAMA_HALAMAN = "Peserta Halaman Uji";
const PENDAFTARAN_HALAMAN: PendaftaranUji[] = Array.from(
  { length: 30 },
  (_, i) => {
    const urutan = String(i + 1).padStart(2, "0");
    return {
      nomor: `FGC-2025-08${urutan}`,
      namaLengkap: `${NAMA_HALAMAN} ${urutan}`,
      program: "Pemagangan",
      bidangKerja: "Pembersihan gedung",
      tahap: 3,
      status: "Berjalan",
      dikirimPada: new Date(Date.UTC(2025, 0, 1, i)).toISOString(),
    };
  },
);

/** Pemilik pendaftaran Siti Aminah bisa masuk ke akunnya, untuk memeriksa bahwa ia tidak bisa membuka daftar. */
const PEMILIK_AKUN_SITI = {
  email: "daftar.uji.siti@contoh.test",
  kataSandi: "sandi-calon-uji",
};

/** Mengisi pendaftaran uji, masing-masing dengan akun pemiliknya sendiri. Aman diulang bila test dicoba lagi. */
async function isiPendaftaranUji() {
  const sql = postgres(process.env.DATABASE_URL ?? "", { onnotice: () => {} });
  try {
    await sql`delete from akun where email like 'daftar.uji.%@contoh.test'`;
    const semua = [...PENDAFTARAN_UJI, ...PENDAFTARAN_HALAMAN];
    for (const [i, uji] of semua.entries()) {
      const email =
        uji === SITI
          ? PEMILIK_AKUN_SITI.email
          : `daftar.uji.${uji.nomor.toLowerCase()}@contoh.test`;
      const [{ id: akunId }] = await sql<{ id: string }[]>`
        insert into akun (name, email, email_verified, jenis, nomor_whatsapp, waktu_persetujuan)
        values (${uji.namaLengkap}, ${email}, true, 'pemilik_akun',
                ${`628120000${String(1401 + i)}`}, now())
        returning id`;
      if (uji === SITI) {
        await sql`
          insert into kredensial (account_id, provider_id, user_id, password)
          values (${akunId}, 'credential', ${akunId}, ${await hashPassword(PEMILIK_AKUN_SITI.kataSandi)})`;
      }
      await sql`
        insert into pendaftaran (akun_id, nomor, dikirim_pada, status, tahap, nama_lengkap, jenis_kelamin, tempat_lahir,
          tanggal_lahir, kabupaten_kota, provinsi, pendidikan_terakhir, program_id, bidang_kerja_id,
          bidang_kerja_belum_tahu, kemampuan_bahasa_jepang, nama_kontak_darurat, hubungan_kontak_darurat,
          nomor_hp_kontak_darurat)
        values (${akunId}, ${uji.nomor}, ${uji.dikirimPada}, ${uji.status}, ${uji.tahap}, ${uji.namaLengkap},
          'Perempuan', 'Cilacap', '2004-05-17', 'Kab. Cilacap', 'Jawa Tengah', 'SMK',
          (select id from program where nama = ${uji.program}),
          (select id from bidang_kerja where nama = ${uji.bidangKerja}),
          ${uji.bidangKerja === null}, 'N5', 'Kontak Darurat Uji', 'Ibu', '6281234567890')`;
    }
  } finally {
    await sql.end();
  }
}

test.beforeAll(isiPendaftaranUji);

type Baris = {
  nomor: string;
  nama: string;
  program: string;
  bidangKerja: string;
  tahap: string;
  status: string;
  tanggalKirim: string;
};

/** Baris daftar pendaftaran yang tampil, dari atas ke bawah. */
async function bacaBaris(page: Page): Promise<Baris[]> {
  return page
    .getByRole("table", { name: "Daftar pendaftaran" })
    .locator("tbody tr")
    .evaluateAll((daftar) =>
      daftar.map((baris) => {
        const [nomor, nama, program, bidangKerja, tahap, status, tanggalKirim] =
          [...baris.children].map((sel) => sel.textContent?.trim() ?? "");
        return {
          nomor,
          nama,
          program,
          bidangKerja,
          tahap,
          status,
          tanggalKirim,
        };
      }),
    );
}

/** Tanggal DD-MM-YYYY sebagai YYYYMMDD, supaya bisa dibandingkan. */
const urutanTanggal = (tanggal: string) =>
  tanggal.split("-").reverse().join("");

/**
 * Setiap baris yang tampil memenuhi `cocok`, baris diurutkan dari tanggal kirim terbaru, dan pendaftaran uji yang
 * tampil persis `diharapkan`, dalam urutan itu.
 */
async function periksaDaftar(
  page: Page,
  cocok: (baris: Baris) => boolean,
  diharapkan: readonly PendaftaranUji[],
) {
  const nomorUji = new Set(
    [...PENDAFTARAN_UJI, ...PENDAFTARAN_HALAMAN].map(({ nomor }) => nomor),
  );
  await expect(async () => {
    const baris = await bacaBaris(page);
    for (const satu of baris) {
      expect(
        cocok(satu),
        `baris yang tidak cocok: ${JSON.stringify(satu)}`,
      ).toBe(true);
    }
    const tanggal = baris.map(({ tanggalKirim }) =>
      urutanTanggal(tanggalKirim),
    );
    expect(tanggal).toEqual(tanggal.toSorted().reverse());
    expect(
      baris.map(({ nomor }) => nomor).filter((nomor) => nomorUji.has(nomor)),
    ).toEqual(diharapkan.map(({ nomor }) => nomor));
  }).toPass();
}

/** Formulir saringan dan pencarian di atas daftar. */
function saringan(page: Page) {
  return page.getByRole("search", { name: "Saring dan cari pendaftaran" });
}

async function terapkan(page: Page) {
  await saringan(page).getByRole("button", { name: "Terapkan" }).click();
}

async function cari(page: Page, teks: string) {
  await saringan(page)
    .getByLabel("Cari nama atau nomor pendaftaran")
    .fill(teks);
  await terapkan(page);
}

test("Staf menyaring menurut tahap 1, lalu status Ditutup, lalu program SSW; setiap saringan hanya menampilkan pendaftaran yang cocok, terbaru di atas (UAT-K1 langkah 1)", async ({
  page,
}) => {
  await masukKePanel(page, STAF);
  await expect(
    page.getByRole("table", { name: "Daftar pendaftaran" }),
  ).toBeVisible();
  const kolom = await page
    .getByRole("table", { name: "Daftar pendaftaran" })
    .getByRole("columnheader")
    .allTextContents();
  expect(kolom).toEqual([
    "Nomor pendaftaran",
    "Nama",
    "Program",
    "Bidang kerja",
    "Tahap",
    "Status",
    "Tanggal kirim",
  ]);

  await saringan(page)
    .getByLabel("Tahap")
    .selectOption({ label: "FG 01 Pendaftaran dan seleksi" });
  await terapkan(page);
  await expect(page).toHaveURL(/tahap=1/);
  await periksaDaftar(page, (baris) => baris.tahap.includes("FG 01"), [
    SITI,
    DEWI,
    AGUS,
  ]);

  await saringan(page).getByLabel("Status").selectOption("Ditutup");
  await terapkan(page);
  await expect(page).toHaveURL(/status=Ditutup/);
  await periksaDaftar(
    page,
    (baris) => baris.tahap.includes("FG 01") && baris.status === "Ditutup",
    [DEWI, AGUS],
  );

  await saringan(page)
    .getByLabel("Program")
    .selectOption({ label: "Tokutei Ginou (SSW)" });
  await terapkan(page);
  await expect(page).toHaveURL(/program=/);
  await periksaDaftar(
    page,
    (baris) =>
      baris.tahap.includes("FG 01") &&
      baris.status === "Ditutup" &&
      baris.program === "Tokutei Ginou (SSW)",
    [DEWI],
  );
  const [dewi] = await bacaBaris(page);
  expect(dewi).toMatchObject({
    nomor: DEWI.nomor,
    nama: "Dewi Lestari",
    bidangKerja: "Belum tahu",
    status: "Ditutup",
    tanggalKirim: "09-03-2025",
  });
  expect(dewi.tahap).toContain("Pendaftaran dan seleksi");
});

test("saringan bidang kerja hanya menampilkan pendaftaran yang memilih bidang kerja itu", async ({
  page,
}) => {
  await masukKePanel(page, STAF);

  await saringan(page).getByLabel("Bidang kerja").selectOption("Belum tahu");
  await terapkan(page);

  await periksaDaftar(page, (baris) => baris.bidangKerja === "Belum tahu", [
    DEWI,
  ]);
});

test('pencarian "siti" menemukan "Siti Aminah", lalu pencarian nomor pendaftaran hanya menemukan pendaftaran itu (UAT-K1 langkah 2)', async ({
  page,
}) => {
  await masukKePanel(page, STAF);

  await cari(page, "siti");
  await periksaDaftar(
    page,
    (baris) =>
      baris.nama.toLowerCase().includes("siti") ||
      baris.nomor.toLowerCase().includes("siti"),
    [SITI],
  );
  await expect(
    page.getByRole("table", { name: "Daftar pendaftaran" }),
  ).toContainText("Siti Aminah");

  await cari(page, AGUS.nomor);
  await expect(page).toHaveURL(/cari=FGC-2025-0903/);
  await expect(async () => {
    expect((await bacaBaris(page)).map(({ nomor }) => nomor)).toEqual([
      AGUS.nomor,
    ]);
  }).toPass();
});

test("Admin juga melihat daftar pendaftaran", async ({ page }) => {
  await masukKePanel(page, ADMIN);

  await cari(page, "Siti Aminah");

  await periksaDaftar(
    page,
    (baris) => baris.nama.toLowerCase().includes("siti aminah"),
    [SITI],
  );
});

test("hasil yang banyak dibagi per 25 pendaftaran, dan saringannya tetap berlaku di halaman berikutnya", async ({
  page,
}) => {
  await masukKePanel(page, STAF);

  await cari(page, NAMA_HALAMAN);
  await expect(
    page.getByText("Menampilkan 1–25 dari 30 pendaftaran."),
  ).toBeVisible();
  const halaman1 = await bacaBaris(page);
  expect(halaman1).toHaveLength(25);
  expect(halaman1[0].nama).toBe(`${NAMA_HALAMAN} 30`);
  expect(halaman1[24].nama).toBe(`${NAMA_HALAMAN} 06`);

  const navigasi = page.getByRole("navigation", {
    name: "Halaman daftar pendaftaran",
  });
  await navigasi.getByRole("link", { name: "Berikutnya" }).click();
  await expect(page).toHaveURL(/halaman=2/);
  await expect(
    page.getByText("Menampilkan 26–30 dari 30 pendaftaran."),
  ).toBeVisible();
  expect((await bacaBaris(page)).map(({ nama }) => nama)).toEqual([
    `${NAMA_HALAMAN} 05`,
    `${NAMA_HALAMAN} 04`,
    `${NAMA_HALAMAN} 03`,
    `${NAMA_HALAMAN} 02`,
    `${NAMA_HALAMAN} 01`,
  ]);
  await expect(navigasi.getByRole("link", { name: "Berikutnya" })).toHaveCount(
    0,
  );

  await navigasi.getByRole("link", { name: "Sebelumnya" }).click();
  await expect(
    page.getByText("Menampilkan 1–25 dari 30 pendaftaran."),
  ).toBeVisible();
});

test("pencarian yang tidak menemukan apa pun memberi tahu bahwa tidak ada pendaftaran yang cocok", async ({
  page,
}) => {
  await masukKePanel(page, STAF);

  await cari(page, "tidak ada nama seperti ini");

  await expect(page.getByRole("main")).toContainText(
    "Tidak ada pendaftaran yang cocok dengan saringan dan pencarian ini.",
  );
  await expect(
    page.getByRole("table", { name: "Daftar pendaftaran" }),
  ).toHaveCount(0);
});

test("pengunjung tidak bisa membuka daftar pendaftaran", async ({ page }) => {
  await page.goto("/panel/pendaftaran?cari=siti");

  await expect(page).toHaveURL("/panel/masuk");
  await expect(page.getByText("Siti Aminah")).toHaveCount(0);
});

test("pemilik akun tidak bisa membuka daftar pendaftaran, juga pemilik pendaftaran di daftar itu", async ({
  page,
}) => {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(PEMILIK_AKUN_SITI.email);
  await page.getByLabel("Kata sandi").fill(PEMILIK_AKUN_SITI.kataSandi);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL("/akun");

  await page.goto("/panel/pendaftaran?cari=siti");

  await expect(page).toHaveURL("/panel/masuk");
  await expect(
    page.getByRole("table", { name: "Daftar pendaftaran" }),
  ).toHaveCount(0);
  await expect(page.getByText(SITI.nomor)).toHaveCount(0);
});

test("daftar pendaftaran tidak bergulir ke samping di lebar 375 px; tabelnya bergeser di dalam bingkainya sendiri", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await masukKePanel(page, STAF);
  await expect(
    page.getByRole("table", { name: "Daftar pendaftaran" }),
  ).toBeVisible();

  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
});
