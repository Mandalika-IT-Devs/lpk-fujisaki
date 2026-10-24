# Skenario UAT LPKS Fujisaki Gakuin Center

<!-- Buat satu bagian untuk setiap bagian PRD. Setiap skenario memuat:
- ID, misalnya UAT-A1;
- langkah-langkahnya;
- hasil yang diharapkan;
- rujukan ke PRD §.
Disusun lewat /tiket:rencanakan-produk dan dijalankan pemilik di akhir tahap. Data uji memakai nilai bertanda [CONTOH]. -->

## Persiapan bersama

- Satu akun **Admin** dan satu akun **Staf** [CONTOH].
- Program "Tokutei Ginou (SSW)" aktif dengan rentang usia 18–30 [CONTOH], dan program "Pelajar" aktif.
- Bidang kerja: Pembersihan gedung, Perawat lansia (kaigo), Pengolahan makanan dan minuman, Restoran.
- Ambang kelulusan psikotes dan tes matematika: 60 [CONTOH].
- Satu kelas "Kelas N4-A [CONTOH]", level N4, pengajar "Tanaka [CONTOH]".
- Satu perusahaan penerima "Sakura Clean K.K. [CONTOH]", Osaka, Pembersihan gedung.
- Satu lembaga pendamping "Hikari Support [CONTOH]", jenis Lembaga pendukung SSW.
- Kotak masuk email uji untuk menerima email verifikasi dan atur ulang kata sandi.
- Uji di HP (lebar layar sekitar 375 px) dan di laptop.

Skenario M1 cukup dengan data di atas. Skenario M2 dan M3 memakai pendaftaran yang dibuat di UAT-F1.

## A. Tujuan dan batas (§1)

**UAT-A1 – Hal di luar batas tidak ada** (§1.3)
1. Buka semua halaman situs publik, akun calon peserta, dan panel pegawai.
2. Cari pembayaran, kelas daring, berita, pilihan bahasa, dan unggah dokumen.

Hasil: tidak ada satu pun di antaranya.

## B. Pengguna dan peran (§2)

**UAT-B1 – Staf tidak bisa membuka menu Admin** (§2.2)
1. Masuk sebagai Staf.
2. Buka halaman akun pegawai, program, bidang kerja, statistik lembaga, dan kontak, termasuk lewat alamat langsung di browser.

Hasil: menu-menu itu tidak tampil, dan alamat langsung ditolak.

**UAT-B2 – Pemilik akun tidak bisa membuka panel pegawai** (§2.2)
1. Masuk sebagai calon peserta.
2. Buka alamat panel pegawai.

Hasil: ditolak.

**UAT-B3 – Pemilik akun hanya melihat data yang boleh dilihat** (§2.3)
1. Pakai pendaftaran yang sudah punya hasil pemeriksaan fisik, percobaan tes internal, percobaan ujian resmi, satu catatan untuk siswa, dan satu catatan internal.
2. Masuk sebagai pemiliknya.

Hasil: ia melihat isian formulirnya, nomor pendaftaran, status, tahap dan langkah, percobaan ujian resmi, dan catatan untuk siswa. Ia tidak melihat pemeriksaan fisik, tes internal, catatan internal, dan riwayat perubahan.

## C. Situs publik (§3)

**UAT-C1 – Halaman publik di HP** (§3.1, §3.2)
1. Buka Beranda, Tentang Kami, Program, rincian satu program, Alur Program, Galeri, Kontak, dan Kebijakan Privasi di HP.

Hasil: semua halaman berbahasa Indonesia, terbaca tanpa menggeser ke samping, dan Alur Program menampilkan enam tahap.

**UAT-C2 – Statistik lembaga tersimpan dan tampil** (§3.3)
1. Sebagai Admin, isi N5 65, N4 124, N3 21, N2 0; bidang kerja 88, 68, 30, 24; alumni 1.214; data per 28-08-2025.
2. Simpan, lalu buka Beranda.

Hasil: tersimpan. Beranda menampilkan total siswa **210**, angka per level, angka per bidang kerja, alumni 1.214, dan tanggal data per.

**UAT-C3 – Statistik yang tidak cocok ditolak** (§3.3)
1. Ubah bidang kerja terakhir menjadi 23, lalu simpan.

Hasil: ditolak dengan pesan yang menyebut 209 dan 210. Beranda tidak berubah.

