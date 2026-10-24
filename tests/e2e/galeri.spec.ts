import { readdir } from "node:fs/promises";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { ADMIN, masukKePanel, STAF } from "./pegawai-uji";

// Galeri foto (PRD §3.4, ▶ Keputusan OD-16, issue T09, UAT-C4). Isi awal galeri kosong: nilai contoh OD-06 [CONTOH].
//
// Berkas ini berjalan di project Playwright "galeri" sesudah semua berkas test lain (playwright.config.ts), karena
// test di sini mengubah foto yang tampil di Beranda. Test di berkas ini berjalan berurutan, dan setiap test yang
// mengunggah foto menghapusnya lagi.

// Label bingkai kosong dari docs/design/prototipe/beranda.html, bagian galeri.
const LABEL_BINGKAI_KOSONG = [
  "Kelas bahasa Jepang",
  "Praktik perawatan lansia",
  "Kunjungan penutur asli bahasa Jepang",
];

const ALAMAT_PANEL = "/panel/galeri";

// Foto sintetis: JPG 160×120 berwarna rata, 389 byte, dibuat untuk test ini.
const ISI_JPG = Buffer.from(
  "/9j/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAB4AKADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAUG/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AigNInAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/9k=",
  "base64",
);

// GIF 1×1 piksel.
const ISI_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

// PNG lebih satu byte dari 5 MB = 5 × 1.048.576 + 1 = 5.242.881 byte (tests/golden/foto-galeri.json): tanda PNG di
// awal, lalu nol. Berkas ini ditolak karena ukurannya, jadi isinya tidak perlu berupa gambar utuh.
const UKURAN_PNG_BESAR = 5_242_881;
const ISI_PNG_BESAR = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(UKURAN_PNG_BESAR - 8),
]);

const PESAN_FORMAT =
  "Foto belum diunggah. Format berkasnya tidak didukung. Pilih foto JPG, PNG, atau WebP.";
const PESAN_UKURAN =
  "Foto belum diunggah. Ukuran berkasnya 5.242.881 byte, lebih besar dari batas 5 MB (5.242.880 byte). Kecilkan fotonya atau pilih foto lain.";
const PESAN_PERSETUJUAN =
  "Foto belum diunggah. Centang persetujuan belum diisi. Unggah foto hanya bila orang di foto sudah setuju fotonya dipublikasikan, lalu centang persetujuannya.";

type BerkasUji = { name: string; mimeType: string; buffer: Buffer };

function fotoJpg(name = "kegiatan.jpg"): BerkasUji {
  return { name, mimeType: "image/jpeg", buffer: ISI_JPG };
}

function fotoPngBesar(): BerkasUji {
  return {
    name: "spanduk.png",
    mimeType: "image/png",
    buffer: ISI_PNG_BESAR,
  };
}

function fotoGif(): BerkasUji {
  return { name: "animasi.gif", mimeType: "image/gif", buffer: ISI_GIF };
}

/** Unggahan yang ditolak di UAT-C4 nomor 2–4, masing-masing dengan alasannya. */
const UNGGAHAN_DITOLAK = [
  {
    nomor: 2,
    judul: "Spanduk PNG di atas 5 MB",
    berkas: fotoPngBesar,
    setuju: true,
    pesan: PESAN_UKURAN,
  },
  {
    nomor: 3,
    judul: "Animasi GIF",
    berkas: fotoGif,
    setuju: true,
    pesan: PESAN_FORMAT,
  },
  {
    nomor: 4,
    judul: "JPG tanpa persetujuan",
    berkas: () => fotoJpg("tanpa-persetujuan.jpg"),
    setuju: false,
    pesan: PESAN_PERSETUJUAN,
  },
];

type IsianUnggahUji = {
  judul: string;
  tanggalKegiatan: string;
  berkas?: BerkasUji;
  setuju: boolean;
};

