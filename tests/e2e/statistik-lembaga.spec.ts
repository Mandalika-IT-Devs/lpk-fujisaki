import { expect, type Page, test } from "@playwright/test";
import { ADMIN, masukKePanel, STAF } from "./pegawai-uji";

// Statistik lembaga (PRD §3.3, issue T07, UAT-C2, UAT-C3). Angka isi awal dan angka UAT adalah nilai contoh OD-07
// [CONTOH]: N5 65, N4 124, N3 21, N2 0; bidang kerja 88, 68, 30, 24; alumni 1.214; data per 28-08-2025.
// Total 210 dan 209 diambil dari contoh PRD §3.3 dan tests/golden/statistik-lembaga.json.
//
// Berkas ini berjalan sesudah semua berkas test lain (project "statistik-lembaga" di playwright.config.ts), karena
// test program dan bidang kerja menambah dan menonaktifkan bidang kerja, yang mengubah isian statistik ini.
// Test di berkas ini berjalan berurutan dan selalu mengembalikan angka isi awal.

type IsianStatistikUji = {
  dataPer: string;
  perLevel: Record<"N5" | "N4" | "N3" | "N2", string>;
  perBidangKerja: Record<string, string>;
  alumniDiJepang: string;
};

// [CONTOH] OD-07
const ISIAN_UAT: IsianStatistikUji = {
  dataPer: "2025-08-28",
  perLevel: { N5: "65", N4: "124", N3: "21", N2: "0" },
  perBidangKerja: {
    "Pembersihan gedung": "88",
    "Perawat lansia (kaigo)": "68",
    "Pengolahan makanan dan minuman": "30",
    Restoran: "24",
  },
  alumniDiJepang: "1214",
};

// Angka sintetis lain yang cocok (total 211), untuk membuktikan bahwa penyimpanan mengubah Beranda.
const ISIAN_LAIN: IsianStatistikUji = {
  dataPer: "2026-10-01",
  perLevel: { N5: "66", N4: "124", N3: "21", N2: "0" },
  perBidangKerja: { ...ISIAN_UAT.perBidangKerja, "Pembersihan gedung": "89" },
  alumniDiJepang: "1215",
};

const ALAMAT_PANEL = "/panel/statistik-lembaga";