**UAT-C4 – Syarat unggah foto galeri** (§3.4)
1. Unggah JPG di bawah 5 MB dengan centang persetujuan.
2. Unggah PNG di atas 5 MB.
3. Unggah GIF.
4. Unggah JPG tanpa centang persetujuan.

Hasil: hanya nomor 1 yang diterima dan tampil di Galeri. Nomor 2–4 ditolak dengan alasan masing-masing.

**UAT-C5 – Tombol WhatsApp** (§3.5)
1. Sebagai Admin, isi nomor WhatsApp kantor.
2. Buka halaman Kontak di HP dan tekan "Chat WhatsApp".

Hasil: WhatsApp terbuka dengan nomor kantor.

## D. Program dan bidang kerja (§4)

**UAT-D1 – Program nonaktif** (§4.3)
1. Kirim pendaftaran untuk program "Pelajar".
2. Sebagai Admin, nonaktifkan program "Pelajar".
3. Buka halaman Program dan formulir pendaftaran dengan akun lain.
4. Buka pendaftaran dari langkah 1 di panel pegawai.

Hasil: "Pelajar" tidak tampil di halaman Program dan tidak bisa dipilih di formulir. Pendaftaran dari langkah 1 tetap Berjalan dengan program "Pelajar".

**UAT-D2 – Bidang kerja nonaktif** (§4.3)
1. Nonaktifkan "Restoran", lalu buka formulir pendaftaran.

Hasil: "Restoran" tidak bisa dipilih, sedangkan "Belum tahu" tetap ada.

## E. Akun (§5)

**UAT-E1 – Membuat akun dan verifikasi email** (§5.1, §5.3)
1. Buat akun dengan nama, email, nomor `0812-3456-7890`, kata sandi 8 karakter, dan centang persetujuan.
2. Buka tautan verifikasi dari email.

Hasil: akun dibuat, email verifikasi diterima, dan setelah tautan dibuka, email berstatus terverifikasi.

**UAT-E2 – Email dan nomor ganda ditolak** (§5.1, §5.2)
1. Buat akun kedua dengan email yang sama tetapi huruf besar.
2. Buat akun kedua dengan email lain dan nomor `+62 812 3456 7890`.

Hasil: keduanya ditolak, karena email dan nomornya sudah dipakai.

**UAT-E3 – Isian akun yang tidak sah** (§5.1, §5.2)
1. Coba kata sandi 7 karakter.
2. Coba nomor `081234567`.
3. Coba tanpa centang persetujuan.

Hasil: ketiganya ditolak dengan pesan yang jelas.

**UAT-E4 – Lupa kata sandi** (§5.4)
1. Minta atur ulang kata sandi, buka tautannya, lalu atur kata sandi baru.
2. Masuk dengan kata sandi baru.

Hasil: berhasil. Kata sandi lama tidak berlaku lagi.

**UAT-E5 – Akun pegawai** (§5.5)
1. Sebagai Admin, buat akun Staf baru, lalu atur kata sandinya lewat email.
2. Nonaktifkan Staf itu dan coba masuk dengan akunnya.
3. Coba menonaktifkan atau menurunkan Admin terakhir.

Hasil: Staf baru bisa masuk sebelum dinonaktifkan dan ditolak sesudahnya. Langkah 3 ditolak.

## F. Formulir pendaftaran dan pendaftaran (§6)

**UAT-F1 – Draf lalu kirim** (§6.1, §6.2, §6.4, §6.5)
1. Dengan akun dari UAT-E1, isi sebagian formulir dan simpan sebagai draf. Keluar, lalu masuk lagi.
2. Lengkapi formulir dengan program SSW dan tanggal lahir yang memenuhi rentang usia, lalu kirim.

Hasil: draf tersimpan. Setelah dikirim, tampil halaman konfirmasi dengan nomor pendaftaran berformat `FGC-<tahun>-<urutan 4 digit>` dan tombol "Chat WhatsApp". Isian formulir tidak bisa diubah lagi oleh calon peserta.

**UAT-F2 – Belum verifikasi email** (§6.2)
1. Buat akun baru tanpa membuka tautan verifikasi.
2. Lengkapi formulir dan kirim.

Hasil: draf bisa disimpan, tetapi pengiriman ditolak dengan ajakan memverifikasi email.

**UAT-F3 – Usia di luar rentang** (§6.3)
1. Isi tanggal lahir yang membuat usia 17 tahun pada hari ini, lalu kirim untuk program 18–30.
2. Ulangi dengan usia tepat 18 tahun hari ini.

