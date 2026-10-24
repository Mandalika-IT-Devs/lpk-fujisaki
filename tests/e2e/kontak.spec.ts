import { expect, type Page, test } from "@playwright/test";
import { ADMIN, masukKePanel, STAF } from "./pegawai-uji";

// Kontak lembaga dan tombol WhatsApp (PRD §3.5, §5.2, ▶ Keputusan OD-09, issue T08, UAT-C5).
// Isi awal adalah nilai contoh OD-05 [CONTOH]: alamat "Desa Kesugihan, Kab. Cilacap, Jawa Tengah [CONTOH]",
// WhatsApp 6280000000000, dan email info@lpkfujisaki.com. OD-05 belum punya nilai contoh untuk titik peta.
// Nomor 0812-3456-7890 → 6281234567890 dari issue T08 dan tests/golden/nomor-whatsapp.json.
//
// Berkas ini berjalan di project Playwright "kontak" sesudah semua berkas test lain (playwright.config.ts), karena
// test di sini mengubah kontak yang tampil di loket Beranda. Test di berkas ini berjalan berurutan dan selalu
// mengembalikan isi awal.

type IsianKontakUji = {
  alamat: string;
  nomorWhatsApp: string;
  email: string;
  tautanPeta: string;
};

// [CONTOH] OD-05
const ISI_AWAL: IsianKontakUji = {
  alamat: "Desa Kesugihan, Kab. Cilacap, Jawa Tengah [CONTOH]",
  nomorWhatsApp: "6280000000000",
  email: "info@lpkfujisaki.com",
  tautanPeta: "",
};

const ALAMAT_PANEL = "/panel/kontak";
const CATATAN_TANPA_NOMOR = "Nomor WhatsApp kantor menyusul.";
const PESAN_NOMOR_SALAH =
  "Nomor WhatsApp kantor belum benar. Isi nomor HP Indonesia 10 sampai 13 digit yang diawali 08 atau +62 8, misalnya 0812-3456-7890. Nomor luar negeri dan nomor telepon rumah tidak diterima.";

async function bukaPanelKontak(page: Page) {
  await masukKePanel(page, ADMIN);
  await page
    .getByRole("navigation", { name: "Menu panel pegawai" })
    .getByRole("link", { name: "Kontak" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Kontak" }),
  ).toBeVisible();
}

async function isiFormulirKontak(page: Page, isian: Partial<IsianKontakUji>) {
  const isi = page.getByRole("main");
  if (isian.alamat !== undefined) {
    await isi.getByLabel("Alamat").fill(isian.alamat);
  }
  if (isian.nomorWhatsApp !== undefined) {
    await isi.getByLabel("Nomor WhatsApp kantor").fill(isian.nomorWhatsApp);
  }
  if (isian.email !== undefined) {
    await isi.getByLabel("Email kantor").fill(isian.email);
  }
  if (isian.tautanPeta !== undefined) {
    await isi.getByLabel("Tautan lokasi peta").fill(isian.tautanPeta);
  }
}

async function simpan(page: Page) {
  await page.getByRole("button", { name: "Simpan kontak" }).click();
}

/** Mengembalikan isi awal [CONTOH] OD-05 lewat panel. */
async function kembalikanIsiAwal(page: Page) {
  await page.goto(ALAMAT_PANEL);
  await isiFormulirKontak(page, ISI_AWAL);
  await simpan(page);
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    "Kontak lembaga sudah disimpan dan tampil di situs publik. Nomor WhatsApp kantor tersimpan sebagai 6280000000000.",
  );
}

/** Lewati pemeriksaan isian di browser supaya validasi server yang diuji. */
async function lewatiPemeriksaanBrowser(page: Page) {
  await page
    .getByRole("main")
    .locator("form")
    .evaluate((formulir) => {
      formulir.setAttribute("novalidate", "");
    });
}

/** Loket di ujung garis Beranda. */
function loket(page: Page) {
  return page.getByRole("region", {
    name: "Datang ke loket kami di Kesugihan",
  });
}

/** Tombol WhatsApp di loket Beranda dan di halaman Kontak membuka nomor yang sama. */
async function periksaTombolWhatsApp(page: Page, nomor: string | null) {
  for (const [alamat, wilayah] of [
    ["/", () => loket(page)],
    ["/kontak", () => page.getByRole("main")],
  ] as const) {
    await page.goto(alamat);
    const tombol = wilayah().getByRole("link", { name: "Chat WhatsApp" });
    if (nomor) {
      await expect(tombol).toHaveAttribute("href", `https://wa.me/${nomor}`);
      await expect(tombol).not.toHaveAttribute("aria-disabled");
      await expect(wilayah()).not.toContainText(CATATAN_TANPA_NOMOR);
    } else {
      await expect(tombol).toHaveAttribute("aria-disabled", "true");
      await expect(tombol).not.toHaveAttribute("href");
      await expect(wilayah()).toContainText(CATATAN_TANPA_NOMOR);
    }
  }
}

