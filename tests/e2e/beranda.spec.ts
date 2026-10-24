import { expect, type Locator, type Page, test } from "@playwright/test";

// Nama tahap dari PRD §7.1; teks lain dari issue T02 dan docs/design/prototipe/beranda.html.
const NAMA_TAHAP = [
  "Pendaftaran dan seleksi",
  "Belajar bahasa Jepang",
  "Belajar tokutei ginou",
  "Job matching",
  "Magang kerja",
  "Persiapan berangkat",
];
const JUDUL =
  "Dari Cilacap ke Jepang, lewat jalur yang bisa kamu pantau sendiri.";
const PAPAN_CILACAP =
  "Papan stasiun FG 01 Cilacap, stasiun awal: pendaftaran dan seleksi. Berikutnya: belajar bahasa Jepang, FG 02.";
const PAPAN_JEPANG =
  "Papan stasiun FG 06 Jepang, tujuan akhir. Sebelumnya: magang kerja, FG 05.";

const HP = { width: 390, height: 844 };
const LEBAR = { width: 1440, height: 900 };

/** Bagian peta jalur di Beranda. */
function bagianAlur(page: Page) {
  return page.getByRole("region", {
    name: "Enam stasiun dari Cilacap ke Jepang",
  });
}

/** Pusat sebuah elemen di layar. */
async function pusat(elemen: Locator) {
  const kotak = await elemen.boundingBox();
  if (!kotak) throw new Error("Elemen tidak tampil.");
  return { x: kotak.x + kotak.width / 2, y: kotak.y + kotak.height / 2 };
}

/** Penanda "kamu di sini" setelah peta jalur selesai diukur. */
async function penandaSiap(page: Page) {
  await expect(page.locator("[data-siap]")).toBeAttached();
  return page.locator("[data-penanda]");
}

async function diPusatTitik(penanda: Locator, titik: Locator) {
  const a = await pusat(penanda);
  const b = await pusat(titik);
  expect(Math.abs(a.x - b.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(1);
}

test("judul dan papan stasiun Cilacap", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: JUDUL }),
  ).toBeVisible();
  const papan = page.getByRole("img", { name: PAPAN_CILACAP });
  await expect(papan).toContainText("Cilacap");
  await expect(papan).toContainText("Awal jalur");
  await expect(papan).toContainText("Belajar bahasa Jepang");
  await expect(papan).toContainText("FG 02");
});

test("enam stasiun dengan nama tahap persis seperti PRD §7.1", async ({
  page,
}) => {
  await page.goto("/");

  await expect(bagianAlur(page).getByRole("heading", { level: 3 })).toHaveText(
    NAMA_TAHAP,
  );
});

test("papan kedatangan FG 06 tanpa angka alumni", async ({ page }) => {
  await page.goto("/");

  const papan = bagianAlur(page).getByRole("img", { name: PAPAN_JEPANG });
  await expect(papan).toContainText("Jepang");
  await expect(papan).toContainText("日本 · Tujuan akhir");
  await expect(papan).toContainText("Magang kerja");
  await expect(papan).not.toContainText("alumni");
});

test("bagian pantau: arti keempat tanda status dan contoh tampilan akun", async ({
  page,
}) => {
  await page.goto("/");

  const pantau = page.getByRole("region", {
    name: "Setelah mendaftar, pantau posisimu sendiri",
  });
  const arti = pantau.getByRole("list", { name: "Arti tanda di akun" });
  await expect(arti.getByRole("listitem")).toHaveText([
    /^Selesai/,
    /^Sedang berjalan/,
    /^Belum/,
    /^Tidak berlaku/,
  ]);
  const akun = pantau.getByRole("group", {
    name: "Contoh tampilan akun siswa",
  });
  await expect(akun).toContainText("Tahap 02 · Belajar bahasa Jepang");
  await expect(akun).toContainText("hanya contoh");
});

test("di 390×844, judul, papan Cilacap, dan awal garis terlihat tanpa menggulir", async ({
  page,
}) => {
  await page.setViewportSize(HP);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: JUDUL }),
  ).toBeInViewport({
    ratio: 1,
  });
  await expect(page.getByRole("img", { name: PAPAN_CILACAP })).toBeInViewport({
    ratio: 1,
  });
  // Garis mulai dari tepi atas kepala peta jalur; minimal 48 px pertamanya terlihat.
  const awalGaris = await bagianAlur(page)
    .locator("[data-awal-garis]")
    .evaluate((kepala) => {
      const garis = getComputedStyle(kepala, "::before");
      return {
        tampil: garis.display !== "none",
        lebar: garis.width,
        atas: kepala.getBoundingClientRect().top + parseFloat(garis.top),
      };
    });
  expect(awalGaris.tampil).toBe(true);
  expect(awalGaris.lebar).toBe("12px");
  expect(awalGaris.atas + 48).toBeLessThanOrEqual(HP.height);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("di 1440×900, keenam stasiun beserta namanya terlihat di layar pertama", async ({
  page,
}) => {
  await page.setViewportSize(LEBAR);
  await page.goto("/");

  // Setiap stasiun: titik stasiun di garis dan nama tahapnya.
  const titik = page.locator("[data-titik]");
  await expect(titik).toHaveCount(NAMA_TAHAP.length);
  for (const [i, nama] of NAMA_TAHAP.entries()) {
    await expect(titik.nth(i)).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("heading", { level: 3, name: nama }),
    ).toBeInViewport({ ratio: 1 });
  }
});

for (const [nama, ukuran] of [
  ["HP", HP],
  ["layar lebar", LEBAR],
] as const) {
  test.describe(`penanda kamu di sini (${nama})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(ukuran);
    });

    test("gerak dikurangi: titik oranye diam di FG 01 bersama tanda Kamu di sini", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      const penanda = await penandaSiap(page);
      const titikFg01 = page.locator("[data-titik]").first();

      await expect(penanda).toBeVisible();
      await diPusatTitik(penanda, titikFg01);
      const fg01 = bagianAlur(page).getByRole("listitem").first();
      await expect(fg01.getByText("Kamu di sini")).toBeVisible();
      expect(
        await penanda.evaluate(
          (el) => el.getAnimations({ subtree: true }).length,
        ),
      ).toBe(0);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await diPusatTitik(penanda, titikFg01);
    });

    test("gerak tidak dikurangi: titik berjalan ke FG 06 mengikuti guliran, hanya lewat translate", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto("/");
      const penanda = await penandaSiap(page);

      const animasi = await penanda.evaluate((el) =>
        el.getAnimations({ subtree: true }).map((a) => ({
          timeline: a.timeline?.constructor.name,
          properti: [
            ...new Set(
              (a.effect as KeyframeEffect)
                .getKeyframes()
                .flatMap((k) => Object.keys(k))
                .filter(
                  (p) =>
                    ![
                      "offset",
                      "computedOffset",
                      "easing",
                      "composite",
                    ].includes(p),
                ),
            ),
          ],
        })),
      );
      expect(animasi).toEqual([
        { timeline: "ViewTimeline", properti: ["translate"] },
      ]);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await diPusatTitik(penanda, page.locator("[data-titik]").last());
    });
  });
}

test("tidak bergulir ke samping di lebar 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: JUDUL }),
  ).toBeVisible();

  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
});
