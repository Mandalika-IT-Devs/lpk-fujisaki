import { expect, test } from "@playwright/test";

// Tahap dan langkah disalin dari tabel PRD §7.1.
const TAHAP: [string, string[]][] = [
  [
    "Pendaftaran dan seleksi",
    [
      "Berkas pendaftaran diterima",
      "Pemeriksaan fisik",
      "Psikotes",
      "Tes matematika",
      "Pra-MCU",
    ],
  ],
  [
    "Belajar bahasa Jepang",
    [
      "Pembelajaran bahasa Jepang",
      "Pengenalan budaya Jepang",
      "Pengenalan kebiasaan organisasi Jepang",
      "Ujian bahasa Jepang",
    ],
  ],
  [
    "Belajar tokutei ginou",
    [
      "Pelatihan teori dan praktik",
      "Pengenalan budaya kerja Jepang",
      "Ujian keterampilan SSW",
    ],
  ],
  [
    "Job matching",
    [
      "Wawancara lembaga pendamping",
      "Wawancara perusahaan penerima",
      "MCU",
      "Tanda tangan kontrak kerja",
      "Pembuatan paspor",
    ],
  ],
  ["Magang kerja", ["Magang kerja di perusahaan Indonesia"]],
  [
    "Persiapan berangkat",
    [
      "Review bahasa dan percakapan (1 bulan)",
      "COE terbit",
      "Visa terbit",
      "Berangkat",
    ],
  ],
];

test("menampilkan keenam tahap beserta langkahnya sesuai PRD §7.1", async ({
  page,
}) => {
  await page.goto("/alur-program");

  await expect(
    page.getByRole("heading", { level: 1, name: "Alur Program" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 3 })).toHaveText(
    TAHAP.map(([nama]) => nama),
  );
  for (const [nama, langkah] of TAHAP) {
    const daftar = page.getByRole("list", { name: `Langkah tahap ${nama}` });
    await expect(daftar.getByRole("listitem")).toHaveText(langkah);
  }
});

// Di halaman ini seluruh peta sudah terlihat sejak awal di layar lebar, jadi penanda tidak berjalan:
// ia diam di FG 01 seperti saat gerak dikurangi.
for (const [nama, ukuran] of [
  ["HP", { width: 390, height: 844 }],
  ["layar lebar", { width: 1440, height: 900 }],
] as const) {
  test(`peta jalur yang sama, dengan penanda Kamu di sini diam di FG 01 (${nama})`, async ({
    page,
  }) => {
    await page.setViewportSize(ukuran);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/alur-program");

    const titik = page.locator("[data-titik]");
    await expect(titik).toHaveCount(TAHAP.length);
    await expect(page.locator("[data-siap]")).toBeAttached();
    const penanda = page.locator("[data-penanda]");
    await expect(penanda).toBeVisible();
    expect(
      await penanda.evaluate(
        (el) => el.getAnimations({ subtree: true }).length,
      ),
    ).toBe(0);
    const a = await penanda.boundingBox();
    const b = await titik.first().boundingBox();
    if (!a || !b) throw new Error("Penanda atau titik FG 01 tidak tampil.");
    expect(
      Math.abs(a.x + a.width / 2 - (b.x + b.width / 2)),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(a.y + a.height / 2 - (b.y + b.height / 2)),
    ).toBeLessThanOrEqual(1);

    const fg01 = page
      .getByRole("main")
      .getByRole("listitem")
      .filter({
        has: page.getByRole("heading", { level: 3, name: TAHAP[0][0] }),
      });
    await expect(fg01.getByText("Kamu di sini")).toBeVisible();
  });
}

test("tidak bergulir ke samping di lebar 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/alur-program");
  await expect(
    page.getByRole("heading", { level: 1, name: "Alur Program" }),
  ).toBeVisible();

  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
});
