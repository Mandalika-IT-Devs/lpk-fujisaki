import { expect, type Locator, type Page, test } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import postgres from "postgres";
import { KODE_LANGKAH } from "../../src/domain/pendaftaran";
import { ADMIN, masukKePanel, STAF } from "./pegawai-uji";

// Penutupan di tahap 1 dan pendaftaran ulang (issue T16, PRD §2.3 dan ▶ Keputusan OD-14, §6.6, §7.5, UAT-F5, UAT-G4
// bagian tahap 1). Pendaftaran uji diisi langsung ke database test, masing-masing dengan akun pemiliknya yang bisa
// masuk. Semuanya dikirim pada 2024 dengan nomor FGC-2024-02…, jadi tidak bertabrakan dengan nomor test lain. Setiap
// test memakai pendaftarannya sendiri. Penolakan Tidak lolos seleksi di tahap 2 (UAT-G4 langkah 1) diuji di modul
// domain, karena pindah tahap baru ada di M2.

type PendaftaranUji = {
  nomor: string;
  namaLengkap: string;
  email: string;
  nomorWhatsApp: string;
  kabupatenKota: string;
  /** Penutupan yang langsung diisi ke database, atau undefined untuk pendaftaran Berjalan. */
  penutupan?: { alasan: string; keterangan: string };
};

const KATA_SANDI = "sandi-calon-uji";

const ANDI: PendaftaranUji = {
  nomor: "FGC-2024-0201",
  namaLengkap: "Andi Penutupan Uji",
  email: "penutupan.uji.andi@contoh.test",
  nomorWhatsApp: "6281200002601",
  kabupatenKota: "Kab. Cilacap",
};
const BAYU: PendaftaranUji = {
  nomor: "FGC-2024-0202",
  namaLengkap: "Bayu Penutupan Uji",
  email: "penutupan.uji.bayu@contoh.test",
  nomorWhatsApp: "6281200002602",
  kabupatenKota: "Kab. Banyumas",
};
const CITRA: PendaftaranUji = {
  nomor: "FGC-2024-0203",
  namaLengkap: "Citra Penutupan Uji",
  email: "penutupan.uji.citra@contoh.test",
  nomorWhatsApp: "6281200002603",
  kabupatenKota: "Kab. Kebumen",
  penutupan: {
    alasan: "Dikeluarkan",
    keterangan: "Catatan penutupan khusus pegawai untuk Citra.",
  },
};
const DIAN: PendaftaranUji = {
  nomor: "FGC-2024-0204",
  namaLengkap: "Dian Daftar Ulang Uji",
  email: "penutupan.uji.dian@contoh.test",
  nomorWhatsApp: "6281200002604",
  kabupatenKota: "Kab. Purworejo",
};