async function bukaPanelGaleri(page: Page) {
  await masukKePanel(page, ADMIN);
  await page
    .getByRole("navigation", { name: "Menu panel pegawai" })
    .getByRole("link", { name: "Galeri" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Galeri" }),
  ).toBeVisible();
}

function formulirUnggah(page: Page) {
  return page.getByRole("form", { name: "Unggah foto" });
}

/** Mengisi formulir unggah di panel, lalu menekan Unggah foto. */
async function unggah(page: Page, isian: IsianUnggahUji) {
  const formulir = formulirUnggah(page);
  await formulir.getByLabel("Judul").fill(isian.judul);
  await formulir.getByLabel("Tanggal kegiatan").fill(isian.tanggalKegiatan);
  if (isian.berkas) {
    await formulir.getByLabel("Berkas foto").setInputFiles(isian.berkas);
  }
  await formulir
    .getByLabel("Orang di foto sudah setuju fotonya dipublikasikan")
    .setChecked(isian.setuju);
  await formulir.getByRole("button", { name: "Unggah foto" }).click();
}

/** Daftar foto di panel galeri. */
function daftarPanel(page: Page) {
  return page.getByRole("list", { name: "Foto di galeri" });
}

/** Menghapus foto lewat panel galeri dan menyetujui konfirmasinya. */
async function hapusLewatPanel(page: Page, judul: string) {
  await page.goto(ALAMAT_PANEL);
  page.once("dialog", (dialog) => dialog.accept());
  await daftarPanel(page)
    .getByRole("button", { name: `Hapus ${judul}` })
    .click();
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    `Foto "${judul}" sudah dihapus dari galeri, dan berkasnya sudah dihapus dari server.`,
  );
}

/** Nama berkas di folder FOLDER_FOTO_GALERI (.env.ci), tempat server e2e menyimpan foto galeri. */
async function berkasDiDisk(): Promise<string[]> {
  const folder = process.env.FOLDER_FOTO_GALERI;
  if (!folder) {
    throw new Error(
      "FOLDER_FOTO_GALERI belum diisi, jadi berkas foto dari test tidak bisa diperiksa. Isi variabel itu di .env.ci.",
    );
  }
  return readdir(folder).catch(() => []);
}

/** Nama berkas foto galeri dari alamat next/image, misalnya /_next/image?url=%2Ffoto-galeri%2F…jpeg&w=…. */
async function namaBerkasFoto(page: Page, judul: string): Promise<string> {
  const src = await page
    .getByRole("img", { name: judul })
    .first()
    .getAttribute("src");
  const url = new URL(src ?? "", "http://n").searchParams.get("url") ?? "";
  return url.replace("/foto-galeri/", "");
}

/** Mengunggah foto JPG yang memenuhi syarat lewat panel, lalu menunggu kabar berhasilnya. */
async function unggahFotoSah(
  page: Page,
  judul: string,
  tanggalKegiatan: string,
) {
  await page.goto(ALAMAT_PANEL);
  await unggah(page, {
    judul,
    tanggalKegiatan,
    berkas: fotoJpg(),
    setuju: true,
  });
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    `Foto "${judul}" sudah diunggah dan tampil di halaman Galeri.`,
  );
}

/** Lebar dokumen tidak melebihi lebar layar, jadi halaman tidak bergulir ke samping. */
async function periksaTidakBergulirKeSamping(page: Page) {
  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
}

/**
 * Isian tersembunyi Server Action dari formulir yang dirender server ($ACTION_…, dan id foto di formulir hapus).
 * Dengan isian ini, test mengirim permintaan langsung ke server tanpa melewati halaman.
 */
async function isianTersembunyi(
  formulir: Locator,
): Promise<Record<string, string>> {
  const daftar = await formulir
    .locator('input[type="hidden"]')
    .evaluateAll((isian) =>
      isian.map((i) => [
        i.getAttribute("name") ?? "",
        i.getAttribute("value") ?? "",
      ]),
    );
  return Object.fromEntries(daftar);
}

/** Formulir hapus untuk foto berjudul tertentu di panel galeri. */
function formulirHapus(page: Page, judul: string) {
  return page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: `Hapus ${judul}` }) });
}

/** Bagian galeri di Beranda. */
function galeriBeranda(page: Page) {
  return page.getByRole("region", { name: "Kegiatan di lembaga" });
}