async function bukaPanelStatistik(page: Page) {
  await masukKePanel(page, ADMIN);
  await page
    .getByRole("navigation", { name: "Menu panel pegawai" })
    .getByRole("link", { name: "Statistik lembaga" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Statistik lembaga" }),
  ).toBeVisible();
}

async function isiFormulirStatistik(
  page: Page,
  isian: Partial<IsianStatistikUji>,
) {
  const isi = page.getByRole("main");
  if (isian.dataPer !== undefined) {
    await isi.getByLabel("Data per").fill(isian.dataPer);
  }
  for (const [level, angka] of Object.entries(isian.perLevel ?? {})) {
    await isi
      .getByRole("group", { name: "Jumlah siswa per level" })
      .getByLabel(level, { exact: true })
      .fill(angka);
  }
  for (const [nama, angka] of Object.entries(isian.perBidangKerja ?? {})) {
    await isi
      .getByRole("group", { name: "Jumlah siswa per bidang kerja" })
      .getByLabel(nama, { exact: true })
      .fill(angka);
  }
  if (isian.alumniDiJepang !== undefined) {
    await isi.getByLabel("Jumlah alumni di Jepang").fill(isian.alumniDiJepang);
  }
}

async function simpan(page: Page) {
  await page.getByRole("button", { name: "Simpan statistik" }).click();
}

/** Stasiun peta jalur di Beranda, dicari dari nama tahapnya. */
function stasiun(page: Page, namaTahap: string) {
  return page
    .getByRole("region", { name: "Enam stasiun dari Cilacap ke Jepang" })
    .getByRole("listitem")
    .filter({
      has: page.getByRole("heading", { level: 3, name: namaTahap }),
    });
}

/** Angka statistik yang diharapkan tampil di Beranda. */
type TampilanBeranda = {
  totalSiswa: string;
  batangLevel: string;
  legenda: string[];
  perBidangKerja: RegExp[];
  papanJepang: string;
  dataPer: string;
};

const BERANDA_UAT: TampilanBeranda = {
  totalSiswa: "Siswa di kelas sekarang: 210",
  batangLevel: "N5 65 siswa, N4 124 siswa, N3 21 siswa, N2 0 siswa",
  legenda: ["N5 65", "N4 124", "N3 21", "N2 0"],
  perBidangKerja: [
    /^Pembersihan gedung\s*88$/,
    /^Perawat lansia \(kaigo\)\s*68$/,
    /^Pengolahan makanan dan minuman\s*30$/,
    /^Restoran\s*24$/,
  ],
  papanJepang:
    "Papan stasiun FG 06 Jepang, tujuan akhir. 1.214 alumni sudah tiba di sini sejak 2019. Sebelumnya: magang kerja, FG 05.",
  dataPer: "Data per 28-08-2025.",
};

async function periksaBeranda(page: Page, harapan: TampilanBeranda) {
  await page.goto("/");

  const fg02 = stasiun(page, "Belajar bahasa Jepang");
  await expect(fg02).toContainText(harapan.totalSiswa);
  await expect(
    fg02.getByRole("img", { name: harapan.batangLevel }),
  ).toBeVisible();
  await expect(
    fg02.getByRole("list", { name: "Siswa per level" }).getByRole("listitem"),
  ).toHaveText(harapan.legenda);

  const fg03 = stasiun(page, "Belajar tokutei ginou");
  await expect(
    fg03
      .getByRole("list", { name: "Bidang kerja yang paling diminati siswa" })
      .getByRole("listitem"),
  ).toHaveText(harapan.perBidangKerja);

  const fg06 = stasiun(page, "Persiapan berangkat");
  const papan = fg06.getByRole("img", { name: harapan.papanJepang });
  await expect(papan).toBeVisible();
  await expect(fg06).toContainText(harapan.dataPer);
}

test("isi awal [CONTOH] OD-07 tampil di Beranda di FG 02, FG 03, dan FG 06", async ({
  page,
}) => {
  await periksaBeranda(page, BERANDA_UAT);
  await expect(
    stasiun(page, "Persiapan berangkat").getByRole("img", {
      name: BERANDA_UAT.papanJepang,
    }),
  ).toContainText("1.214 alumnisudah tiba di sini sejak 2019.");
});

test("panel statistik terisi angka yang tersimpan, dengan satu isian untuk setiap bidang kerja aktif", async ({
  page,
}) => {
  await bukaPanelStatistik(page);
  const isi = page.getByRole("main");

  await expect(isi.getByLabel("Data per")).toHaveValue(ISIAN_UAT.dataPer);
  const perLevel = isi.getByRole("group", { name: "Jumlah siswa per level" });
  for (const [level, angka] of Object.entries(ISIAN_UAT.perLevel)) {
    await expect(perLevel.getByLabel(level, { exact: true })).toHaveValue(
      angka,
    );
  }
  const perBidangKerja = isi.getByRole("group", {
    name: "Jumlah siswa per bidang kerja",
  });
  await expect(perBidangKerja.getByRole("spinbutton")).toHaveCount(4);
  for (const [nama, angka] of Object.entries(ISIAN_UAT.perBidangKerja)) {
    await expect(perBidangKerja.getByLabel(nama, { exact: true })).toHaveValue(
      angka,
    );
  }
  await expect(isi.getByLabel("Jumlah alumni di Jepang")).toHaveValue(
    ISIAN_UAT.alumniDiJepang,
  );
});

test("Admin mengisi 65/124/21/0 dan 88/68/30/24, tersimpan, dan Beranda menampilkan total 210 (UAT-C2)", async ({
  page,
}) => {
  await bukaPanelStatistik(page);

  // Simpan dulu angka lain supaya terbukti bahwa penyimpanan mengubah Beranda.
  await isiFormulirStatistik(page, ISIAN_LAIN);
  await simpan(page);
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    "Statistik lembaga sudah disimpan dan tampil di Beranda. Total siswa 211.",
  );
  await periksaBeranda(page, {
    totalSiswa: "Siswa di kelas sekarang: 211",
    batangLevel: "N5 66 siswa, N4 124 siswa, N3 21 siswa, N2 0 siswa",
    legenda: ["N5 66", "N4 124", "N3 21", "N2 0"],
    perBidangKerja: [
      /^Pembersihan gedung\s*89$/,
      ...BERANDA_UAT.perBidangKerja.slice(1),
    ],
    papanJepang:
      "Papan stasiun FG 06 Jepang, tujuan akhir. 1.215 alumni sudah tiba di sini sejak 2019. Sebelumnya: magang kerja, FG 05.",
    dataPer: "Data per 01-10-2026.",
  });

  await page.goto(ALAMAT_PANEL);
  await isiFormulirStatistik(page, ISIAN_UAT);
  await simpan(page);
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    "Statistik lembaga sudah disimpan dan tampil di Beranda. Total siswa 210.",
  );
  await page.reload();
  await expect(
    page
      .getByRole("group", { name: "Jumlah siswa per level" })
      .getByLabel("N4", { exact: true }),
  ).toHaveValue("124");
  await periksaBeranda(page, BERANDA_UAT);
});

