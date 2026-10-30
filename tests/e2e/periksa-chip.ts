import { expect, type Locator } from "@playwright/test";

// Chip status pendaftaran (docs/DESIGN.md, Chips; keputusan pemilik 2026-10-30). Nilai yang diharapkan diambil dari
// token di frontmatter docs/DESIGN.md, ditulis sebagai warna CSS terhitung.
const JALUR = "rgb(43, 85, 196)"; // jalur #2B55C4
const TEKS_2 = "rgb(61, 74, 122)"; // teks-2 #3D4A7A
const DASAR = "rgb(255, 255, 255)"; // dasar #FFFFFF

type StatusPendaftaran = "Berjalan" | "Ditutup" | "Selesai";

/** Sama untuk ketiga chip: pil 999px, padding 6px 10px, Label 14px 700. */
const UMUM = { sudut: "999px", padding: "6px 10px", huruf: "700 14px" };

/** `garis` null berarti pil penuh tanpa garis yang terlihat; `titik` null berarti tanpa titik. */
const CHIP: Record<
  StatusPendaftaran,
  {
    latar: string;
    warnaTeks: string;
    garis: string | null;
    titik: string | null;
  }
> = {
  Berjalan: {
    latar: DASAR,
    warnaTeks: JALUR,
    garis: `2px solid ${JALUR}`,
    titik: `8px ${JALUR} 50%`,
  },
  Selesai: { latar: JALUR, warnaTeks: DASAR, garis: null, titik: null },
  Ditutup: {
    latar: DASAR,
    warnaTeks: TEKS_2,
    garis: `2px solid ${TEKS_2}`,
    titik: null,
  },
};

/**
 * Memeriksa bahwa `wadah` menampilkan status pendaftaran `status` sebagai chip menurut docs/DESIGN.md, bukan sebagai
 * teks biasa: isi (bergaris atau penuh), titik, warna, bentuk pil, dan teks statusnya.
 */
export async function periksaChip(wadah: Locator, status: StatusPendaftaran) {
  const chip = wadah.getByText(status, { exact: true });
  await expect(chip).toBeVisible();
  const gaya = await chip.evaluate((el) => {
    const isi = getComputedStyle(el);
    const titik = getComputedStyle(el, "::before");
    const garisTerlihat =
      isi.borderTopWidth !== "0px" &&
      isi.borderTopColor !== isi.backgroundColor;
    return {
      latar: isi.backgroundColor,
      warnaTeks: isi.color,
      garis: garisTerlihat
        ? `${isi.borderTopWidth} ${isi.borderTopStyle} ${isi.borderTopColor}`
        : null,
      titik:
        titik.content === "none"
          ? null
          : `${titik.width} ${titik.backgroundColor} ${titik.borderTopLeftRadius}`,
      sudut: isi.borderTopLeftRadius,
      padding: `${isi.paddingTop} ${isi.paddingLeft}`,
      huruf: `${isi.fontWeight} ${isi.fontSize}`,
    };
  });
  expect(gaya, `chip ${status}`).toEqual({ ...UMUM, ...CHIP[status] });
}
