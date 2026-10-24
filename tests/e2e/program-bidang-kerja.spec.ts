import { expect, type Page, test } from "@playwright/test";
import { ADMIN, masukKePanel, STAF } from "./pegawai-uji";

// Program dan bidang kerja (PRD §3.1, §4, issue T06). Isi awal dari issue T06: empat program dengan batas usia
// 18–30 tahun (▶ Keputusan OD-01) dan empat bidang kerja (PRD §4.2). Teks program lainnya nilai contoh OD-08.
// Test di berkas ini berjalan berurutan dan mengembalikan setiap program dan bidang kerja yang dinonaktifkan,
// supaya isi awal tetap utuh untuk berkas test lain.

const PROGRAM_AWAL = [
  "Tokutei Ginou (SSW)",
  "Pemagangan",
  "Gijinkoku",
  "Pelajar",
];
const BIDANG_KERJA_AWAL = [
  "Pembersihan gedung",
  "Perawat lansia (kaigo)",
  "Pengolahan makanan dan minuman",
  "Restoran",
];

/** Daftar program di halaman Program: setiap program adalah satu cabang dengan judul h2. */
function daftarProgram(page: Page) {
  return page.getByRole("list", { name: "Daftar program" });
}

/** Bagian program di Beranda; judulnya menyebut jumlah program aktif, misalnya "Empat program, satu jalur". */
function bagianProgramBeranda(page: Page) {
  return page.getByRole("region", { name: /program, satu jalur$/ });
}

async function bukaMenuPanel(page: Page, nama: "Program" | "Bidang kerja") {
  await masukKePanel(page, ADMIN);
  await page
    .getByRole("navigation", { name: "Menu panel pegawai" })
    .getByRole("link", { name: nama })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: nama }),
  ).toBeVisible();
}

/** Baris sebuah program atau bidang kerja di tabel panel, dicari dari namanya persis. */
function barisPanel(page: Page, nama: string) {
  return page
    .getByRole("main")
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name: nama, exact: true }) });
}

type IsianProgramUji = {
  nama: string;
  deskripsi: string;
  syarat: string;
  lamaPelatihan: string;
  usiaMinimal: string;
  usiaMaksimal: string;
};

async function isiFormulirProgram(page: Page, isian: Partial<IsianProgramUji>) {
  const label: Record<keyof IsianProgramUji, string> = {
    nama: "Nama program",
    deskripsi: "Deskripsi",
    syarat: "Syarat",
    lamaPelatihan: "Lama pelatihan",
    usiaMinimal: "Usia minimal (tahun)",
    usiaMaksimal: "Usia maksimal (tahun)",
  };
  for (const [kunci, nilai] of Object.entries(isian)) {
    await page.getByLabel(label[kunci as keyof IsianProgramUji]).fill(nilai);
  }
}

function bagianBidangKerja(page: Page) {
  return page.getByRole("region", { name: "Bidang kerja" });
}

test("isi awal: halaman Program menampilkan empat program 18–30 tahun dan empat bidang kerja", async ({
  page,
}) => {
  await page.goto("/program");

  await expect(
    page.getByRole("heading", { level: 1, name: "Program" }),
  ).toBeVisible();
  const daftar = daftarProgram(page);
  await expect(daftar.getByRole("heading", { level: 2 })).toHaveText(
    PROGRAM_AWAL,
  );
  await expect(daftar.getByRole("listitem")).toHaveCount(4);
  for (const baris of await daftar.getByRole("listitem").all()) {
    await expect(baris).toContainText("Usia 18–30 tahun");
    await expect(baris).toContainText("[CONTOH]");
  }
  await expect(bagianBidangKerja(page).getByRole("listitem")).toHaveText(
    BIDANG_KERJA_AWAL,
  );
});

test("halaman rincian program memuat deskripsi, batas usia, lama pelatihan, dan syarat", async ({
  page,
}) => {
  await page.goto("/program");

  await daftarProgram(page)
    .getByRole("link", { name: "Rincian Tokutei Ginou (SSW)" })
    .click();

  await expect(page).toHaveURL(/\/program\/\d+$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Tokutei Ginou (SSW)" }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/^Tokutei Ginou \(SSW\)/);
  const isi = page.getByRole("main");
  await expect(isi).toContainText("visa pekerja berketerampilan khusus");
  await expect(isi.getByRole("term")).toHaveText([
    "Batas usia",
    "Lama pelatihan",
  ]);
  await expect(isi.getByRole("definition")).toHaveText([
    "18–30 tahun",
    "6–8 bulan [CONTOH]",
  ]);
  await expect(isi.getByRole("region", { name: "Syarat" })).toContainText(
    "Sehat jasmani dan rohani",
  );

  await isi.getByRole("link", { name: "Semua program" }).click();
  await expect(page).toHaveURL("/program");
});

test("halaman rincian program tidak bergulir ke samping di lebar 375 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/program");
  await daftarProgram(page)
    .getByRole("link", { name: "Rincian Pemagangan" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Pemagangan" }),
  ).toBeVisible();

  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
});