test("mengubah bidang kerja terakhir menjadi 23 ditolak dengan pesan yang menyebut 209 dan 210, dan Beranda tidak berubah (UAT-C3)", async ({
  page,
}) => {
  await bukaPanelStatistik(page);

  await isiFormulirStatistik(page, { perBidangKerja: { Restoran: "23" } });
  await simpan(page);

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Jumlah siswa per bidang kerja 209 tidak sama dengan total siswa 210 (N5 + N4 + N3 + N2). Ubah angka per bidang kerja atau per level supaya keduanya sama, lalu simpan lagi.",
  );
  await expect(
    page
      .getByRole("group", { name: "Jumlah siswa per bidang kerja" })
      .getByLabel("Restoran", { exact: true }),
  ).toHaveValue("23");

  await periksaBeranda(page, BERANDA_UAT);
  await page.goto(ALAMAT_PANEL);
  await expect(
    page
      .getByRole("group", { name: "Jumlah siswa per bidang kerja" })
      .getByLabel("Restoran", { exact: true }),
  ).toHaveValue("24");
});

test("angka yang bukan bilangan bulat 0 atau lebih ditolak di server dengan pesan berbahasa Indonesia", async ({
  page,
}) => {
  await bukaPanelStatistik(page);

  for (const [isian, pesan] of [
    [
      { alumniDiJepang: "1000000000" },
      "Jumlah alumni di Jepang terlalu besar. Isi paling banyak 999.999.999.",
    ],
    [
      { alumniDiJepang: "1.214" },
      "Jumlah alumni di Jepang belum benar. Isi dengan bilangan bulat 0 atau lebih, tanpa titik atau koma, misalnya 1214.",
    ],
    [
      { perLevel: { N5: "-1", N4: "124", N3: "21", N2: "0" } },
      "Jumlah siswa N5 belum benar. Isi dengan bilangan bulat 0 atau lebih, tanpa titik atau koma, misalnya 124.",
    ],
    [
      { perBidangKerja: { Restoran: "" } },
      "Jumlah siswa Restoran belum benar. Isi dengan bilangan bulat 0 atau lebih, tanpa titik atau koma, misalnya 124.",
    ],
    [
      { dataPer: "" },
      "Tanggal data per belum benar. Pilih tanggal angka-angka ini dihitung, misalnya 28-08-2025.",
    ],
  ] as const) {
    await page.goto(ALAMAT_PANEL);
    // Lewati pemeriksaan isian di browser supaya validasi server yang diuji.
    await page
      .getByRole("main")
      .locator("form")
      .evaluate((formulir) => {
        formulir.setAttribute("novalidate", "");
      });
    await isiFormulirStatistik(page, isian);
    await simpan(page);

    await expect(page.getByRole("main").getByRole("alert")).toHaveText(pesan);
  }

  await periksaBeranda(page, BERANDA_UAT);
});

