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

/** Halaman masuk pemilik akun (PRD §3.1, §5). Pegawai punya halaman masuknya sendiri di panel pegawai. */
export const ALAMAT_MASUK = "/masuk";

/** Halaman tempat pemilik akun meminta tautan atur ulang kata sandi (PRD §5.4). */
export const ALAMAT_LUPA_KATA_SANDI = "/lupa-kata-sandi";

/** Halaman akun pemilik akun, tujuan sesudah membuat akun dan sesudah masuk (issue T11). */
export const ALAMAT_AKUN = "/akun";

/** Halaman formulir pendaftaran (PRD §6), tujuan ajakan di halaman akun. */
export const ALAMAT_FORMULIR_PENDAFTARAN = "/akun/formulir-pendaftaran";

/** Halaman konfirmasi sesudah formulir pendaftaran dikirim, berisi nomor pendaftaran (PRD §6.5). */
export const ALAMAT_KONFIRMASI_PENDAFTARAN = "/akun/konfirmasi-pendaftaran";

/** Halaman daftar akun calon peserta (PRD §5.1), tujuan tombol utama "Daftar sekarang". */
export const ALAMAT_DAFTAR = "/daftar";
