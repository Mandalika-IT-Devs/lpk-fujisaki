import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Ukuran huruf dan bayangan dari tema (src/app/globals.css). Tanpa daftar ini tailwind-merge mengira,
// misalnya, `text-tombol` adalah warna teks dan membuangnya bila digabung dengan `text-dasar`.
// Daftar ini dicek terhadap berkas tema oleh src/lib/utils.test.ts.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display-lebar",
        "headline-lebar",
        "display",
        "headline-bagian-lebar",
        "display-tiba",
        "headline-alur-lebar",
        "display-tiba-lebar",
        "headline",
        "angka-bukti",
        "merek-kaki",
        "headline-bagian",
        "title-konter-lebar",
        "angka-bukti-lebar",
        "kode-lebar",
        "merek",
        "title",
        "kode",
        "title-konter",
        "nomor",
        "title-kecil",
        "tombol",
        "body-lebar",
        "tombol-kedua",
        "body",
        "body-sedang",
        "body-kecil",
        "keterangan",
        "label",
        "mikro",
      ],
      shadow: ["papan"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