test("loket di ujung garis Beranda: judul, alamat, Daftar sekarang, dan Chat WhatsApp dari isi awal [CONTOH] OD-05", async ({
  page,
}) => {
  await page.goto("/");

  const bagian = loket(page);
  await expect(
    bagian.getByRole("heading", {
      level: 2,
      name: "Datang ke loket kami di Kesugihan",
    }),
  ).toBeVisible();
  await expect(bagian).toContainText(ISI_AWAL.alamat);
  await expect(
    bagian.getByRole("link", { name: "Daftar sekarang" }),
  ).toHaveAttribute("href", "/daftar");
  await expect(
    bagian.getByRole("link", { name: "Chat WhatsApp" }),
  ).toHaveAttribute("href", "https://wa.me/6280000000000");
});

test("halaman Kontak menampilkan alamat, nomor WhatsApp, email, dan lokasi peta dari isi awal [CONTOH] OD-05", async ({
  page,
}) => {
  await page.goto("/kontak");

  await expect(
    page.getByRole("heading", { level: 1, name: "Kontak" }),
  ).toBeVisible();
  const isi = page.getByRole("main");
  await expect(isi).toContainText(ISI_AWAL.alamat);
  await expect(isi).toContainText("+6280000000000");
  await expect(
    isi.getByRole("link", { name: "Chat WhatsApp" }),
  ).toHaveAttribute("href", "https://wa.me/6280000000000");
  await expect(
    isi.getByRole("link", { name: "info@lpkfujisaki.com" }),
  ).toHaveAttribute("href", "mailto:info@lpkfujisaki.com");
  // OD-05 belum punya nilai contoh untuk titik peta.
  await expect(isi.getByRole("link", { name: "Lihat di peta" })).toHaveCount(0);
  await expect(isi).toContainText("Lokasi peta menyusul.");
});

test("panel kontak terisi kontak yang tersimpan", async ({ page }) => {
  await bukaPanelKontak(page);
  const isi = page.getByRole("main");

  await expect(isi.getByLabel("Alamat")).toHaveValue(ISI_AWAL.alamat);
  await expect(isi.getByLabel("Nomor WhatsApp kantor")).toHaveValue(
    ISI_AWAL.nomorWhatsApp,
  );
  await expect(isi.getByLabel("Email kantor")).toHaveValue(ISI_AWAL.email);
  await expect(isi.getByLabel("Tautan lokasi peta")).toHaveValue("");
});

test("nomor kantor 0812-3456-7890 tersimpan sebagai 6281234567890, dan tombol WhatsApp membuka wa.me/6281234567890 (UAT-C5)", async ({
  page,
}) => {
  await bukaPanelKontak(page);

  await isiFormulirKontak(page, { nomorWhatsApp: "0812-3456-7890" });
  await simpan(page);

  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    "Kontak lembaga sudah disimpan dan tampil di situs publik. Nomor WhatsApp kantor tersimpan sebagai 6281234567890.",
  );
  await expect(page.getByLabel("Nomor WhatsApp kantor")).toHaveValue(
    "6281234567890",
  );
  await page.reload();
  await expect(page.getByLabel("Nomor WhatsApp kantor")).toHaveValue(
    "6281234567890",
  );
  await periksaTombolWhatsApp(page, "6281234567890");
  await expect(page.getByRole("main")).toContainText("+6281234567890");

  await kembalikanIsiAwal(page);
  await periksaTombolWhatsApp(page, "6280000000000");
});

test("nomor yang tidak sah dan nomor luar negeri ditolak dengan pesan yang jelas, dan kontak tidak berubah", async ({
  page,
}) => {
  await bukaPanelKontak(page);

  for (const nomor of ["081234567", "+1 415 555 0100", "(021) 555-1234"]) {
    await page.goto(ALAMAT_PANEL);
    await isiFormulirKontak(page, { nomorWhatsApp: nomor });
    await simpan(page);

    await expect(page.getByRole("main").getByRole("alert")).toHaveText(
      PESAN_NOMOR_SALAH,
    );
    await expect(page.getByLabel("Nomor WhatsApp kantor")).toHaveValue(nomor);
  }

  await page.goto(ALAMAT_PANEL);
  await expect(page.getByLabel("Nomor WhatsApp kantor")).toHaveValue(
    ISI_AWAL.nomorWhatsApp,
  );
  await periksaTombolWhatsApp(page, ISI_AWAL.nomorWhatsApp);
});