test("alamat rincian program yang tidak ada menjawab 404 berbahasa Indonesia", async ({
  page,
}) => {
  for (const alamat of ["/program/999999", "/program/bukan-angka"]) {
    const jawaban = await page.goto(alamat);

    expect(jawaban?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "Program tidak ditemukan" }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText("Lihat semua program");
  }
});

test("isi awal: Beranda menampilkan empat program sebagai cabang dari garis jalur", async ({
  page,
}) => {
  await page.goto("/");

  const bagian = bagianProgramBeranda(page);
  await expect(
    bagian.getByRole("heading", {
      level: 2,
      name: "Empat program, satu jalur",
    }),
  ).toBeVisible();
  await expect(bagian.getByRole("heading", { level: 3 })).toHaveText(
    PROGRAM_AWAL,
  );
  // Setiap cabang: ruas biru 6px dari tulang garis dan titik 20px di atasnya.
  const cabang = await bagian
    .getByRole("listitem")
    .first()
    .evaluate((li) => {
      const ruas = getComputedStyle(li, "::before");
      const titik = getComputedStyle(li, "::after");
      return { tinggiRuas: ruas.height, lebarTitik: titik.width };
    });
  expect(cabang).toEqual({ tinggiRuas: "6px", lebarTitik: "20px" });
  await expect(
    bagian.getByRole("link", { name: "Rincian Pelajar" }),
  ).toHaveAttribute("href", /^\/program\/\d+$/);
});

const PROGRAM_UJI: IsianProgramUji = {
  nama: "Program Uji",
  deskripsi: "Deskripsi program uji.",
  syarat: "Syarat program uji.",
  lamaPelatihan: "3 bulan",
  usiaMinimal: "20",
  usiaMaksimal: "25",
};

test("Admin menambah program, dan program baru tampil di halaman Program dan Beranda", async ({
  page,
}) => {
  await bukaMenuPanel(page, "Program");
  await expect(
    page.getByRole("region", { name: "Daftar program" }).getByRole("rowheader"),
  ).toHaveText(PROGRAM_AWAL);
  await expect(barisPanel(page, "Pelajar").getByRole("cell")).toHaveText([
    "18–30 tahun",
    "Aktif",
    /.*/,
  ]);

  const tambah = page.getByRole("region", { name: "Tambah program" });
  await isiFormulirProgram(page, PROGRAM_UJI);
  await tambah.getByRole("button", { name: "Tambah program" }).click();

  await expect(tambah.getByRole("status")).toHaveText(
    "Program Uji sudah ditambahkan dan tampil di situs publik.",
  );
  await expect(tambah.getByLabel("Nama program")).toHaveValue("");
  await expect(barisPanel(page, "Program Uji").getByRole("cell")).toHaveText([
    "20–25 tahun",
    "Aktif",
    /.*/,
  ]);

  await page.goto("/program");
  const baris = daftarProgram(page)
    .getByRole("listitem")
    .filter({ hasText: "Program Uji" });
  await expect(baris).toContainText("Deskripsi program uji.");
  await expect(baris).toContainText("Usia 20–25 tahun");

  await page.goto("/");
  await expect(
    bagianProgramBeranda(page).getByRole("heading", { level: 2 }),
  ).toHaveText("Lima program, satu jalur");
  await expect(
    bagianProgramBeranda(page).getByRole("heading", { level: 3 }),
  ).toHaveText([...PROGRAM_AWAL, "Program Uji"]);
});