/** Mengisi pendaftaran uji di tahap 1 beserta 22 langkahnya. Aman diulang bila test dicoba lagi. */
async function isiPendaftaranUji() {
  const sql = postgres(process.env.DATABASE_URL ?? "", { onnotice: () => {} });
  try {
    await sql`delete from akun where email like 'penutupan.uji.%@contoh.test'`;
    const hash = await hashPassword(KATA_SANDI);
    for (const uji of [ANDI, BAYU, CITRA, DIAN]) {
      const [{ id: akunId }] = await sql<{ id: string }[]>`
        insert into akun (name, email, email_verified, jenis, nomor_whatsapp, waktu_persetujuan)
        values (${uji.namaLengkap}, ${uji.email}, true, 'pemilik_akun', ${uji.nomorWhatsApp}, now())
        returning id`;
      await sql`
        insert into kredensial (account_id, provider_id, user_id, password)
        values (${akunId}, 'credential', ${akunId}, ${hash})`;
      const [{ id: pendaftaranId }] = await sql<{ id: string }[]>`
        insert into pendaftaran (akun_id, nomor, dikirim_pada, status, tahap, nama_lengkap, jenis_kelamin, tempat_lahir,
          tanggal_lahir, kabupaten_kota, provinsi, pendidikan_terakhir, program_id, bidang_kerja_id,
          bidang_kerja_belum_tahu, kemampuan_bahasa_jepang, nama_kontak_darurat, hubungan_kontak_darurat,
          nomor_hp_kontak_darurat, alasan_penutupan, keterangan_penutupan)
        values (${akunId}, ${uji.nomor}, '2024-06-10T03:00:00Z', ${uji.penutupan ? "Ditutup" : "Berjalan"}, 1,
          ${uji.namaLengkap}, 'Laki-laki', 'Cilacap', '2004-05-17', ${uji.kabupatenKota}, 'Jawa Tengah', 'SMK',
          (select id from program where nama = 'Tokutei Ginou (SSW)'),
          (select id from bidang_kerja where nama = 'Pembersihan gedung'),
          false, 'N5', 'Kontak Darurat Uji', 'Ibu', '6281234567890',
          ${uji.penutupan?.alasan ?? null}, ${uji.penutupan?.keterangan ?? null})
        returning id`;
      for (const kode of KODE_LANGKAH) {
        await sql`
          insert into langkah_pendaftaran (pendaftaran_id, kode, status)
          values (${pendaftaranId}, ${kode}, 'Belum')`;
      }
    }
  } finally {
    await sql.end();
  }
}

test.beforeAll(isiPendaftaranUji);

const alamat = (uji: PendaftaranUji) => `/panel/pendaftaran/${uji.nomor}`;
const POLA_NOMOR_PENDAFTARAN = /^FGC-\d{4}-\d{4,}$/;

function formulirTutup(page: Page) {
  return page.getByRole("form", { name: "Tutup pendaftaran" });
}

function ringkasan(page: Page) {
  return page.getByRole("region", { name: "Ringkasan pendaftaran" });
}

async function tutupLewatHalaman(
  page: Page,
  penutupan: { alasan: string; keterangan: string },
) {
  const formulir = formulirTutup(page);
  if (penutupan.alasan) {
    await formulir
      .getByRole("radio", { name: penutupan.alasan, exact: true })
      .check();
  }
  await formulir.getByLabel("Keterangan penutupan").fill(penutupan.keterangan);
  await formulir.getByRole("button", { name: "Tutup pendaftaran" }).click();
}

/** Masuk sebagai pemilik akun sebuah pendaftaran uji, lalu menunggu halaman akunnya terbuka. */
async function masukSebagaiPemilikAkun(page: Page, uji: PendaftaranUji) {
  await page.goto("/masuk");
  await page.getByLabel("Email").fill(uji.email);
  await page.getByLabel("Kata sandi").fill(KATA_SANDI);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL("/akun");
}

function pendaftaranDitutupDiAkun(page: Page) {
  return page.getByRole("region", { name: "Pendaftaran yang ditutup" });
}

/**
 * Semua isian formulir yang akan terkirim, termasuk isian tersimpan Server Action dari formulir yang dirender server
 * ($ACTION_…). Dengan isian ini, test mengirim permintaan langsung ke server tanpa melewati halaman.
 */
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