test("tanpa nomor kantor, tombol WhatsApp nonaktif dan catatannya tampil di loket Beranda dan halaman Kontak", async ({
  page,
}) => {
  await bukaPanelKontak(page);

  await isiFormulirKontak(page, { nomorWhatsApp: "" });
  await simpan(page);

  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    "Kontak lembaga sudah disimpan dan tampil di situs publik. Nomor WhatsApp kantor kosong, jadi tombol Chat WhatsApp nonaktif sampai nomornya diisi.",
  );
  await periksaTombolWhatsApp(page, null);

  await kembalikanIsiAwal(page);
  await periksaTombolWhatsApp(page, ISI_AWAL.nomorWhatsApp);
});

test("alamat, email, dan tautan lokasi peta yang diubah Admin tampil di situs publik", async ({
  page,
}) => {
  await bukaPanelKontak(page);

  await isiFormulirKontak(page, {
    alamat: "Jl. Uji Kontak No. 1, Kesugihan, Cilacap",
    email: "kantor@contoh.test",
    tautanPeta: "https://maps.example.test/kesugihan",
  });
  await simpan(page);
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Kontak lembaga sudah disimpan dan tampil di situs publik.",
  );

  await page.goto("/kontak");
  const isi = page.getByRole("main");
  await expect(isi).toContainText("Jl. Uji Kontak No. 1, Kesugihan, Cilacap");
  await expect(
    isi.getByRole("link", { name: "kantor@contoh.test" }),
  ).toHaveAttribute("href", "mailto:kantor@contoh.test");
  await expect(
    isi.getByRole("link", { name: "Lihat di peta" }),
  ).toHaveAttribute("href", "https://maps.example.test/kesugihan");
  await expect(isi).not.toContainText("Lokasi peta menyusul.");
  await page.goto("/");
  await expect(loket(page)).toContainText(
    "Jl. Uji Kontak No. 1, Kesugihan, Cilacap",
  );

  await kembalikanIsiAwal(page);
  await page.goto("/kontak");
  await expect(page.getByRole("main")).toContainText("Lokasi peta menyusul.");
});

test("alamat kosong, email yang tidak sah, dan tautan peta yang tidak sah ditolak di server dengan pesan berbahasa Indonesia", async ({
  page,
}) => {
  await bukaPanelKontak(page);

  for (const [isian, pesan] of [
    [
      { alamat: "  " },
      "Alamat belum diisi. Tulis alamat kantor lembaga, misalnya Desa Kesugihan, Kab. Cilacap, Jawa Tengah.",
    ],
    [
      { email: "info-lpkfujisaki" },
      "Email kantor belum benar. Isi alamat email lengkap, misalnya info@lpkfujisaki.com.",
    ],
    [
      { tautanPeta: "peta kesugihan" },
      "Tautan lokasi peta belum benar. Salin tautan lengkap dari aplikasi peta, yang diawali https://, atau kosongkan isian ini.",
    ],
  ] as const) {
    await page.goto(ALAMAT_PANEL);
    await lewatiPemeriksaanBrowser(page);
    await isiFormulirKontak(page, isian);
    await simpan(page);

    await expect(page.getByRole("main").getByRole("alert")).toHaveText(pesan);
  }

  await page.goto("/kontak");
  await expect(page.getByRole("main")).toContainText(ISI_AWAL.alamat);
  await expect(
    page.getByRole("main").getByRole("link", { name: ISI_AWAL.email }),
  ).toBeVisible();
});

test.describe("hanya Admin yang bisa membuka halaman kelola kontak", () => {
  test("Staf ditolak dengan 403", async ({ page }) => {
    await masukKePanel(page, STAF);

    const jawaban = await page.goto(ALAMAT_PANEL);

    expect(jawaban?.status()).toBe(403);
    await expect(
      page.getByRole("heading", { level: 1, name: "Akses ditolak" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Simpan kontak" }),
    ).toHaveCount(0);
  });

  test("pengunjung diarahkan ke halaman masuk", async ({ page }) => {
    await page.goto(ALAMAT_PANEL);

    await expect(page).toHaveURL("/panel/masuk");
  });
});

for (const alamat of ["/kontak", "/"]) {
  test(`${alamat} tidak bergulir ke samping di lebar 375 px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(alamat);
    await expect(
      page.getByRole("link", { name: "Chat WhatsApp" }),
    ).toBeVisible();

    const lebar = await page.evaluate(() => ({
      dokumen: document.documentElement.scrollWidth,
      layar: window.innerWidth,
    }));
    expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
  });
}

test("halaman kelola kontak tidak bergulir ke samping di lebar 375 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await bukaPanelKontak(page);

  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
});