test("Admin mengubah program, lalu menonaktifkannya", async ({ page }) => {
  await bukaMenuPanel(page, "Program");
  await barisPanel(page, "Program Uji")
    .getByRole("link", { name: "Ubah Program Uji" })
    .click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Ubah program" }),
  ).toBeVisible();
  await expect(page.getByLabel("Nama program")).toHaveValue("Program Uji");
  await expect(page.getByLabel("Usia maksimal (tahun)")).toHaveValue("25");
  await isiFormulirProgram(page, {
    nama: "Program Uji Diubah",
    syarat: "Syarat yang diubah.",
    usiaMaksimal: "28",
  });
  await page.getByRole("button", { name: "Simpan perubahan" }).click();

  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    "Perubahan Program Uji Diubah sudah disimpan.",
  );
  await page.reload();
  await expect(page.getByLabel("Nama program")).toHaveValue(
    "Program Uji Diubah",
  );

  await page.goto("/program");
  await daftarProgram(page)
    .getByRole("link", { name: "Rincian Program Uji Diubah" })
    .click();
  await expect(page.getByRole("main")).toContainText("20–28 tahun");
  await expect(page.getByRole("main")).toContainText("Syarat yang diubah.");
  const alamatRincian = page.url();

  await page.goto("/panel/program");
  await barisPanel(page, "Program Uji Diubah")
    .getByRole("button", { name: "Nonaktifkan Program Uji Diubah" })
    .click();
  await expect(
    page.getByRole("region", { name: "Daftar program" }).getByRole("status"),
  ).toHaveText(
    "Program Uji Diubah sekarang nonaktif dan tidak tampil di situs publik.",
  );
  await expect(
    barisPanel(page, "Program Uji Diubah").getByRole("cell").nth(1),
  ).toHaveText("Nonaktif");

  await page.goto("/program");
  await expect(
    daftarProgram(page).getByRole("heading", { level: 2 }),
  ).toHaveText(PROGRAM_AWAL);
  expect((await page.goto(alamatRincian))?.status()).toBe(404);
});

