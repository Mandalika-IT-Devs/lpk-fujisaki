import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Test penjaga sistem desain. Sumber kebenarannya frontmatter docs/DESIGN.md; berkas temanya src/app/globals.css.
const AKAR = fileURLToPath(new URL("../../", import.meta.url));
const BERKAS_TEMA = `${AKAR}src/app/globals.css`;
const tema = readFileSync(BERKAS_TEMA, "utf8");

type Properti = Record<string, string>;
type Frontmatter = Record<string, Record<string, Properti | string>>;

/** Membaca frontmatter YAML sederhana docs/DESIGN.md: grup → nama token → nilai atau properti. */
function bacaTokenDesain(): Frontmatter {
  const isi = readFileSync(`${AKAR}docs/DESIGN.md`, "utf8");
  const frontmatter = isi.split(/^---$/m)[1];
  const hasil: Frontmatter = {};
  let grup = "";
  let nama = "";
  for (const baris of frontmatter.split("\n")) {
    const cocok = /^( *)([\w-]+):\s*(.*)$/.exec(baris);
    if (!cocok) continue;
    const [, indentasi, kunci, nilaiMentah] = cocok;
    const nilai = nilaiMentah.replace(/^"(.*)"$/, "$1");
    if (indentasi.length === 0) {
      grup = kunci;
      hasil[grup] = {};
    } else if (indentasi.length === 2) {
      nama = kunci;
      hasil[grup][nama] = nilai === "" ? {} : nilai;
    } else {
      const induk = hasil[grup][nama];
      if (typeof induk !== "string") induk[kunci] = nilai;
    }
  }
  return hasil;
}

/** Nilai satu variabel tema, misalnya `--color-jalur`, persis seperti ditulis di berkas tema. */
function nilaiTema(variabel: string): string | undefined {
  const nama = variabel.replace(/-/g, "\\-");
  return new RegExp(`(?<![\\w-])${nama}:\\s*([^;]+);`)
    .exec(tema)?.[1]
    .replace(/\s+/g, " ")
    .trim();
}

const desain = bacaTokenDesain();

function nilaiTunggal(grup: string): [string, string][] {
  return Object.entries(desain[grup]).flatMap(([nama, nilai]) =>
    typeof nilai === "string" ? [[nama, nilai] as [string, string]] : [],
  );
}

function properti(grup: string): [string, Properti][] {
  return Object.entries(desain[grup]).flatMap(([nama, nilai]) =>
    typeof nilai === "string" ? [] : [[nama, nilai] as [string, Properti]],
  );
}

describe("token desain menjadi tema Tailwind", () => {
  it("frontmatter docs/DESIGN.md terbaca", () => {
    expect(nilaiTunggal("colors").length).toBeGreaterThan(0);
    expect(properti("typography").length).toBeGreaterThan(0);
  });

  it.each(nilaiTunggal("colors"))("warna %s", (nama, nilai) => {
    expect(nilaiTema(`--color-${nama}`)?.toLowerCase()).toBe(
      nilai.toLowerCase(),
    );
  });

  it.each(nilaiTunggal("rounded"))("sudut %s", (nama, nilai) => {
    expect(nilaiTema(`--radius-${nama}`)).toBe(nilai);
  });

  it.each(nilaiTunggal("spacing"))("jarak %s", (nama, nilai) => {
    expect(nilaiTema(`--spacing-${nama}`)).toBe(nilai);
  });

  it.each(properti("typography"))("tipografi %s", (nama, p) => {
    if (p.fontSize) expect(nilaiTema(`--text-${nama}`)).toBe(p.fontSize);
    if (p.fontSize && p.lineHeight)
      expect(nilaiTema(`--text-${nama}--line-height`)).toBe(p.lineHeight);
    if (p.fontSize && p.letterSpacing)
      expect(nilaiTema(`--text-${nama}--letter-spacing`)).toBe(p.letterSpacing);
    if (p.fontSize && p.fontWeight)
      expect(nilaiTema(`--text-${nama}--font-weight`)).toBe(p.fontWeight);
  });

  // Keluarga huruf tidak bisa ikut token ukuran Tailwind, jadi setiap keluarga punya token font sendiri.
  const TOKEN_HURUF: Record<string, string> = {
    "Barlow Semi Condensed": "--font-papan",
    Barlow: "--font-sans",
    "Zen Kaku Gothic New": "--font-jp",
  };
  const keluargaHuruf = [
    ...new Set(properti("typography").map(([, p]) => p.fontFamily)),
  ];

  it.each(keluargaHuruf)("keluarga huruf %s", (keluarga) => {
    const [utama, ...cadangan] = keluarga.split(",").map((k) => k.trim());
    const nilai = nilaiTema(TOKEN_HURUF[utama]);
    expect(nilai).toBeDefined();
    // Huruf yang di-host sendiri dimuat lewat variabel next/font, jadi yang dicek hanya huruf cadangan sistem.
    for (const k of cadangan.filter((k) => !(k in TOKEN_HURUF)))
      expect(nilai).toContain(k);
  });
});