Hasil: nomor 1 ditolak dengan pesan berisi usia 17 dan rentang 18–30. Nomor 2 diterima.

**UAT-F4 – Satu pendaftaran berjalan** (§6.6)
1. Dengan akun dari UAT-F1, coba kirim formulir pendaftaran baru.

Hasil: ditolak, karena masih ada pendaftaran Berjalan.

**UAT-F5 – Pendaftaran ulang** (§6.6, §7.5)
1. Sebagai Staf, tutup pendaftaran sebuah akun dengan alasan Mundur.
2. Masuk sebagai pemilik akun itu dan kirim formulir pendaftaran baru.

Hasil: diterima dengan nomor pendaftaran baru, mulai dari tahap 1. Pendaftaran lama tetap terlihat di panel pegawai dengan status Ditutup.

**UAT-F6 – Pegawai mengubah isian** (§6.5)
1. Sebagai Staf, ubah kabupaten/kota pada sebuah pendaftaran.

Hasil: perubahan tersimpan dan terlihat oleh pemilik akun.

## G. Tahap dan langkah (§7)

**UAT-G1 – Pindah tahap ditolak** (§7.3)
1. Pada pendaftaran di tahap 1, tandai L1.1–L1.4 Selesai dan biarkan L1.5 Belum.
2. Pindahkan ke tahap 2.

Hasil: ditolak dengan pesan yang menyebut L1.5.

**UAT-G2 – Tidak berlaku, lalu pindah tahap** (§7.2, §7.3)
1. Tandai L1.5 Tidak berlaku, lalu pindahkan ke tahap 2.

Hasil: berhasil. Pemilik akun kini disebut siswa, dan langkah tahap 1 tidak bisa diubah lagi (OD-12, nilai contoh).

**UAT-G3 – Tanggal di masa depan** (§7.2)
1. Tandai sebuah langkah biasa Selesai dengan tanggal besok.

Hasil: ditolak.

**UAT-G4 – Penutupan** (§7.5)
1. Tutup pendaftaran di tahap 2 dengan alasan Tidak lolos seleksi.
2. Tutup dengan alasan Dikeluarkan tanpa keterangan.
3. Tutup dengan alasan Dikeluarkan dan keterangan.

Hasil: nomor 1 ditolak, karena alasan itu hanya untuk tahap 1. Nomor 2 ditolak, karena keterangan wajib. Nomor 3 berhasil, statusnya Ditutup, dan tidak ada cara membukanya kembali.

## H. Tahap 1: pendaftaran dan seleksi (§8)

**UAT-H1 – Pemeriksaan fisik** (§8.2)
1. Catat tinggi 165 cm, berat 58 kg, tanpa tato, tanpa tindik, keputusan tidak memenuhi.
2. Ubah keputusan menjadi memenuhi.

Hasil: setelah langkah 1, L1.2 masih Belum. Setelah langkah 2, L1.2 Selesai.

**UAT-H2 – Tes internal** (§7.4, §8.3)
1. Catat percobaan psikotes dengan nilai 59.
2. Catat percobaan kedua dengan nilai 60.
3. Coba menambah percobaan ketiga.

Hasil: percobaan 1 tidak lulus dan L1.3 tetap Belum. Percobaan 2 lulus dan L1.3 Selesai dengan tanggal percobaan 2. Percobaan ketiga tidak bisa ditambahkan.

**UAT-H3 – Nilai tidak sah** (§8.3)
1. Coba nilai 101 dan nilai 60,5.

Hasil: keduanya ditolak.

## I. Tahap 2–3: belajar (§9)

**UAT-I1 – Kelas dan level** (§9.1)
1. Masukkan siswa di tahap 2 ke "Kelas N4-A [CONTOH]".
2. Pindahkan ke kelas lain dengan level N3.

Hasil: level siswa N4 setelah langkah 1 dan N3 setelah langkah 2. Saringan kelas di daftar pendaftaran menemukan siswa itu di kelas barunya.

**UAT-I2 – Ujian resmi** (§9.3)
1. Catat percobaan JFT-Basic tidak lulus, lalu percobaan JFT-Basic lulus.
2. Masuk sebagai pemilik akun.

Hasil: L2.4 Selesai setelah percobaan kedua. Pemilik akun melihat kedua percobaan beserta hasilnya.

## J. Tahap 4–6: job matching sampai berangkat (§10)

