---
version: 1
slug: "docs-design-prototipe-beranda-html"
primary_target: "docs/design/prototipe/beranda.html"
related_targets: []
---

# Beranda (prototipe statis)

## Lingkup

- Halaman: Beranda situs publik, dibuat sebagai prototipe statis `docs/design/prototipe/beranda.html`. Aplikasi Next.js membangunnya ulang lewat tiket dengan token dari `docs/DESIGN.md`.
- Mode: Persuade.
- Pembaca: calon peserta 18–30 tahun di HP Android dengan sinyal lemah, dan orang tuanya.
- Tugas: paham bahwa lembaga ini mengantar dari Cilacap sampai Jepang lewat enam tahap terbuka, cek apakah usianya memenuhi, lalu mendaftar.
- Aksi utama: konter cek usia (tanggal lahir dan program, mengikuti PRD §6.3) lalu "Daftar sekarang".
- Bukti: 1.214 alumni di Jepang, sekitar 100 siswa per tahun sejak 2019, 210 siswa aktif per level dan per bidang kerja (data per 28-08-2025, PRD §3.3). Belum ada foto, testimoni, atau logo mitra yang boleh dipakai (OD-06).
- Batasan: Bahasa Indonesia; tanpa harga, testimoni, atau nama perusahaan karangan; kontak dan teks Tentang Kami masih contoh (OD-05, OD-07).

## Direction contract

THESIS: Beranda adalah peta jalur kereta Cilacap–Jepang, dengan enam stasiun yang sama persis dengan tahap yang nanti dipantau siswa di akunnya. Halaman ini menolak susunan baku situs LPK: foto kelompok selebar layar, deretan angka besar, lalu kartu program yang seragam.

OWN-WORLD: putih papan stasiun sebagai dasar; garis jalur biru #2B55C4 setebal 10–12 px sebagai struktur halaman; huruf navy #0B1440; oranye matahari #EE5A24 hanya untuk "kamu di sini" dan aksi utama. Huruf Barlow dan Barlow Semi Condensed seperti papan nama stasiun. Kode stasiun FG 01–FG 06 dalam lencana bersudut. Papan nama stasiun dengan pita biru serta penunjuk stasiun sebelumnya dan berikutnya.

STORY: pengunjung melihat bahwa jalurnya jelas dari Cilacap sampai Jepang, percaya karena 1.214 alumni sudah sampai di stasiun terakhir, lalu mengecek usianya dan mendaftar.

FIRST VIEWPORT: di HP 390×844: bar atas berisi logo dan Masuk; papan nama stasiun "Cilacap" FG 01 dengan pita biru dan "berikutnya: Belajar bahasa Jepang"; judul satu kalimat; konter cek usia dengan jawaban langsung dan tombol oranye "Daftar sekarang", semuanya terlihat tanpa menggulir; garis jalur mulai turun di tepi bawah. Di desktop 1440: papan nama stasiun di kiri, konter di kanan, dan garis horizontal dengan enam stasiun melintang di bawahnya. Interaksi khas: titik oranye "kamu di sini" bergerak sepanjang garis mengikuti guliran.

FORM: Peta Jalur Kereta, kandidat 1 dari 7 di daftar saya, dipilih pemilik (kartu pilihan). seed:ad2da23b9ba0347e

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Keputusan yang belum selesai

- Berkas logo resmi (OD-06). Prototipe memakai tulisan "Fujisaki" sebagai pengganti sementara.
- Foto galeri (OD-06). Prototipe menampilkan bingkai kosong berlabel.