test("[CONTOH] OD-06: tanpa foto, halaman Galeri dan Beranda menampilkan tiga bingkai kosong berlabel", async ({
  page,
}) => {
  await page.goto("/galeri");
  await expect(
    page.getByRole("heading", { level: 1, name: "Galeri" }),
  ).toBeVisible();
  const isi = page.getByRole("main");
  await expect(isi.getByRole("figure")).toHaveText(LABEL_BINGKAI_KOSONG);
  await expect(isi.getByRole("img")).toHaveCount(0);

  await page.goto("/");
  const bagian = galeriBeranda(page);
  await expect(
    bagian.getByRole("heading", { level: 2, name: "Kegiatan di lembaga" }),
  ).toBeVisible();
  await expect(bagian.getByRole("figure")).toHaveText(LABEL_BINGKAI_KOSONG);
  await expect(bagian.getByRole("img")).toHaveCount(0);
});

test("Admin mengunggah JPG di bawah 5 MB dengan centang persetujuan, dan foto tampil di Galeri dan Beranda (UAT-C4 nomor 1)", async ({
  page,
}) => {
  const judul = "Upacara pembukaan kelas N5";
  await bukaPanelGaleri(page);

  await unggah(page, {
    judul,
    tanggalKegiatan: "2026-09-14",
    berkas: fotoJpg("upacara.jpg"),
    setuju: true,
  });

  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    `Foto "${judul}" sudah diunggah dan tampil di halaman Galeri.`,
  );
  await expect(daftarPanel(page)).toContainText(judul);
  await expect(daftarPanel(page)).toContainText("14-09-2026");

  await page.goto("/galeri");
  const isi = page.getByRole("main");
  const foto = isi.getByRole("img", { name: judul });
  await expect(foto).toBeVisible();
  // next/image mengecilkan foto lewat /_next/image (PRD §3.4).
  await expect(foto).toHaveAttribute(
    "src",
    /^\/_next\/image\?url=%2Ffoto-galeri%2F[0-9a-f-]{36}\.jpeg&w=\d+&q=\d+$/,
  );
  await expect
    .poll(() =>
      foto.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth,
      ),
    )
    .toBeGreaterThan(0);
  await expect(isi.getByRole("figure")).toHaveCount(1);
  await expect(isi.getByRole("figure")).toContainText(judul);
  await expect(isi.getByRole("figure")).toContainText("14-09-2026");
  await expect(isi).not.toContainText(LABEL_BINGKAI_KOSONG[0]);

  const namaBerkas = await namaBerkasFoto(page, judul);
  expect(await berkasDiDisk()).toContain(namaBerkas);

  await page.goto("/");
  const bagian = galeriBeranda(page);
  await expect(bagian.getByRole("img", { name: judul })).toBeVisible();
  await expect(bagian.getByRole("figure")).toHaveCount(1);
  await expect(bagian.getByRole("link", { name: "Galeri" })).toHaveAttribute(
    "href",
    "/galeri",
  );

  await hapusLewatPanel(page, judul);
});

test("PNG di atas 5 MB, GIF, dan JPG tanpa centang ditolak dengan alasan masing-masing, dan tidak tampil di Galeri (UAT-C4 nomor 2–4)", async ({
  page,
}) => {
  await bukaPanelGaleri(page);

  for (const unggahan of UNGGAHAN_DITOLAK) {
    await page.goto(ALAMAT_PANEL);
    await unggah(page, {
      judul: unggahan.judul,
      tanggalKegiatan: "2026-09-15",
      berkas: unggahan.berkas(),
      setuju: unggahan.setuju,
    });

    await expect(
      page.getByRole("main").getByRole("alert"),
      `UAT-C4 nomor ${unggahan.nomor}`,
    ).toHaveText(unggahan.pesan);
    // Isian tetap ada, jadi Admin cukup memperbaiki yang ditolak.
    await expect(formulirUnggah(page).getByLabel("Judul")).toHaveValue(
      unggahan.judul,
    );
  }

  await page.goto(ALAMAT_PANEL);
  await expect(daftarPanel(page)).toHaveCount(0);
  expect(await berkasDiDisk()).toEqual([]);
  await page.goto("/galeri");
  await expect(page.getByRole("main").getByRole("figure")).toHaveText(
    LABEL_BINGKAI_KOSONG,
  );
});

test("berkas foto yang belum dipilih ditolak dengan pesan yang jelas", async ({
  page,
}) => {
  await bukaPanelGaleri(page);

  await unggah(page, {
    judul: "Tanpa berkas",
    tanggalKegiatan: "2026-09-15",
    setuju: true,
  });

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Berkas foto belum dipilih. Pilih foto JPG, PNG, atau WebP yang paling besar 5 MB.",
  );
});