**UAT-J1 – Wawancara** (§10.3)
1. Catat wawancara lembaga pendamping "Hikari Support [CONTOH]" lulus.
2. Catat wawancara perusahaan penerima tidak lulus dengan perusahaan lain, lalu lulus dengan "Sakura Clean K.K. [CONTOH]".

Hasil: L4.1 dan L4.2 Selesai, dan perusahaan penerima pendaftaran itu adalah "Sakura Clean K.K. [CONTOH]".

**UAT-J2 – Dokumen perjalanan tanpa nomor** (§10.4)
1. Isi tanggal L4.4 dan L4.5, lalu periksa isian yang tersedia.

Hasil: kedua langkah Selesai. Tidak ada isian nomor paspor maupun unggahan dokumen.

**UAT-J3 – Magang kerja** (§10.5)
1. Isi nama perusahaan Indonesia, tanggal mulai 01-03-2027, dan tanggal selesai 28-02-2027.
2. Perbaiki tanggal selesai menjadi 31-03-2027.

Hasil: nomor 1 ditolak. Nomor 2 diterima, dan L5.1 Selesai.

**UAT-J4 – Berangkat menjadi alumni** (§7.6, §10.6)
1. Selesaikan L6.1–L6.3, lalu isi tanggal berangkat di L6.4.
2. Coba menutup pendaftaran itu.

Hasil: status pendaftaran Selesai dan pemiliknya tercatat sebagai alumni, beserta perusahaan penerima dan kotanya. Penutupan tidak tersedia.

## K. Panel pegawai (§11)

**UAT-K1 – Saringan dan pencarian** (§11.1)
1. Saring menurut tahap 1, lalu menurut status Ditutup, lalu menurut program SSW.
2. Cari menurut sebagian nama, lalu menurut nomor pendaftaran.

Hasil: setiap saringan dan pencarian hanya menampilkan pendaftaran yang cocok, terbaru di atas.

**UAT-K2 – Dua jenis catatan** (§11.3)
1. Tulis satu catatan untuk siswa dan satu catatan internal.
2. Masuk sebagai pemilik akun.

Hasil: pemilik akun hanya melihat catatan untuk siswa. Kedua catatan tidak bisa diubah atau dihapus.

**UAT-K3 – Riwayat perubahan** (§11.4)
1. Buka riwayat perubahan pendaftaran dari skenario G dan H.

Hasil: setiap pindah tahap, perubahan status langkah, percobaan, dan penutupan tercatat dengan nama pegawai dan waktunya. Tidak ada tombol ubah atau hapus.

**UAT-K4 – Ekspor** (§11.5)
1. Saring menurut tahap 1, lalu unduh ekspor dan buka di Excel.

Hasil: berkas terbuka rapi di Excel, hanya memuat pendaftaran hasil saringan, dan tidak memuat hasil pemeriksaan fisik maupun catatan internal.

## L. Data pribadi (§12)

**UAT-L1 – Tidak ada isian data terlarang** (§12.2)
1. Periksa formulir pendaftaran dan semua isian di panel pegawai.

Hasil: tidak ada isian NIK, nomor paspor, nomor COE, nomor visa, atau unggahan dokumen.

**UAT-L2 – Penghapusan otomatis** (§12.4)
1. Siapkan tiga akun uji yang aktivitas terakhirnya diatur lebih dari 12 bulan lalu: satu ditutup karena Mundur, satu tidak pernah mengirim formulir, dan satu masih Berjalan.
2. Jalankan penghapusan harian.

Hasil: dua akun pertama terhapus beserta pendaftarannya. Akun yang masih Berjalan tetap ada.

**UAT-L3 – Penghapusan oleh Admin** (§12.5)
1. Sebagai Staf, cari tombol hapus permanen.
2. Sebagai Admin, hapus seseorang dan ketik email akunnya sebagai konfirmasi.

Hasil: Staf tidak punya tombol itu. Setelah dihapus Admin, akun itu tidak bisa masuk dan pendaftarannya hilang dari daftar.

**UAT-L4 – Cadangan data harian** (§12.7)
1. Di server, lihat daftar cadangan database sesuai `docs/DEPLOY.md`.
2. Pulihkan cadangan terbaru ke database kosong mengikuti `docs/DEPLOY.md`.

Hasil: ada satu cadangan untuk setiap hari, yang tertua berumur paling lama 14 hari, dan pemulihan berhasil.