test("penutupan tanpa keterangan ditolak, dan pendaftarannya tetap Berjalan (UAT-G4 langkah 2, bagian tahap 1)", async ({
  page,
}) => {
  // Admin juga bisa melakukan semua tugas Staf (PRD §2.2).
  await masukKePanel(page, ADMIN);
  await page.goto(alamat(ANDI));

  // Di tahap 1, ketiga alasan bisa dipilih (PRD §7.5).
  const formulir = formulirTutup(page);
  await expect(formulir.getByRole("radio")).toHaveCount(3);
  for (const alasan of ["Tidak lolos seleksi", "Mundur", "Dikeluarkan"]) {
    await expect(
      formulir.getByRole("radio", { name: alasan, exact: true }),
    ).toBeVisible();
  }

  await tutupLewatHalaman(page, { alasan: "Mundur", keterangan: "   " });

  const keterangan = formulir.getByLabel("Keterangan penutupan");
  await expect(formulir.getByRole("alert")).toHaveText(
    "Pendaftaran belum ditutup karena keterangan penutupan belum diisi. Tulis keterangannya, lalu tutup lagi.",
  );
  await expect(keterangan).toHaveAttribute("aria-invalid", "true");
  await expect(keterangan).toHaveAccessibleDescription(
    /Keterangan penutupan belum diisi\. Keterangan wajib diisi untuk menutup pendaftaran\./,
  );
  await expect(
    formulir.getByRole("radio", { name: "Mundur", exact: true }),
  ).toBeChecked();

  // Alasan yang belum dipilih juga ditolak.
  await page.reload();
  await tutupLewatHalaman(page, { alasan: "", keterangan: "Keterangan uji" });
  await expect(formulir.getByRole("alert")).toHaveText(
    "Pendaftaran belum ditutup karena alasan penutupan belum dipilih. Pilih alasannya, lalu tutup lagi.",
  );
  await expect(formulir.getByLabel("Keterangan penutupan")).toHaveValue(
    "Keterangan uji",
  );

  await page.reload();
  await expect(ringkasan(page)).toContainText("Berjalan");
  await expect(ringkasan(page)).not.toContainText("Alasan penutupan");
  await expect(formulirTutup(page)).toBeVisible();
});

test("Staf menutup dengan alasan Mundur dan keterangan; statusnya Ditutup, dan tidak ada cara membukanya kembali, juga lewat permintaan langsung (UAT-G4 bagian tahap 1)", async ({
  page,
  browser,
}) => {
  // Staf membuka halaman yang sama tanpa JavaScript, jadi formulir tutup memuat isian Server Action dari server. Isian
  // ini dipakai nanti untuk permintaan langsung, sesudah formulirnya tidak tampil lagi.
  const konteksTanpaJs = await browser.newContext({ javaScriptEnabled: false });
  const stafTanpaJs = await konteksTanpaJs.newPage();
  await masukKePanel(stafTanpaJs, STAF);
  await stafTanpaJs.goto(alamat(BAYU));
  const formulirTanpaJs = formulirTutup(stafTanpaJs);
  await formulirTanpaJs
    .getByRole("radio", { name: "Dikeluarkan", exact: true })
    .check();
  await formulirTanpaJs
    .getByLabel("Keterangan penutupan")
    .fill("Ditutup ulang lewat permintaan langsung.");
  const isianUlang = await isianTerkirim(formulirTanpaJs);
  expect(isianUlang.nomor).toBe(BAYU.nomor);

  await masukKePanel(page, STAF);
  await page.goto(alamat(BAYU));
  await tutupLewatHalaman(page, {
    alasan: "Mundur",
    keterangan: "Diterima kerja di pabrik dekat rumah.",
  });

  const ringkasanBayu = ringkasan(page);
  await expect(ringkasanBayu).toContainText("Ditutup");
  await expect(ringkasanBayu).toContainText("Alasan penutupan");
  await expect(ringkasanBayu).toContainText("Mundur");
  await expect(ringkasanBayu).toContainText(
    "Diterima kerja di pabrik dekat rumah.",
  );
  await expect(ringkasanBayu).toContainText(
    "Pendaftaran yang ditutup tidak bisa dibuka kembali.",
  );
  // Tidak ada formulir tutup lagi, dan tidak ada tombol atau tautan untuk membukanya kembali.
  await expect(formulirTutup(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /buka/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /buka/i })).toHaveCount(0);

  // Permintaan langsung ke Server Action tutup dari Staf, dengan alasan dan keterangan lain, tidak mengubah apa pun.
  await stafTanpaJs.request.post(alamat(BAYU), { multipart: isianUlang });
  await page.reload();
  await expect(ringkasanBayu).toContainText("Mundur");
  await expect(ringkasanBayu).toContainText(
    "Diterima kerja di pabrik dekat rumah.",
  );
  await expect(ringkasanBayu).not.toContainText("Dikeluarkan");
  await expect(ringkasanBayu).not.toContainText("Ditutup ulang");

  // Database ikut membuktikan: status, alasan, dan keterangan pertama tetap.
  const sql = postgres(process.env.DATABASE_URL ?? "", { onnotice: () => {} });
  try {
    const [tersimpan] = await sql<
      { status: string; alasan: string; keterangan: string }[]
    >`
      select status, alasan_penutupan as alasan, keterangan_penutupan as keterangan
      from pendaftaran where nomor = ${BAYU.nomor}`;
    expect(tersimpan).toEqual({
      status: "Ditutup",
      alasan: "Mundur",
      keterangan: "Diterima kerja di pabrik dekat rumah.",
    });
  } finally {
    await sql.end();
  }

  // Pemilik akun juga tidak bisa memakai Server Action tutup: permintaannya ditolak sebelum diproses.
  const konteksPemilik = await browser.newContext();
  const pemilik = await konteksPemilik.newPage();
  await masukSebagaiPemilikAkun(pemilik, BAYU);
  const jawabanPemilik = await pemilik.request.post(alamat(BAYU), {
    multipart: isianUlang,
    maxRedirects: 0,
  });
  expect(jawabanPemilik.ok(), "tutup langsung oleh pemilik akun").toBe(false);

  await konteksTanpaJs.close();
  await konteksPemilik.close();
});