/** Luminans relatif WCAG 2.2 untuk warna #RRGGBB. */
function luminans(warna: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const kanal = parseInt(warna.slice(i, i + 2), 16) / 255;
    return kanal <= 0.04045 ? kanal / 12.92 : ((kanal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function kontras(teks: string, latar: string): number {
  const [terang, gelap] = [luminans(teks), luminans(latar)].sort(
    (a, b) => b - a,
  );
  return (terang + 0.05) / (gelap + 0.05);
}

describe("kontras teks memenuhi WCAG 2.2 AA", () => {
  // Ambang WCAG 2.2 AA: 4,5:1 untuk teks biasa, 3:1 untuk teks besar (≥ 24px, atau ≥ 18,66px tebal).
  const TEKS_BIASA = 4.5;
  const TEKS_BESAR = 3;

  // Pasangan teks dan latar yang dipakai docs/DESIGN.md. Abu "lewat" tidak ada di sini: ia hanya untuk keadaan nonaktif.
  const PASANGAN: [string, string, number, string][] = [
    ["navy", "dasar", TEKS_BIASA, "teks utama"],
    ["navy", "jalur-pucat", TEKS_BIASA, "teks di konter dan catatan"],
    ["teks-2", "dasar", TEKS_BIASA, "teks pendukung"],
    ["teks-2", "jalur-pucat", TEKS_BIASA, "keterangan di latar pucat"],
    ["jalur", "dasar", TEKS_BIASA, "tautan dan tombol kedua"],
    ["jalur", "jalur-pucat", TEKS_BIASA, "tautan di latar pucat"],
    ["jalur-tua", "dasar", TEKS_BIASA, "hover tautan"],
    ["jalur-tua", "jalur-pucat", TEKS_BIASA, "hover tombol kedua"],
    ["oranye-teks", "dasar", TEKS_BIASA, "teks oranye seukuran teks"],
    ["dasar", "jalur", TEKS_BIASA, "tautan kaki dan pita papan"],
    ["teks-di-jalur", "jalur", TEKS_BIASA, "teks kaki dan teks redup pita"],
    ["navy", "oranye", TEKS_BIASA, "lencana kamu di sini"],
    ["navy", "oranye-pucat", TEKS_BIASA, "teks yang dipilih"],
    ["dasar", "oranye", TEKS_BESAR, "tombol utama 20px tebal"],
    ["dasar", "oranye-tekan", TEKS_BESAR, "hover tombol utama"],
    ["oranye", "dasar", TEKS_BESAR, "merek Fujisaki 26px tebal"],
  ];

  it.each(PASANGAN)("%s di atas %s (≥ %s:1, %s)", (teks, latar, ambang) => {
    const warnaTeks = nilaiTema(`--color-${teks}`) ?? "";
    const warnaLatar = nilaiTema(`--color-${latar}`) ?? "";
    expect(warnaTeks).toMatch(/^#[0-9a-f]{6}$/i);
    expect(warnaLatar).toMatch(/^#[0-9a-f]{6}$/i);
    expect(kontras(warnaTeks, warnaLatar)).toBeGreaterThanOrEqual(ambang);
  });
});

describe("tidak ada nilai warna mentah di luar berkas tema", () => {
  // Hanya berkas teks yang diperiksa; berkas huruf .woff2 bersifat biner.
  const BERKAS_TEKS = /\.(ts|tsx|js|jsx|mjs|css|svg)$/;
  const WARNA_HEKSA = /#[0-9a-f]{3,8}\b/gi;

  const berkas = ["src/app", "src/components"].flatMap((folder) =>
    readdirSync(`${AKAR}${folder}`, { recursive: true, withFileTypes: true })
      .filter((b) => b.isFile() && BERKAS_TEKS.test(b.name))
      .map((b) => `${b.parentPath}/${b.name}`)
      .filter((jalur) => jalur !== BERKAS_TEMA),
  );

  it("folder src/app dan src/components berisi berkas", () => {
    expect(berkas.length).toBeGreaterThan(0);
  });

  it.each(berkas.map((jalur) => [jalur.slice(AKAR.length)]))(
    "%s tidak menulis warna heksa",
    (jalur) => {
      const isi = readFileSync(`${AKAR}${jalur}`, "utf8");
      expect(isi.match(WARNA_HEKSA) ?? []).toEqual([]);
    },
  );
});