test("bidang kerja yang ditambahkan saat formulir terbuka: penyimpanan ditolak dan formulir diperbarui", async ({
  page,
}) => {
  const BIDANG_BARU = "Bidang Statistik Uji";
  await bukaPanelStatistik(page);

  // Admin lain menambah bidang kerja saat formulir statistik masih terbuka.
  const halamanLain = await page.context().newPage();
  await halamanLain.goto("/panel/bidang-kerja");
  const tambah = halamanLain.getByRole("region", {
    name: "Tambah bidang kerja",
  });
  await tambah.getByLabel("Nama bidang kerja").fill(BIDANG_BARU);
  await tambah.getByRole("button", { name: "Tambah bidang kerja" }).click();
  await expect(tambah.getByRole("status")).toHaveText(
    `${BIDANG_BARU} sudah ditambahkan dan tampil di situs publik.`,
  );

  await simpan(page);

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Daftar bidang kerja aktif berubah sejak halaman ini dibuka, jadi statistik belum disimpan. Formulir sudah diperbarui: isi angka setiap bidang kerja, lalu simpan lagi.",
  );
  const perBidangKerja = page.getByRole("group", {
    name: "Jumlah siswa per bidang kerja",
  });
  await expect(perBidangKerja.getByRole("spinbutton")).toHaveCount(5);
  await expect(
    perBidangKerja.getByLabel(BIDANG_BARU, { exact: true }),
  ).toHaveValue("");
  await expect(
    perBidangKerja.getByLabel("Restoran", { exact: true }),
  ).toHaveValue("24");

  // Kembalikan daftar bidang kerja aktif seperti semula.
  await halamanLain.goto("/panel/bidang-kerja");
  await halamanLain
    .getByRole("main")
    .getByRole("row")
    .filter({
      has: halamanLain.getByRole("rowheader", {
        name: BIDANG_BARU,
        exact: true,
      }),
    })
    .getByRole("button", { name: `Nonaktifkan ${BIDANG_BARU}` })
    .click();
  await expect(
    halamanLain
      .getByRole("region", { name: "Daftar bidang kerja" })
      .getByRole("status"),
  ).toHaveText(
    `${BIDANG_BARU} sekarang nonaktif dan tidak tampil di situs publik.`,
  );

  await periksaBeranda(page, BERANDA_UAT);
});

test.describe("hanya Admin yang bisa membuka halaman statistik lembaga", () => {
  test("Staf ditolak dengan 403", async ({ page }) => {
    await masukKePanel(page, STAF);

    const jawaban = await page.goto(ALAMAT_PANEL);

    expect(jawaban?.status()).toBe(403);
    await expect(
      page.getByRole("heading", { level: 1, name: "Akses ditolak" }),
    ).toBeVisible();
    await expect(page.getByRole("main").getByRole("spinbutton")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Simpan statistik" }),
    ).toHaveCount(0);
  });

  test("pengunjung diarahkan ke halaman masuk", async ({ page }) => {
    await page.goto(ALAMAT_PANEL);

    await expect(page).toHaveURL("/panel/masuk");
  });
});

test("halaman statistik lembaga tidak bergulir ke samping di lebar 375 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await bukaPanelStatistik(page);

  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
});
