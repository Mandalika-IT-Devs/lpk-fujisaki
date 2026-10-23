# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Sudah diputuskan di `docs/adr/0001-stack.md`: satu aplikasi Next.js (App Router) dengan TypeScript, PostgreSQL, Tailwind 4, dan shadcn/ui (Radix). Aplikasinya belum dibangun; kodenya ditulis lewat tiket.

## Users

- **Calon peserta**: anak muda usia sekitar 18–30 tahun, kebanyakan lulusan SMA/SMK dari Cilacap dan sekitarnya di Jawa Tengah. Mereka membuka situs lewat HP Android, sering dengan kuota dan sinyal terbatas. Mereka ingin tahu apakah bisa bekerja di Jepang lewat lembaga ini, apa syaratnya, lalu mendaftar dan memantau kemajuannya.
- **Orang tua calon peserta**: ikut membaca dan menimbang sebelum anaknya mendaftar. Mereka butuh rasa aman bahwa lembaga ini resmi dan terbukti.
- **Pegawai lembaga** (Admin dan Staf): mengelola pendaftaran, kelas, perusahaan penerima, dan konten situs setiap hari kerja, di laptop kantor maupun HP.

## Product Purpose

Situs resmi dan sistem pendaftaran LPKS Fujisaki Gakuin Center. Calon peserta membaca program dan mendaftar online lewat akunnya. Pegawai mengikuti setiap pendaftaran melalui enam tahap, dari pendaftaran dan seleksi sampai berangkat ke Jepang.

Berhasil bila calon peserta mendaftar tanpa harus datang atau menelepon lebih dulu, dan bila pegawai tahu posisi setiap orang tanpa membuka catatan manual.

Aturan bisnis lengkap ada di `docs/PRD.md`, dan istilahnya di `GLOSSARY.md`.

## Positioning

Lembaga ini melatih **dan** mengirim sendiri, karena juga berstatus P3MI resmi. Akibatnya, satu alur enam tahap yang sama bisa ditunjukkan apa adanya kepada calon peserta, dari hari mendaftar sampai hari berangkat, dan setiap orang bisa melihat sendiri posisinya di alur itu. Rekam jejaknya nyata: 1.214 alumni di Jepang sejak 2019, dan penutur asli bahasa Jepang rutin datang ke kelas.

## Operating Context

- Calon peserta dan orang tua membaca di HP, sering di luar rumah atau dengan sinyal lemah. Bahasa yang dipakai sehari-hari adalah Bahasa Indonesia, dengan istilah Jepang seperlunya (N5–N2, tokutei ginou, kaigo).
- Staf bekerja di kantor lembaga di Kesugihan, Cilacap. Mereka mencatat hasil pemeriksaan fisik, tes, wawancara, dan dokumen perjalanan yang terjadi di dunia nyata.
- Berkas fisik diserahkan langsung di kantor; sistem tidak menyimpannya.

## Capabilities and Constraints

- Situs publik berbahasa Indonesia: Beranda, Tentang Kami, Program, Alur Program, Galeri, Kontak, Kebijakan Privasi, Daftar/Masuk.
- Akun calon peserta dengan email dan verifikasi; formulir pendaftaran dengan draf; nomor pendaftaran `FGC-TTTT-NNNN`.
- Enam tahap tetap dengan langkah berstatus Belum, Selesai, atau Tidak berlaku. Pendaftaran berstatus Berjalan, Ditutup, atau Selesai.
- Panel pegawai: daftar dengan saringan, halaman pendaftaran, percobaan ujian/tes/wawancara, catatan, riwayat perubahan, ekspor CSV.
- Tidak ada: pembayaran, kelas daring, notifikasi WhatsApp otomatis, versi bahasa Jepang (direncanakan nanti), unggah dokumen.
- Data pribadi seperlunya sesuai UU PDP: tanpa NIK, nomor paspor, atau pindaian dokumen.
- Belum diputuskan: teks Kebijakan Privasi, kontak lengkap, teks Tentang Kami, logo dan foto yang boleh dipakai (lihat `docs/OPEN-DECISIONS.md`).

## Brand Commitments

- Nama: LPKS Fujisaki Gakuin Center (藤崎学院センター), di bawah PT Fujisaki Global Inspirasi. Slogan pada logo: "Global Inspirasi".
- Logo wajib dipakai apa adanya: matahari oranye di dalam lengkung ungu-biru dengan gerbang torii, dan tulisan "Fujisaki" berwarna oranye. Berkas logonya belum diserahkan (OD-06).
- Palet situs boleh dikembangkan selama serasi dengan logo. Profil lembaga memakai biru tua, biru, dan putih.

## Evidence on Hand

- `docs/input/profil-perusahaan.md`: ringkasan profil lembaga, berisi angka siswa per level dan per bidang kerja, jumlah alumni, dan alur enam tahap.
- Angka yang boleh ditonjolkan: 1.214 alumni di Jepang; sekitar 100 siswa per tahun sejak 2019; 210 siswa aktif (data dari profil Agustus 2025).
- Belum ada foto yang boleh dipublikasikan, testimoni alumni, nama perusahaan penerima, maupun logo mitra. Semua itu tidak boleh dikarang.

## Product Principles

1. **Tunjukkan alurnya, jangan hanya menjanjikannya.** Enam tahap yang sama terlihat di situs publik, di akun siswa, dan di panel pegawai.
2. **Yakinkan dua pembaca sekaligus.** Setiap halaman publik harus bisa dipahami anak muda dan dipercaya orang tuanya.
3. **Ringan di HP murah.** Halaman publik harus cepat terbuka di HP Android dengan sinyal lemah.
4. **Data pribadi seperlunya.** Tidak meminta atau menampilkan data yang tidak dibutuhkan.
5. **Kerja harian staf lebih penting daripada hiasan.** Di panel pegawai, kecepatan membaca dan mencatat mengalahkan ekspresi visual.

## Accessibility & Inclusion

- Teks harus terbaca nyaman di layar HP kecil di bawah sinar matahari: kontras minimal WCAG 2.2 AA.
- Target sentuh yang besar, karena banyak pengguna tidak terbiasa dengan formulir online.
- Kalimat pendek dan istilah sehari-hari. Istilah Jepang selalu disertai penjelasan Bahasa Indonesia.