test.describe("server memeriksa ulang syarat unggah", () => {
  // Tanpa JavaScript, formulir dikirim langsung ke server tanpa pemeriksaan di browser.
  test.use({ javaScriptEnabled: false });

  test("tanpa pemeriksaan di browser, PNG di atas 5 MB, GIF, JPG tanpa centang, dan GIF bernama .jpg tetap ditolak dengan alasannya", async ({
    page,
  }) => {
    await masukKePanel(page, ADMIN);

    const gifBernamaJpg = {
      nomor: 3,
      judul: "GIF bernama .jpg",
      // Jenis kiriman browser image/jpeg, tetapi isinya GIF: server memeriksa format dari isi berkas.
      berkas: () => ({
        name: "menyamar.jpg",
        mimeType: "image/jpeg",
        buffer: ISI_GIF,
      }),
      setuju: true,
      pesan: PESAN_FORMAT,
    };
    for (const unggahan of [...UNGGAHAN_DITOLAK, gifBernamaJpg]) {
      await page.goto(ALAMAT_PANEL);
      await unggah(page, {
        judul: unggahan.judul,
        tanggalKegiatan: "2026-09-15",
        berkas: unggahan.berkas(),
        setuju: unggahan.setuju,
      });

      await expect(
        page.getByRole("main").getByRole("alert"),
        unggahan.judul,
      ).toHaveText(unggahan.pesan);
    }

    expect(await berkasDiDisk()).toEqual([]);
    await page.goto("/galeri");
    await expect(page.getByRole("main").getByRole("figure")).toHaveText(
      LABEL_BINGKAI_KOSONG,
    );
  });
});