test("pemilik akun melihat status Ditutup dan alasannya, tetapi tidak melihat keterangan penutupan (▶ Keputusan OD-14)", async ({
  page,
}) => {
  await masukSebagaiPemilikAkun(page, CITRA);

  const ditutup = pendaftaranDitutupDiAkun(page);
  await expect(ditutup).toContainText(CITRA.nomor);
  await expect(ditutup).toContainText("Tokutei Ginou (SSW)");
  await expect(ditutup).toContainText("Ditutup");
  await expect(ditutup).toContainText("Dikeluarkan");
  // Keterangan tidak tampil, dan tidak ikut terkirim ke browser.
  const keterangan = CITRA.penutupan?.keterangan ?? "";
  await expect(page.getByText(keterangan)).toHaveCount(0);
  expect(await page.content()).not.toContain(keterangan);

  // Tidak ada pendaftaran Berjalan, jadi ia diajak mengisi formulir pendaftaran baru.
  await expect(page.getByRole("region", { name: "Pendaftaranmu" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("link", { name: "Isi formulir pendaftaran" }),
  ).toBeVisible();
});

test("pemilik akun mengirim formulir baru dari isian lama dan mendapat nomor baru di tahap 1; pendaftaran lama tetap terlihat di panel pegawai dengan status Ditutup (UAT-F5)", async ({
  page,
  browser,
}) => {
  // 1. Sebagai Staf, tutup pendaftaran dengan alasan Mundur.
  const konteksStaf = await browser.newContext();
  const staf = await konteksStaf.newPage();
  await masukKePanel(staf, STAF);
  await staf.goto(alamat(DIAN));
  await tutupLewatHalaman(staf, {
    alasan: "Mundur",
    keterangan: "Mundur karena urusan keluarga.",
  });
  await expect(ringkasan(staf)).toContainText("Ditutup");

  // 2. Masuk sebagai pemilik akun, lalu kirim formulir pendaftaran baru.
  await masukSebagaiPemilikAkun(page, DIAN);
  await expect(pendaftaranDitutupDiAkun(page)).toContainText(DIAN.nomor);
  await expect(pendaftaranDitutupDiAkun(page)).toContainText("Mundur");
  await page.getByRole("link", { name: "Isi formulir pendaftaran" }).click();
  await expect(page).toHaveURL("/akun/formulir-pendaftaran");

  // Isian lama menjadi isian awal (PRD §6.6).
  const formulir = page.getByRole("form", { name: "Formulir pendaftaran" });
  await expect(formulir.getByLabel("Nama lengkap sesuai KTP")).toHaveValue(
    DIAN.namaLengkap,
  );
  await expect(formulir.getByLabel("Kabupaten/kota domisili")).toHaveValue(
    DIAN.kabupatenKota,
  );
  await expect(formulir.getByLabel("Tanggal lahir")).toHaveValue("2004-05-17");
  await expect(
    formulir.getByRole("radio", { name: "Laki-laki" }),
  ).toBeChecked();
  await expect(
    formulir.getByLabel("Program", { exact: true }).locator("option:checked"),
  ).toHaveText("Tokutei Ginou (SSW)");
  await expect(
    formulir.getByLabel("Bidang kerja yang diminati").locator("option:checked"),
  ).toHaveText("Pembersihan gedung");

  await formulir.getByRole("button", { name: "Kirim formulir" }).click();

  // Diterima dengan nomor pendaftaran baru.
  await expect(page).toHaveURL("/akun/konfirmasi-pendaftaran");
  const nomorBaru = (
    await page.getByRole("main").getByText(POLA_NOMOR_PENDAFTARAN).textContent()
  )?.trim();
  expect(nomorBaru).toMatch(POLA_NOMOR_PENDAFTARAN);
  expect(nomorBaru).not.toBe(DIAN.nomor);

  // Pendaftaran baru Berjalan di tahap 1; pendaftaran lama tetap tampil sebagai Ditutup.
  await page.goto("/akun");
  const berjalan = page.getByRole("region", { name: "Pendaftaranmu" });
  await expect(berjalan).toContainText(nomorBaru ?? "");
  await expect(berjalan).toContainText("Berjalan");
  await expect(berjalan).toContainText("FG 01");
  await expect(berjalan).toContainText("Pendaftaran dan seleksi");
  await expect(berjalan).not.toContainText(DIAN.nomor);
  await expect(pendaftaranDitutupDiAkun(page)).toContainText(DIAN.nomor);
  await expect(pendaftaranDitutupDiAkun(page)).not.toContainText(
    nomorBaru ?? "",
  );

  // Pendaftaran lama tetap terlihat di panel pegawai dengan status Ditutup, di samping pendaftaran baru.
  await staf.goto("/panel/pendaftaran");
  await staf
    .getByLabel("Cari nama atau nomor pendaftaran")
    .fill(DIAN.namaLengkap);
  await staf.getByRole("button", { name: "Terapkan" }).click();
  const tabel = staf.getByRole("table", { name: "Daftar pendaftaran" });
  await expect(tabel.locator("tbody tr")).toHaveCount(2);
  await expect(
    tabel.locator("tbody tr").filter({ hasText: DIAN.nomor }),
  ).toContainText("Ditutup");
  await expect(
    tabel.locator("tbody tr").filter({ hasText: nomorBaru ?? "" }),
  ).toContainText("Berjalan");

  await staf.goto(alamat(DIAN));
  await expect(ringkasan(staf)).toContainText("Ditutup");
  await expect(ringkasan(staf)).toContainText("Mundur");
  await expect(ringkasan(staf)).toContainText("Mundur karena urusan keluarga.");

  await konteksStaf.close();
});

test("halaman pendaftaran dengan formulir tutup tidak bergulir ke samping di lebar 375 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await masukKePanel(page, STAF);
  await page.goto(alamat(ANDI));
  await expect(formulirTutup(page)).toBeVisible();

  const lebar = await page.evaluate(() => ({
    dokumen: document.documentElement.scrollWidth,
    layar: window.innerWidth,
  }));
  expect(lebar.dokumen).toBeLessThanOrEqual(lebar.layar);
});
