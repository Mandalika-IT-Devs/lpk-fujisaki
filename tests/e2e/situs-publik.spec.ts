import { expect, type Locator, test } from "@playwright/test";

const HALAMAN = [
  { alamat: "/tentang-kami", judul: "Tentang Kami" },
  { alamat: "/kebijakan-privasi", judul: "Kebijakan Privasi" },
];

// Urutan menu utama sama dengan docs/design/prototipe/beranda.html.
const MENU_UTAMA = [
  "Alur Program",
  "Program",
  "Galeri",
  "Tentang Kami",
  "Kontak",
];

async function bacaTautan(menu: Locator) {
  return menu
    .getByRole("link")
    .evaluateAll((tautan) =>
      tautan.map((a) => [a.textContent?.trim(), a.getAttribute("href")]),
    );
}

for (const { alamat, judul } of HALAMAN) {
  test.describe(`halaman ${judul}`, () => {
    test("tampil dengan bar atas, kaki halaman, dan tanda [CONTOH]", async ({
      page,
    }) => {
      await page.goto(alamat);

      await expect(
        page.getByRole("heading", { level: 1, name: judul }),
      ).toBeVisible();
      await expect(page.getByRole("main")).toContainText("[CONTOH]");

      const bar = page.getByRole("banner");
      await expect(bar.getByRole("link", { name: /Fujisaki/ })).toHaveAttribute(
        "href",
        "/",
      );
      await expect(bar.getByRole("link", { name: "Masuk" })).toBeVisible();

      const kaki = page.getByRole("contentinfo");
      await expect(kaki).toContainText("LPKS Fujisaki Gakuin Center");
      await expect(kaki).toContainText("(P3MI)");
      await expect(
        kaki.getByRole("link", { name: "Kebijakan Privasi" }),
      ).toHaveAttribute("href", "/kebijakan-privasi");
    });

    test("tidak bergulir ke samping di lebar 375 px", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(alamat);
      await expect(
        page.getByRole("heading", { level: 1, name: judul }),
      ).toBeVisible();

      const lebar = await page.evaluate(() => ({
        dokumen: document.documentElement.scrollWidth,
        layar: window.innerWidth,
      }));
      expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
    });
  });
}

test("menu HP terbuka dan memuat tautan yang sama dengan menu layar lebar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/tentang-kami");
  const tautanLebar = await bacaTautan(
    page.getByRole("navigation", { name: "Menu utama" }),
  );
  expect(tautanLebar.map(([nama]) => nama)).toEqual(MENU_UTAMA);

  await page.setViewportSize({ width: 375, height: 812 });
  const menuHp = page.getByRole("navigation", { name: "Menu utama" });
  await expect(menuHp).toBeHidden();

  await page.getByLabel("Buka menu").click();

  await expect(menuHp).toBeVisible();
  expect(await bacaTautan(menuHp)).toEqual(tautanLebar);
});

test("menu HP tertutup lagi setelah tautannya dipilih", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/kebijakan-privasi");

  await page.getByLabel("Buka menu").click();
  await page
    .getByRole("navigation", { name: "Menu utama" })
    .getByRole("link", { name: "Tentang Kami" })
    .click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Tentang Kami" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Menu utama" }),
  ).toBeHidden();
});
