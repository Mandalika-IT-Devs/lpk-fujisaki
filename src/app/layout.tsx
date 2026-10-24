import type { Metadata } from "next";
import { Barlow, Barlow_Semi_Condensed } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Huruf di-host sendiri: next/font mengunduhnya saat build dan menyajikannya dari domain situs ini.
const barlow = Barlow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow",
});

const barlowSemiCondensed = Barlow_Semi_Condensed({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow-semi-condensed",
});

// Zen Kaku Gothic New 700, hanya glyph kata Jepang yang dipakai situs: 日本藤崎学院センター.
// Berkasnya subset dari Google Fonts (lisensi SIL OFL), dibuat dengan parameter `text=` berisi glyph di atas.
// Bila ada kata Jepang baru, buat ulang berkas ini dengan glyph tambahannya.
const zenKakuGothicNew = localFont({
  src: "./_huruf/zen-kaku-gothic-new-700-jp.woff2",
  weight: "700",
  variable: "--font-zen-kaku-gothic-new",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: {
    default: "LPKS Fujisaki Gakuin Center",
    template: "%s – LPKS Fujisaki Gakuin Center",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${barlow.variable} ${barlowSemiCondensed.variable} ${zenKakuGothicNew.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