test("usia minimal yang lebih besar dari usia maksimal ditolak dengan pesan yang jelas", async ({
  page,
}) => {
  const PESAN =
    "Usia minimal 31 tahun lebih besar dari usia maksimal 30 tahun. Ubah salah satunya supaya usia minimal tidak lebih dari usia maksimal, lalu simpan lagi.";
  await bukaMenuPanel(page, "Program");

  const tambah = page.getByRole("region", { name: "Tambah program" });
  await isiFormulirProgram(page, {
    ...PROGRAM_UJI,
    nama: "Program Usia Terbalik",
    usiaMinimal: "31",
    usiaMaksimal: "30",
  });
  await tambah.getByRole("button", { name: "Tambah program" }).click();

  await expect(tambah.getByRole("alert")).toHaveText(PESAN);
  await expect(tambah.getByLabel("Nama program")).toHaveValue(
    "Program Usia Terbalik",
  );
  await expect(tambah.getByLabel("Usia minimal (tahun)")).toHaveValue("31");
  await expect(barisPanel(page, "Program Usia Terbalik")).toHaveCount(0);

  await barisPanel(page, "Pelajar")
    .getByRole("link", { name: "Ubah Pelajar" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Ubah program" }),
  ).toBeVisible();
  await isiFormulirProgram(page, { usiaMinimal: "31", usiaMaksimal: "30" });
  await page.getByRole("button", { name: "Simpan perubahan" }).click();

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(PESAN);
  await page.reload();
  await expect(page.getByLabel("Usia minimal (tahun)")).toHaveValue("18");
  await expect(page.getByLabel("Usia maksimal (tahun)")).toHaveValue("30");
});

test("isian program yang kosong ditolak di server dengan pesan berbahasa Indonesia", async ({
  page,
}) => {
  await bukaMenuPanel(page, "Program");
  const tambah = page.getByRole("region", { name: "Tambah program" });
  // Lewati pemeriksaan isian wajib di browser supaya validasi server yang diuji.
  await tambah.locator("form").evaluate((formulir) => {
    formulir.setAttribute("novalidate", "");
  });

  await tambah.getByRole("button", { name: "Tambah program" }).click();

  await expect(tambah.getByRole("alert")).toHaveText(
    "Nama program belum diisi. Isi dengan nama program, misalnya Tokutei Ginou (SSW).",
  );
});

test("program Pelajar yang dinonaktifkan hilang dari halaman Program dan Beranda, lalu muncul lagi setelah diaktifkan (UAT-D1, bagian situs)", async ({
  page,
}) => {
  await page.goto("/program");
  await daftarProgram(page)
    .getByRole("link", { name: "Rincian Pelajar" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Pelajar" }),
  ).toBeVisible();
  const alamatRincian = page.url();

  await bukaMenuPanel(page, "Program");
  await barisPanel(page, "Pelajar")
    .getByRole("button", { name: "Nonaktifkan Pelajar" })
    .click();
  await expect(
    page.getByRole("region", { name: "Daftar program" }).getByRole("status"),
  ).toHaveText("Pelajar sekarang nonaktif dan tidak tampil di situs publik.");

  await page.goto("/program");
  await expect(
    daftarProgram(page).getByRole("heading", { level: 2 }),
  ).toHaveText(["Tokutei Ginou (SSW)", "Pemagangan", "Gijinkoku"]);
  await page.goto("/");
  await expect(
    bagianProgramBeranda(page).getByRole("heading", { level: 2 }),
  ).toHaveText("Tiga program, satu jalur");
  await expect(
    bagianProgramBeranda(page).getByRole("heading", { level: 3 }),
  ).toHaveText(["Tokutei Ginou (SSW)", "Pemagangan", "Gijinkoku"]);
  expect((await page.goto(alamatRincian))?.status()).toBe(404);

  await page.goto("/panel/program");
  await barisPanel(page, "Pelajar")
    .getByRole("button", { name: "Aktifkan kembali Pelajar" })
    .click();
  await expect(
    page.getByRole("region", { name: "Daftar program" }).getByRole("status"),
  ).toHaveText("Pelajar aktif kembali dan tampil lagi di situs publik.");

  await page.goto("/program");
  await expect(
    daftarProgram(page).getByRole("heading", { level: 2 }),
  ).toHaveText(PROGRAM_AWAL);
  await page.goto("/");
  await expect(
    bagianProgramBeranda(page).getByRole("heading", { level: 2 }),
  ).toHaveText("Empat program, satu jalur");
  await expect(
    bagianProgramBeranda(page).getByRole("heading", { level: 3 }),
  ).toHaveText(PROGRAM_AWAL);
  expect((await page.goto(alamatRincian))?.status()).toBe(200);
});

test("Admin menambah bidang kerja, mengubah namanya, lalu menonaktifkannya", async ({
  page,
}) => {
  await bukaMenuPanel(page, "Bidang kerja");
  const daftar = page.getByRole("region", { name: "Daftar bidang kerja" });
  await expect(daftar.getByRole("rowheader")).toHaveText(BIDANG_KERJA_AWAL);
  await expect(barisPanel(page, "Restoran").getByRole("cell")).toHaveText([
    "Aktif",
    /.*/,
  ]);

  const tambah = page.getByRole("region", { name: "Tambah bidang kerja" });
  await tambah.getByLabel("Nama bidang kerja").fill("Bidang Uji");
  await tambah.getByRole("button", { name: "Tambah bidang kerja" }).click();
  await expect(tambah.getByRole("status")).toHaveText(
    "Bidang Uji sudah ditambahkan dan tampil di situs publik.",
  );
  await expect(tambah.getByLabel("Nama bidang kerja")).toHaveValue("");
  await expect(barisPanel(page, "Bidang Uji").getByRole("cell")).toHaveText([
    "Aktif",
    /.*/,
  ]);
  await page.goto("/program");
  await expect(bagianBidangKerja(page).getByRole("listitem")).toHaveText([
    ...BIDANG_KERJA_AWAL,
    "Bidang Uji",
  ]);

  await page.goto("/panel/bidang-kerja");
  await barisPanel(page, "Bidang Uji")
    .getByRole("link", { name: "Ubah Bidang Uji" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Ubah bidang kerja" }),
  ).toBeVisible();
  await expect(page.getByLabel("Nama bidang kerja")).toHaveValue("Bidang Uji");
  await page.getByLabel("Nama bidang kerja").fill("Bidang Uji Diubah");
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    "Perubahan Bidang Uji Diubah sudah disimpan.",
  );
  await page.goto("/program");
  await expect(bagianBidangKerja(page).getByRole("listitem")).toHaveText([
    ...BIDANG_KERJA_AWAL,
    "Bidang Uji Diubah",
  ]);

  await page.goto("/panel/bidang-kerja");
  await barisPanel(page, "Bidang Uji Diubah")
    .getByRole("button", { name: "Nonaktifkan Bidang Uji Diubah" })
    .click();
  await expect(daftar.getByRole("status")).toHaveText(
    "Bidang Uji Diubah sekarang nonaktif dan tidak tampil di situs publik.",
  );
  await page.goto("/program");
  await expect(bagianBidangKerja(page).getByRole("listitem")).toHaveText(
    BIDANG_KERJA_AWAL,
  );
});

test("bidang kerja Restoran yang dinonaktifkan hilang dari halaman Program, lalu muncul lagi setelah diaktifkan (UAT-D2, bagian situs)", async ({
  page,
}) => {
  await bukaMenuPanel(page, "Bidang kerja");
  const daftar = page.getByRole("region", { name: "Daftar bidang kerja" });
  await barisPanel(page, "Restoran")
    .getByRole("button", { name: "Nonaktifkan Restoran" })
    .click();
  await expect(daftar.getByRole("status")).toHaveText(
    "Restoran sekarang nonaktif dan tidak tampil di situs publik.",
  );
  await expect(
    barisPanel(page, "Restoran").getByRole("cell").first(),
  ).toHaveText("Nonaktif");

  await page.goto("/program");
  await expect(bagianBidangKerja(page).getByRole("listitem")).toHaveText(
    BIDANG_KERJA_AWAL.filter((nama) => nama !== "Restoran"),
  );

  await page.goto("/panel/bidang-kerja");
  await barisPanel(page, "Restoran")
    .getByRole("button", { name: "Aktifkan kembali Restoran" })
    .click();
  await expect(daftar.getByRole("status")).toHaveText(
    "Restoran aktif kembali dan tampil lagi di situs publik.",
  );

  await page.goto("/program");
  await expect(bagianBidangKerja(page).getByRole("listitem")).toHaveText(
    BIDANG_KERJA_AWAL,
  );
});

test("nama bidang kerja yang kosong ditolak di server dengan pesan berbahasa Indonesia", async ({
  page,
}) => {
  await bukaMenuPanel(page, "Bidang kerja");
  const tambah = page.getByRole("region", { name: "Tambah bidang kerja" });
  await tambah.getByLabel("Nama bidang kerja").fill("   ");
  // Lewati pemeriksaan isian wajib di browser supaya validasi server yang diuji.
  await tambah.locator("form").evaluate((formulir) => {
    formulir.setAttribute("novalidate", "");
  });

  await tambah.getByRole("button", { name: "Tambah bidang kerja" }).click();

  await expect(tambah.getByRole("alert")).toHaveText(
    "Nama bidang kerja belum diisi. Isi dengan nama bidang kerja, misalnya Restoran.",
  );
});

test.describe("hanya Admin yang bisa membuka halaman kelola program dan bidang kerja", () => {
  const ALAMAT = [
    "/panel/program",
    "/panel/program/1",
    "/panel/bidang-kerja",
    "/panel/bidang-kerja/1",
  ];

  test("Staf ditolak dengan 403", async ({ page }) => {
    await masukKePanel(page, STAF);

    for (const alamat of ALAMAT) {
      const jawaban = await page.goto(alamat);

      expect(jawaban?.status()).toBe(403);
      await expect(
        page.getByRole("heading", { level: 1, name: "Akses ditolak" }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/^Akses ditolak/);
      await expect(page.getByRole("main").getByRole("textbox")).toHaveCount(0);
      await expect(page.getByRole("main").getByRole("table")).toHaveCount(0);
    }
  });

  test("pengunjung diarahkan ke halaman masuk", async ({ page }) => {
    for (const alamat of ALAMAT) {
      await page.goto(alamat);

      await expect(page).toHaveURL("/panel/masuk");
    }
  });
});

test("alamat ubah yang tidak ada di panel menjawab 404 berbahasa Indonesia", async ({
  page,
}) => {
  await masukKePanel(page, ADMIN);

  for (const [alamat, judul] of [
    ["/panel/program/999999", "Program tidak ditemukan"],
    ["/panel/bidang-kerja/bukan-angka", "Bidang kerja tidak ditemukan"],
  ]) {
    const jawaban = await page.goto(alamat);

    expect(jawaban?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: judul }),
    ).toBeVisible();
  }
});

test("halaman kelola program dan bidang kerja tidak bergulir ke samping di lebar 375 px; tabelnya bergeser di bingkainya sendiri", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await masukKePanel(page, ADMIN);

  for (const [alamat, judul] of [
    ["/panel/program", "Program"],
    ["/panel/bidang-kerja", "Bidang kerja"],
  ]) {
    await page.goto(alamat);
    await expect(
      page.getByRole("heading", { level: 1, name: judul }),
    ).toBeVisible();

    const lebar = await page.evaluate(() => ({
      dokumen: document.documentElement.scrollWidth,
      layar: window.innerWidth,
    }));
    expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
  }
});