test.describe("hanya Admin yang bisa mengelola galeri (▶ Keputusan OD-16)", () => {
  test("Staf ditolak dengan 403 di halaman kelola galeri", async ({ page }) => {
    await masukKePanel(page, STAF);

    const jawaban = await page.goto(ALAMAT_PANEL);

    expect(jawaban?.status()).toBe(403);
    await expect(
      page.getByRole("heading", { level: 1, name: "Akses ditolak" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Unggah foto" })).toHaveCount(
      0,
    );
  });

  test("pengunjung diarahkan ke halaman masuk", async ({ page }) => {
    await page.goto(ALAMAT_PANEL);

    await expect(page).toHaveURL("/panel/masuk");
  });

  test("server menolak permintaan unggah dan hapus yang dikirim langsung oleh Staf", async ({
    browser,
  }) => {
    // Admin membuka panel tanpa JavaScript, jadi formulirnya memuat isian tersembunyi Server Action dari server.
    const konteksAdmin = await browser.newContext({ javaScriptEnabled: false });
    const admin = await konteksAdmin.newPage();
    await masukKePanel(admin, ADMIN);
    await admin.goto(ALAMAT_PANEL);
    await unggah(admin, {
      judul: "Foto milik Admin",
      tanggalKegiatan: "2026-09-16",
      berkas: fotoJpg("milik-admin.jpg"),
      setuju: true,
    });
    await expect(admin.getByRole("main").getByRole("status")).toHaveText(
      'Foto "Foto milik Admin" sudah diunggah dan tampil di halaman Galeri.',
    );
    await admin.goto(ALAMAT_PANEL);
    const isianUnggah = await isianTersembunyi(formulirUnggah(admin));
    const isianHapus = await isianTersembunyi(
      formulirHapus(admin, "Foto milik Admin"),
    );
    const berkasSebelum = await berkasDiDisk();
    expect(berkasSebelum).toHaveLength(1);

    const konteksStaf = await browser.newContext();
    const staf = await konteksStaf.newPage();
    await masukKePanel(staf, STAF);

    // Next.js menjawab penolakan kewenangan dari kiriman formulir tanpa JavaScript dengan halaman 404 (pada kiriman
    // lewat JavaScript 403), jadi yang diperiksa: jawabannya bukan sukses, dan tidak ada yang berubah.
    const jawabanUnggah = await staf.request.post(ALAMAT_PANEL, {
      multipart: {
        ...isianUnggah,
        judul: "Unggahan langsung Staf",
        tanggalKegiatan: "2026-09-16",
        berkas: fotoJpg("staf.jpg"),
        persetujuan: "ya",
      },
    });
    expect(jawabanUnggah.ok(), "unggah langsung oleh Staf").toBe(false);
    const jawabanHapus = await staf.request.post(ALAMAT_PANEL, {
      multipart: isianHapus,
    });
    expect(jawabanHapus.ok(), "hapus langsung oleh Staf").toBe(false);

    // Foto Admin dan berkasnya masih ada, dan unggahan Staf tidak tersimpan.
    expect(await berkasDiDisk()).toEqual(berkasSebelum);
    await staf.goto("/galeri");
    const isi = staf.getByRole("main");
    await expect(
      isi.getByRole("img", { name: "Foto milik Admin" }),
    ).toBeVisible();
    await expect(isi.getByRole("figure")).toHaveCount(1);

    // Pembanding: permintaan langsung yang sama dari Admin diterima, jadi penolakan di atas memang karena kewenangan.
    const unggahAdmin = await admin.request.post(ALAMAT_PANEL, {
      multipart: {
        ...isianUnggah,
        judul: "Unggahan langsung Admin",
        tanggalKegiatan: "2026-09-16",
        berkas: fotoJpg("langsung.jpg"),
        persetujuan: "ya",
      },
    });
    expect(unggahAdmin.status()).toBe(200);
    expect(await berkasDiDisk()).toHaveLength(2);
    const hapusAdmin = await admin.request.post(ALAMAT_PANEL, {
      multipart: isianHapus,
    });
    expect(hapusAdmin.status()).toBe(200);
    expect(await berkasDiDisk()).toHaveLength(1);
    await staf.goto("/galeri");
    await expect(
      staf.getByRole("main").getByRole("img", { name: "Foto milik Admin" }),
    ).toHaveCount(0);

    await hapusLewatPanel(admin, "Unggahan langsung Admin");
    expect(await berkasDiDisk()).toEqual([]);
    await konteksAdmin.close();
    await konteksStaf.close();
  });
});

test("foto yang dihapus hilang dari panel, Galeri, dan Beranda, dan berkasnya hilang dari disk", async ({
  page,
}) => {
  const judul = "Praktik memasak washoku";
  await bukaPanelGaleri(page);
  await unggahFotoSah(page, judul, "2026-09-20");
  await page.goto("/galeri");
  const namaBerkas = await namaBerkasFoto(page, judul);
  expect(await berkasDiDisk()).toEqual([namaBerkas]);
  // Salinan kecil dari next/image tersaji, dan sejak itu tersimpan di tembolok next/image.
  const alamatSalinan =
    (await page.getByRole("img", { name: judul }).getAttribute("src")) ?? "";
  expect((await page.request.get(alamatSalinan)).status()).toBe(200);

  // Konfirmasi dibatalkan: tidak ada yang terhapus.
  await page.goto(ALAMAT_PANEL);
  let pesanKonfirmasi = "";
  page.once("dialog", (dialog) => {
    pesanKonfirmasi = dialog.message();
    return dialog.dismiss();
  });
  await daftarPanel(page)
    .getByRole("button", { name: `Hapus ${judul}` })
    .click();
  await expect.poll(() => pesanKonfirmasi).toContain(`Hapus foto "${judul}"?`);
  await page.reload();
  await expect(daftarPanel(page)).toContainText(judul);
  expect(await berkasDiDisk()).toEqual([namaBerkas]);

  await hapusLewatPanel(page, judul);

  await expect(daftarPanel(page)).toHaveCount(0);
  expect(await berkasDiDisk()).toEqual([]);
  const jawabanAsli = await page.request.get(`/foto-galeri/${namaBerkas}`);
  expect(jawabanAsli.status()).toBe(404);
  expect(await jawabanAsli.text()).toBe(
    "Foto tidak ditemukan; mungkin sudah dihapus dari galeri. Buka halaman Galeri di /galeri untuk melihat foto yang ada.",
  );
  // Salinan kecilnya juga tidak tersaji lagi dari tembolok next/image.
  expect((await page.request.get(alamatSalinan)).ok()).toBe(false);
  await page.goto("/galeri");
  await expect(page.getByRole("main").getByRole("img")).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("figure")).toHaveText(
    LABEL_BINGKAI_KOSONG,
  );
  await page.goto("/");
  await expect(galeriBeranda(page).getByRole("img")).toHaveCount(0);
  await expect(galeriBeranda(page).getByRole("figure")).toHaveText(
    LABEL_BINGKAI_KOSONG,
  );
});

test("Galeri menampilkan foto terbaru di atas, dan Beranda hanya tiga foto terbaru", async ({
  page,
}) => {
  await bukaPanelGaleri(page);
  // Urutan unggah sengaja acak. Dua foto bertanggal sama: yang diunggah belakangan tampil lebih dulu.
  const unggahan = [
    { judul: "Kunjungan perusahaan penerima", tanggalKegiatan: "2026-08-01" },
    { judul: "Ujian JFT-Basic bersama", tanggalKegiatan: "2026-10-05" },
    { judul: "Senam pagi", tanggalKegiatan: "2026-07-12" },
    { judul: "Pelepasan alumni", tanggalKegiatan: "2026-09-30" },
    { judul: "Foto bersama alumni", tanggalKegiatan: "2026-09-30" },
  ];
  for (const { judul, tanggalKegiatan } of unggahan) {
    await unggahFotoSah(page, judul, tanggalKegiatan);
  }
  const terbaruDiAtas = [
    "Ujian JFT-Basic bersama",
    "Foto bersama alumni",
    "Pelepasan alumni",
    "Kunjungan perusahaan penerima",
    "Senam pagi",
  ];
  const sebagaiPola = (judul: string) => new RegExp(`^${judul}`);

  await page.goto(ALAMAT_PANEL);
  await expect(daftarPanel(page).getByRole("listitem")).toHaveText(
    terbaruDiAtas.map(sebagaiPola),
  );
  await page.goto("/galeri");
  await expect(page.getByRole("main").getByRole("figure")).toHaveText(
    terbaruDiAtas.map(sebagaiPola),
  );
  await expect(
    page.getByRole("main").getByRole("figure").first(),
  ).toContainText("05-10-2026");
  await page.goto("/");
  await expect(galeriBeranda(page).getByRole("figure")).toHaveText(
    terbaruDiAtas.slice(0, 3).map(sebagaiPola),
  );

  for (const judul of terbaruDiAtas) await hapusLewatPanel(page, judul);
  expect(await berkasDiDisk()).toEqual([]);
});

test("halaman Galeri, Beranda, dan panel galeri tidak bergulir ke samping di lebar 375 px, tanpa dan dengan foto", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const alamat of ["/galeri", "/"]) {
    await page.goto(alamat);
    await expect(page.getByRole("figure").first()).toBeVisible();
    await periksaTidakBergulirKeSamping(page);
  }

  await bukaPanelGaleri(page);
  const judul = [
    "Kelas N4 sore dengan judul yang cukup panjang untuk layar HP",
    "Latihan wawancara",
    "Upacara kelulusan",
  ];
  for (const j of judul) await unggahFotoSah(page, j, "2026-10-01");
  await periksaTidakBergulirKeSamping(page);
  for (const alamat of ["/galeri", "/"]) {
    await page.goto(alamat);
    await expect(page.getByRole("img", { name: judul[2] })).toBeVisible();
    await periksaTidakBergulirKeSamping(page);
  }

  for (const j of judul) await hapusLewatPanel(page, j);
});

test("alamat berkas foto yang bukan nama foto galeri dijawab 404 dengan pesan yang jelas", async ({
  page,
}) => {
  for (const nama of [
    "..%2F..%2Fpackage.json",
    "bukan-foto.txt",
    "3f2a9b1c-0d4e-4f5a-8b6c-7d8e9f0a1b2c.gif",
    "3f2a9b1c-0d4e-4f5a-8b6c-7d8e9f0a1b2c.jpeg",
  ]) {
    const jawaban = await page.request.get(`/foto-galeri/${nama}`);

    expect(jawaban.status(), nama).toBe(404);
    expect(await jawaban.text()).toBe(
      "Foto tidak ditemukan; mungkin sudah dihapus dari galeri. Buka halaman Galeri di /galeri untuk melihat foto yang ada.",
    );
  }
});
