// Rute halaman situs publik (PRD §3.1). Halaman yang belum dibangun dibuat oleh tiketnya masing-masing.
// Urutan menu mengikuti docs/design/prototipe/beranda.html.

/** Menu utama di bar atas: menu layar lebar dan menu HP memakai daftar yang sama. */
export const MENU_UTAMA = [
  { href: "/alur-program", nama: "Alur Program" },
  { href: "/program", nama: "Program" },
  { href: "/galeri", nama: "Galeri" },
  { href: "/tentang-kami", nama: "Tentang Kami" },
  { href: "/kontak", nama: "Kontak" },
];

export const MENU_KAKI = [
  { href: "/tentang-kami", nama: "Tentang Kami" },
  { href: "/program", nama: "Program" },
  { href: "/alur-program", nama: "Alur Program" },
  { href: "/galeri", nama: "Galeri" },
  { href: "/kontak", nama: "Kontak" },
  { href: "/kebijakan-privasi", nama: "Kebijakan Privasi" },
];

export const ALAMAT_MASUK = "/masuk";
