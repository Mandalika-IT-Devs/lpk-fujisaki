# PRD LPKS Fujisaki Gakuin Center

<!-- Diisi lewat /tiket:rencanakan-produk. Aturan penulisannya:
- Setiap area punya bagian bernomor (§1, §2, §2.1, …), supaya tiket bisa merujuk "PRD §2.1".
- Keputusan pemilik ditulis sebagai blok "▶ Keputusan YYYY-MM-DD: …", tepat di bawah teks yang diubah atau ditegaskannya. Blok ▶ Keputusan mengalahkan teks di atasnya.
- Rumus, angka, dan ambang ditulis lengkap beserta contoh hitungannya. Contoh itu juga dimasukkan ke tests/golden/.
- Hal yang belum diputuskan tidak ditulis sebagai aturan. Catat di docs/OPEN-DECISIONS.md.
- Istilah ditulis persis seperti di GLOSSARY.md. -->

Semua tanggal dan jam dalam dokumen ini memakai WIB (UTC+7), kecuali disebut lain.

## 1. Tujuan dan batas

### 1.1 Masalah

Lembaga melatih sekitar 100 orang per tahun untuk bekerja di Jepang. Saat ini:
- calon peserta tidak punya tempat resmi untuk membaca program dan mendaftar;
- staf mencatat calon peserta dan siswa secara manual;
- perjalanan setiap orang, dari pendaftaran sampai berangkat, tidak terlihat di satu tempat.

Situs www.lpkfujisaki.com yang tercantum di profil lembaga saat ini tidak aktif.

### 1.2 Yang dibangun

1. **Situs publik** berbahasa Indonesia untuk calon peserta (§3, §4).
2. **Akun dan formulir pendaftaran** untuk calon peserta (§5, §6).
3. **Panel pegawai** untuk mengikuti setiap pendaftaran melalui enam tahap sampai berangkat ke Jepang (§7–§11).

Produk ini akan menjadi situs resmi di domain www.lpkfujisaki.com. Domainnya diurus di tiket deploy.

### 1.3 Yang sengaja tidak dibangun

- Versi bahasa Jepang atau Inggris. Versi Jepang untuk halaman profil direncanakan sesudah milestone M3.
- Formulir khusus untuk mitra di Jepang. Mereka memakai info kontak.
- Pembayaran online dan pencatatan biaya atau pembayaran siswa.
- Kelas daring, absensi, dan jadwal kelas.
- Unggah berkas pendaftaran atau dokumen perjalanan.
- Email atau WhatsApp otomatis, kecuali email verifikasi akun dan email atur ulang kata sandi (§5).
- Impor data siswa dan alumni yang sudah ada sebelum sistem ini. Sistem ini hanya untuk pendaftaran baru.
- Akun untuk pengajar.
- Berita atau artikel.
- Pegawai membuat pendaftaran atas nama calon peserta.
- Penghitungan kelulusan ujian resmi oleh sistem.
- Ambang otomatis untuk pemeriksaan fisik.
- Penyimpanan NIK, nomor paspor, dan pindaian dokumen (§12.2).

## 2. Pengguna dan peran

### 2.1 Jenis pengguna

| Pengguna | Siapa |
|---|---|
| Pengunjung | Siapa pun yang membuka situs publik tanpa masuk ke akun |
| Pemilik akun | Calon peserta, siswa, atau alumni yang masuk ke akunnya sendiri |
| Staf | Pegawai dengan peran Staf |
| Admin | Pegawai dengan peran Admin |

Satu orang memakai satu akun sepanjang perjalanannya. Sebutannya berubah mengikuti pendaftarannya: calon peserta selama tahap 1, siswa selama tahap 2–6, dan alumni setelah berangkat.

### 2.2 Hak akses

| Tindakan | Pengunjung | Pemilik akun | Staf | Admin |
|---|---|---|---|---|
| Membuka situs publik | ya | ya | ya | ya |
| Membuat akun calon peserta (§5.1) | ya | – | – | – |
| Menyusun dan mengirim formulir pendaftaran (§6) | – | ya, miliknya | – | – |
| Melihat pendaftarannya sendiri (§2.3) | – | ya | – | – |
| Melihat dan mengelola semua pendaftaran (§7–§11) | – | – | ya | ya |
| Mengubah isian formulir pendaftaran yang sudah dikirim | – | – | ya | ya |
| Mengelola kelas, perusahaan penerima, dan lembaga pendamping | – | – | ya | ya |
| Mengunduh ekspor (§11.5) | – | – | ya | ya |
| Mengelola program, bidang kerja, statistik lembaga, dan kontak | – | – | – | ya |
| Mengelola galeri (§3.4) | – | – | lihat OD-16 | ya |
| Mengelola akun pegawai (§5.5) | – | – | – | ya |
| Menghapus data seseorang secara permanen (§12.5) | – | – | – | ya |

▶ Keputusan 2026-10-24: Galeri hanya dikelola Admin. Staf tidak bisa mengunggah maupun menghapus foto galeri (OD-16).

### 2.3 Yang dilihat pemilik akun

Pemilik akun melihat:
- isian formulir pendaftarannya;
- nomor pendaftaran dan status pendaftarannya;
- tahap saat ini, dan langkah-langkah di tahap itu beserta statusnya;
- percobaan ujian resmi beserta hasilnya;
- catatan untuk siswa.

Pemilik akun tidak melihat:
- nilai dan hasil tes internal;
- hasil pemeriksaan fisik;
- catatan internal;
- riwayat perubahan.

Bila pendaftarannya ditutup, yang ia lihat mengikuti OD-14.

▶ Keputusan 2026-10-24: Bila pendaftarannya ditutup, pemilik akun melihat status Ditutup beserta alasannya (Tidak lolos seleksi, Mundur, atau Dikeluarkan). Keterangan penutupan hanya terlihat oleh pegawai (OD-14).

Permintaan salinan seluruh data pribadi dilayani pegawai di luar sistem (§12.6).

## 3. Situs publik

### 3.1 Halaman

| Halaman | Isi | Sumber isi |
|---|---|---|
| Beranda | Pengenalan lembaga, statistik lembaga, program aktif, ajakan mendaftar | Kode dan data yang dikelola Admin |
| Tentang Kami | Profil lembaga, visi dan misi, pimpinan | Kode (OD-07) |
| Program | Daftar program aktif dan halaman rincian setiap program | Dikelola Admin (§4) |
| Alur Program | Enam tahap dari pendaftaran sampai berangkat (§7.1) | Kode |
| Galeri | Foto kegiatan, terbaru di atas | Dikelola Admin (§3.4) |
| Kontak | Alamat, peta, nomor WhatsApp, email | Dikelola Admin (§3.5) |
| Kebijakan Privasi | Cara lembaga memproses data pribadi | Kode (OD-04) |
| Daftar dan Masuk | Membuat akun dan masuk ke akun | §5 |

Teks yang bersumber dari kode diubah lewat tiket. Semua halaman dirancang untuk layar HP terlebih dulu.

### 3.2 Bahasa

Semua halaman memakai Bahasa Indonesia.

### 3.3 Statistik lembaga

Admin mengisi statistik lembaga secara manual. Angka ini tidak dihitung dari data sistem, karena siswa dan alumni yang ada sebelum sistem ini tidak dimasukkan (ADR-0005).

Isiannya:
- **data per**: tanggal datanya;
- **jumlah siswa per level**: N5, N4, N3, dan N2;
- **jumlah siswa per bidang kerja**: satu angka untuk setiap bidang kerja aktif;
- **jumlah alumni di Jepang**.

Semua angka adalah bilangan bulat 0 atau lebih.

**Total siswa** = jumlah siswa N5 + N4 + N3 + N2. Total ini dihitung sistem, bukan diisi.

Sistem menolak penyimpanan bila jumlah siswa per bidang kerja tidak sama dengan total siswa, karena keduanya menghitung siswa yang sama.

Contoh:
- N5 65, N4 124, N3 21, N2 0 → total siswa = 65 + 124 + 21 + 0 = **210**.
- Bidang kerja 88 + 68 + 30 + 24 = 210 → sama dengan total, jadi **disimpan**.
- Bidang kerja 88 + 68 + 30 + 23 = 209 → tidak sama dengan 210, jadi **ditolak**, dengan pesan yang menyebut kedua angka.

Beranda menampilkan total siswa, jumlah per level, jumlah per bidang kerja, jumlah alumni di Jepang, dan tanggal "data per".

### 3.4 Galeri

Setiap foto galeri punya judul, tanggal kegiatan, dan berkas foto.

Syarat unggah:
- format JPG, PNG, atau WebP;
- ukuran paling besar 5 MB, yaitu 5 × 1.048.576 = 5.242.880 byte;
- centang wajib "Orang di foto sudah setuju fotonya dipublikasikan".

Sistem mengecilkan ukuran foto secara otomatis sebelum menampilkannya.

Contoh:
- JPG 5.242.880 byte, centang terisi → **diterima**.
- PNG 5.242.881 byte → **ditolak**, karena terlalu besar.
- GIF 100.000 byte → **ditolak**, karena formatnya tidak didukung.
- WebP 1.000.000 byte, centang kosong → **ditolak**, karena belum ada persetujuan.

Foto bisa dihapus dari galeri. Siapa yang boleh mengelola galeri mengikuti OD-16.

### 3.5 Kontak

Admin mengelola alamat, nomor WhatsApp kantor, email kantor, dan lokasi peta. Isinya mengikuti OD-05.

Tombol "Chat WhatsApp" membuka percakapan dengan nomor kantor lewat tautan `https://wa.me/<nomor>`. Tombol ini ada di halaman Kontak dan di halaman konfirmasi pendaftaran (§6.5).

## 4. Program dan bidang kerja

### 4.1 Program

Admin mengelola program. Setiap program punya:
- nama;
- deskripsi;
- syarat (teks bebas);
- lama pelatihan (teks bebas, misalnya "6–8 bulan");
- usia minimal dan usia maksimal, dalam tahun (§6.3);
- status aktif atau nonaktif.

Isi awalnya empat program: Tokutei Ginou (SSW), Pemagangan, Gijinkoku, dan Pelajar. Deskripsi, syarat, lama pelatihan, dan batas usianya mengikuti OD-01 dan OD-08.

▶ Keputusan 2026-10-24: Batas usia awal keempat program adalah 18–30 tahun. Admin bisa mengubahnya per program (OD-01).

### 4.2 Bidang kerja

Admin mengelola bidang kerja. Setiap bidang kerja punya nama dan status aktif atau nonaktif.

Isi awalnya empat bidang kerja: Pembersihan gedung, Perawat lansia (kaigo), Pengolahan makanan dan minuman, dan Restoran.

"Belum tahu" adalah pilihan di formulir pendaftaran, bukan sebuah bidang kerja.

### 4.3 Menonaktifkan

Program dan bidang kerja tidak pernah dihapus, hanya dinonaktifkan. Yang nonaktif:
- tidak tampil di situs publik;
- tidak bisa dipilih di formulir pendaftaran;
- tetap tercatat pada pendaftaran yang sudah memakainya. Pendaftaran yang sedang berjalan di program itu tetap lanjut seperti biasa.

Admin bisa mengaktifkannya kembali.

## 5. Akun

### 5.1 Membuat akun calon peserta

Isian:
- nama lengkap;
- email;
- nomor WhatsApp (§5.2);
- kata sandi, minimal 8 karakter;
- centang wajib persetujuan pemrosesan data, dengan tautan ke halaman Kebijakan Privasi (§12.1).

Aturan:
- Satu email hanya untuk satu akun, termasuk akun pegawai. Email dibandingkan tanpa membedakan huruf besar dan kecil.
- Satu nomor WhatsApp hanya untuk satu akun, dibandingkan setelah dinormalkan (§5.2).

### 5.2 Nomor WhatsApp

Nomor dinormalkan sebelum disimpan dan dibandingkan:
1. buang spasi, tanda hubung, titik, dan tanda kurung;
2. buang tanda `+` di depan;
3. ganti awalan `0` dengan `62`.

Hasilnya harus diawali `628` dan terdiri dari 11 sampai 14 digit. Bentuk ini sama dengan nomor HP Indonesia 10 sampai 13 digit yang diawali `08`. Nomor yang tidak memenuhi syarat ini ditolak. Penerimaan nomor luar negeri mengikuti OD-09.

▶ Keputusan 2026-10-24: Hanya nomor HP Indonesia yang diterima. Nomor luar negeri ditolak (OD-09).

Contoh:
- `0812-3456-7890` → `6281234567890` → **sah**.
- `+62 812 3456 7890` → `6281234567890` → **sah**, dan dianggap sama dengan contoh sebelumnya.
- `0812345678` → `62812345678` (11 digit) → **sah**.
- `081234567` → `6281234567` (10 digit) → **ditolak**.
- `021-555-1234` → `62215551234` → **ditolak**, karena bukan nomor HP.

### 5.3 Verifikasi email

Setelah membuat akun, sistem mengirim email berisi tautan verifikasi yang berlaku 24 jam. Pemilik akun bisa meminta tautan baru.

Pemilik akun yang belum memverifikasi email tetap bisa masuk dan menyusun draf formulir pendaftaran, tetapi belum bisa mengirimnya (§6.2).

### 5.4 Lupa kata sandi

Pemilik akun dan pegawai bisa meminta tautan atur ulang kata sandi lewat email. Tautan itu berlaku 1 jam.

### 5.5 Akun pegawai

- Admin pertama dibuat saat pemasangan sistem.
- Admin membuat akun pegawai dengan nama, email, dan peran (Admin atau Staf). Pegawai baru menerima email untuk mengatur kata sandinya. Tautan itu berlaku 24 jam.
- Admin bisa mengubah peran dan menonaktifkan pegawai. Pegawai nonaktif tidak bisa masuk. Akunnya tidak dihapus, supaya riwayat perubahan tetap menunjuk orang yang benar.
- Sistem selalu menyisakan minimal satu Admin aktif. Admin terakhir tidak bisa dinonaktifkan atau diturunkan menjadi Staf.

## 6. Formulir pendaftaran dan pendaftaran

### 6.1 Isian formulir pendaftaran

| Isian | Wajib | Pilihan atau bentuk |
|---|---|---|
| Nama lengkap sesuai KTP | ya | teks |
| Jenis kelamin | ya | Laki-laki, Perempuan |
| Tempat lahir | ya | teks |
| Tanggal lahir | ya | tanggal |
| Kabupaten/kota domisili | ya | teks |
| Provinsi domisili | ya | daftar provinsi Indonesia |
| Pendidikan terakhir | ya | SMP, SMA, SMK, D3, S1 (pilihan lain: OD-10) |
| Jurusan pendidikan terakhir | tidak | teks |
| Program | ya | program aktif |
| Bidang kerja yang diminati | ya | bidang kerja aktif, atau "Belum tahu" |
| Kemampuan bahasa Jepang saat ini | ya | Belum pernah belajar, N5, N4, N3, N2 |
| Pengalaman kerja | tidak | teks |
| Nama kontak darurat | ya | teks |
| Hubungan kontak darurat | ya | teks, misalnya "Ibu" |
| Nomor HP kontak darurat | ya | nomor yang memenuhi §5.2 |

▶ Keputusan 2026-10-24: Pilihan pendidikan terakhir adalah SMP, SMA, SMK, Paket C, D1, D2, D3, D4, S1, dan S2 (OD-10).

Kemampuan bahasa Jepang di formulir hanya keterangan awal dari calon peserta. Level siswa ditentukan oleh kelasnya (§9.1).

Formulir tidak menanyakan NIK, tinggi badan, atau berat badan (§12.2).

### 6.2 Draf dan pengiriman

Formulir pendaftaran bisa disimpan sebagai draf kapan saja, meski belum lengkap.

Formulir pendaftaran hanya bisa dikirim bila:
1. email pemilik akun sudah diverifikasi (§5.3);
2. semua isian wajib terisi dan sah;
3. usia memenuhi batas usia program yang dipilih (§6.3);
4. akun itu tidak punya pendaftaran yang sedang berjalan (§6.6).

### 6.3 Batas usia

Usia dihitung dalam tahun penuh, dari tanggal lahir sampai tanggal formulir dikirim (WIB). Usia bertambah tepat pada tanggal ulang tahun. Orang yang lahir 29 Februari dianggap berulang tahun pada 1 Maret di tahun yang bukan kabisat.

Usia memenuhi syarat bila **usia minimal ≤ usia ≤ usia maksimal** program yang dipilih. Kedua batas termasuk.

Bila tidak memenuhi, formulir ditolak dengan pesan yang menyebut usia calon peserta dan rentang usia program.

Contoh untuk program dengan rentang 18–30:
- lahir 24-10-2008, dikirim 23-10-2026 → usia **17** → **ditolak**.
- lahir 23-10-2008, dikirim 23-10-2026 → usia **18** → **memenuhi**.
- lahir 24-10-1995, dikirim 23-10-2026 → usia **30** → **memenuhi**.
- lahir 23-10-1995, dikirim 23-10-2026 → usia **31** → **ditolak**.
- lahir 29-02-2008, dikirim 28-02-2026 → usia **17** → **ditolak**.
- lahir 29-02-2008, dikirim 01-03-2026 → usia **18** → **memenuhi**.
- lahir 23-10-2008, dikirim pada 22-10-2026 pukul 17.30 UTC, yaitu 23-10-2026 pukul 00.30 WIB → usia **18** → **memenuhi**.

Batas usia setiap program mengikuti OD-01.

### 6.4 Nomor pendaftaran

Format: `FGC-TTTT-NNNN`.
- `TTTT` adalah tahun saat formulir dikirim (WIB).
- `NNNN` adalah nomor urut pendaftaran dalam tahun itu, dimulai dari 0001 setiap 1 Januari pukul 00.00 WIB.
- Nomor urut ditulis minimal 4 digit dengan nol di depan. Urutan ke-10.000 dan seterusnya ditulis apa adanya.

Contoh:
- Pendaftaran ke-37 yang dikirim pada 2026 → `FGC-2026-0037`.
- Dikirim 31-12-2026 pukul 23.59.59 WIB sebagai pendaftaran ke-121 tahun itu → `FGC-2026-0121`.
- Dikirim 01-01-2027 pukul 00.30 WIB sebagai pendaftaran pertama tahun itu → `FGC-2027-0001`.
- Pendaftaran ke-10.000 pada 2026 → `FGC-2026-10000`.

Nomor tidak pernah dipakai ulang, juga setelah pendaftarannya ditutup atau dihapus.

### 6.5 Setelah dikirim

- Sistem membuka pendaftaran baru dengan status **Berjalan** di tahap 1. Semua langkah berstatus **Belum**.
- Calon peserta melihat halaman konfirmasi berisi nomor pendaftaran dan tombol "Chat WhatsApp" (§3.5).
- Isian formulir pendaftaran terkunci bagi calon peserta. Perubahan dilakukan pegawai (§2.2), dan setiap perubahan mengikuti OD-18.
- Pegawai melihat pendaftaran baru di daftar pendaftaran (§11.1).

### 6.6 Satu pendaftaran berjalan dan pendaftaran ulang

- Satu akun hanya boleh punya satu pendaftaran berstatus Berjalan.
- Setelah pendaftarannya ditutup (§7.5), pemilik akun boleh mengirim formulir pendaftaran baru. Isian lama boleh dipakai sebagai isian awal.
- Pendaftaran ulang mendapat nomor pendaftaran baru dan mulai dari tahap 1. Pendaftaran lama beserta riwayatnya tetap tersimpan.
- Pendaftaran ulang oleh alumni mengikuti OD-11.

## 7. Tahap dan langkah

### 7.1 Tahap dan langkahnya

Keenam tahap ini berlaku untuk semua program (ADR-0003).

| Tahap | Langkah | Jenis langkah |
|---|---|---|
| 1. Pendaftaran dan seleksi | L1.1 Berkas pendaftaran diterima | biasa |
| | L1.2 Pemeriksaan fisik | pemeriksaan fisik (§8.2) |
| | L1.3 Psikotes | tes internal (§8.3) |
| | L1.4 Tes matematika | tes internal (§8.3) |
| | L1.5 Pra-MCU | biasa |
| 2. Belajar bahasa Jepang | L2.1 Pembelajaran bahasa Jepang | biasa |
| | L2.2 Pengenalan budaya Jepang | biasa |
| | L2.3 Pengenalan kebiasaan organisasi Jepang | biasa |
| | L2.4 Ujian bahasa Jepang | ujian resmi (§9.3) |
| 3. Belajar tokutei ginou | L3.1 Pelatihan teori dan praktik | biasa |
| | L3.2 Pengenalan budaya kerja Jepang | biasa |
| | L3.3 Ujian keterampilan SSW | ujian resmi (§9.3) |
| 4. Job matching | L4.1 Wawancara lembaga pendamping | wawancara (§10.3) |
| | L4.2 Wawancara perusahaan penerima | wawancara (§10.3) |
| | L4.3 MCU | biasa |
| | L4.4 Tanda tangan kontrak kerja | bertanggal (§10.4) |
| | L4.5 Pembuatan paspor | bertanggal (§10.4) |
| 5. Magang kerja | L5.1 Magang kerja di perusahaan Indonesia | magang kerja (§10.5) |
| 6. Persiapan berangkat | L6.1 Review bahasa dan percakapan (1 bulan) | biasa |
| | L6.2 COE terbit | bertanggal (§10.4) |
| | L6.3 Visa terbit | bertanggal (§10.4) |
| | L6.4 Berangkat | bertanggal (§10.6) |

### 7.2 Status langkah

Setiap langkah berstatus **Belum**, **Selesai**, atau **Tidak berlaku**.

- Pegawai menandai langkah sebagai Tidak berlaku untuk pendaftaran tertentu, misalnya L3.3 bagi siswa program Pemagangan.
- Langkah biasa ditandai Selesai oleh pegawai, beserta tanggal selesainya.
- Langkah jenis lain menjadi Selesai menurut aturannya sendiri (§7.4, §8.2, §10.4–§10.6).
- Tanggal yang menandai sebuah langkah selesai tidak boleh setelah hari ini.
- Status langkah hanya bisa diubah selama pendaftaran berada di tahap langkah itu (OD-12).

### 7.3 Pindah tahap

Pegawai memindahkan pendaftaran ke tahap berikutnya, satu tahap setiap kali.

Sistem menolak pindah tahap bila masih ada langkah di tahap saat ini yang berstatus Belum. Pesan penolakannya menyebut langkah-langkah itu.

Contoh:
- Tahap 1, semua langkah Selesai → **boleh** pindah ke tahap 2.
- Tahap 1, L1.5 masih Belum → **ditolak**, dengan penghalang L1.5.
- Tahap 3, L3.1 dan L3.2 Selesai, L3.3 Tidak berlaku → **boleh** pindah ke tahap 4.
- Tahap 6 → tidak ada tahap berikutnya. Pendaftaran selesai lewat L6.4 (§10.6).

Pindah dari tahap 1 ke tahap 2 berarti calon peserta **lolos seleksi** dan sejak itu disebut siswa.

Memundurkan tahap mengikuti OD-12.

### 7.4 Percobaan

Langkah jenis tes internal, ujian resmi, dan wawancara menyimpan semua percobaan. Setiap percobaan punya tanggal, hasil **lulus** atau **tidak lulus**, dan isian tambahan menurut jenisnya (§8.3, §9.3, §10.3).

Aturan:
- Jumlah percobaan tidak dibatasi.
- Langkah menjadi Selesai begitu ada satu percobaan yang lulus. Tanggal selesainya adalah tanggal percobaan itu.
- Setelah langkah Selesai, percobaan baru tidak bisa ditambahkan. Pembatalan hasil lulus wawancara perusahaan penerima mengikuti OD-15.
- Langkah jenis ini tidak bisa ditandai Selesai secara manual, tetapi tetap bisa ditandai Tidak berlaku.

Contoh:
- Belum ada percobaan → **Belum**.
- Satu percobaan tidak lulus → **Belum**.
- Percobaan 1 tidak lulus, percobaan 2 lulus → **Selesai**, oleh percobaan 2.
- Satu percobaan lulus → **Selesai**, oleh percobaan 1.

### 7.5 Penutupan

Pegawai bisa menutup pendaftaran yang berstatus Berjalan di tahap mana pun, dengan:
- alasan: **Tidak lolos seleksi** (hanya di tahap 1), **Mundur**, atau **Dikeluarkan**;
- keterangan wajib berupa teks.

Pendaftaran yang ditutup berstatus **Ditutup**, dan tidak bisa dibuka kembali. Pemiliknya bisa mendaftar ulang (§6.6). Yang dilihat pemilik akun tentang penutupan mengikuti OD-14.

### 7.6 Selesai dan menjadi alumni

Begitu L6.4 Berangkat selesai, pendaftaran berstatus **Selesai** dan pemiliknya menjadi alumni. Pendaftaran yang Selesai tidak bisa ditutup.

Status pendaftaran secara keseluruhan:

| Status | Arti |
|---|---|
| Berjalan | Sedang di salah satu tahap 1–6 |
| Ditutup | Berakhir sebelum berangkat (§7.5) |
| Selesai | Sudah berangkat, pemiliknya menjadi alumni |

## 8. Tahap 1: pendaftaran dan seleksi

### 8.1 Berkas pendaftaran

Berkas pendaftaran diserahkan langsung di kantor. Pegawai menandai L1.1 Selesai setelah menerima berkas lengkap. Sistem tidak menyimpan berkasnya (§12.2).

### 8.2 Pemeriksaan fisik

Pegawai mencatat:
- tinggi badan dalam cm;
- berat badan dalam kg;
- ada tato: ya atau tidak;
- ada tindik: ya atau tidak;
- keputusan: **memenuhi** atau **tidak memenuhi**.

Pegawai menetapkan keputusannya sendiri, dan sistem tidak memakai ambang apa pun. L1.2 menjadi Selesai bila keputusannya memenuhi. Bila tidak memenuhi, L1.2 tetap Belum, dan pegawai bisa menutup pendaftaran dengan alasan Tidak lolos seleksi.

Hasil pemeriksaan fisik hanya terlihat oleh pegawai.

### 8.3 Tes internal

L1.3 Psikotes dan L1.4 Tes matematika adalah tes internal. Setiap percobaan mencatat tanggal dan nilai berupa bilangan bulat 0–100.

Sistem menetapkan hasilnya: **lulus bila nilai ≥ ambang kelulusan** tes itu. Pegawai tidak mengisi hasilnya sendiri.

Admin mengatur ambang kelulusan setiap tes internal. Nilai ambang dan berlakunya perubahan ambang mengikuti OD-02.

Contoh dengan ambang kelulusan 60:
- nilai 59 → **tidak lulus**;
- nilai 60 → **lulus**;
- nilai 100 → **lulus**;
- nilai 0 → **tidak lulus**.

Contoh dengan ambang kelulusan 80: nilai 75 → **tidak lulus**.

Nilai di luar 0–100 atau bukan bilangan bulat ditolak. Nilai dan hasil tes internal hanya terlihat oleh pegawai.

### 8.4 Pra-MCU

L1.5 Pra-MCU adalah langkah biasa. Bila hasilnya tidak layak, pegawai bisa menutup pendaftaran dengan alasan Tidak lolos seleksi.

## 9. Tahap 2–3: belajar

### 9.1 Kelas dan level

Pegawai mengelola kelas. Setiap kelas punya nama, level (N5, N4, N3, atau N2), nama pengajar, dan status aktif atau nonaktif. Pengajar tidak punya akun.

- Pegawai memasukkan siswa di tahap 2–3 ke satu kelas, dan bisa memindahkannya ke kelas lain kapan saja selama siswa itu di tahap 2–3.
- **Level siswa = level kelasnya saat ini.** Siswa yang belum pernah masuk kelas tidak punya level.
- Siswa tetap tercatat di kelas terakhirnya setelah meninggalkan tahap 3.

### 9.2 Langkah tahap 2 dan 3

L2.1–L2.3 dan L3.1–L3.2 adalah langkah biasa. L2.4 dan L3.3 adalah ujian resmi.

### 9.3 Ujian resmi

Setiap percobaan ujian resmi mencatat:
- jenis ujian: JFT-Basic, JLPT N5, JLPT N4, JLPT N3, JLPT N2, JLPT N1, atau Ujian keterampilan SSW;
- untuk Ujian keterampilan SSW: bidang kerjanya;
- tanggal ujian;
- nilai sesuai sertifikat (boleh kosong);
- hasil **lulus** atau **tidak lulus** sesuai sertifikat, yang diisi pegawai.

Sistem tidak menghitung kelulusan ujian resmi.

- L2.4 Ujian bahasa Jepang menjadi Selesai menurut §7.4, dengan percobaan lulus dari jenis ujian yang ditetapkan OD-13.
- L3.3 Ujian keterampilan SSW menjadi Selesai menurut §7.4, dengan percobaan lulus Ujian keterampilan SSW.

Percobaan ujian resmi terlihat oleh pemilik akun.

## 10. Tahap 4–6: job matching sampai berangkat

### 10.1 Perusahaan penerima

Pegawai mengelola perusahaan penerima. Setiap perusahaan penerima punya nama, kota atau prefektur di Jepang, bidang kerja, dan status aktif atau nonaktif.

### 10.2 Lembaga pendamping

Pegawai mengelola lembaga pendamping. Setiap lembaga pendamping punya nama, jenis (**Lembaga pendukung SSW** atau **Kumiai**), dan status aktif atau nonaktif.

### 10.3 Wawancara

- Setiap percobaan L4.1 Wawancara lembaga pendamping mencatat lembaga pendampingnya, tanggal, dan hasil.
- Setiap percobaan L4.2 Wawancara perusahaan penerima mencatat perusahaan penerimanya, tanggal, dan hasil.
- Pegawai mengisi hasilnya, dan langkah menjadi Selesai menurut §7.4.
- Perusahaan penerima dari percobaan L4.2 yang lulus menjadi **perusahaan penerima pendaftaran itu**.

### 10.4 Langkah bertanggal

L4.4 Tanda tangan kontrak kerja, L4.5 Pembuatan paspor, L6.2 COE terbit, dan L6.3 Visa terbit menjadi Selesai saat pegawai mengisi tanggalnya:

| Langkah | Tanggal yang diisi |
|---|---|
| L4.4 | tanggal kontrak ditandatangani |
| L4.5 | tanggal paspor jadi |
| L6.2 | tanggal COE terbit |
| L6.3 | tanggal visa terbit |

Sistem tidak menyimpan nomor paspor, nomor COE, nomor visa, maupun pindaian dokumen perjalanan (ADR-0004).

### 10.5 Magang kerja

L5.1 mencatat nama perusahaan di Indonesia, tanggal mulai, dan tanggal selesai. Tanggal selesai tidak boleh sebelum tanggal mulai. Langkah ini menjadi Selesai saat ketiganya terisi.

### 10.6 Berangkat

L6.4 Berangkat menjadi Selesai saat pegawai mengisi tanggal keberangkatan. Lalu pendaftaran menjadi Selesai (§7.6).

Data alumni diambil dari pendaftarannya: program, bidang kerja, perusahaan penerima beserta kota atau prefekturnya, dan tanggal berangkat.

## 11. Panel pegawai

### 11.1 Daftar pendaftaran

Pegawai melihat daftar semua pendaftaran, diurutkan dari yang paling baru dikirim.

Saringan:
- tahap;
- program;
- bidang kerja;
- kelas;
- status (Berjalan, Ditutup, Selesai).

Pencarian menurut nama atau nomor pendaftaran.

### 11.2 Halaman pendaftaran

Halaman satu pendaftaran menampilkan:
- isian formulir pendaftaran, yang bisa diubah pegawai;
- tahap, langkah, dan percobaan;
- kelas, level, dan perusahaan penerima;
- catatan untuk siswa dan catatan internal;
- riwayat perubahan.

Dari halaman ini pegawai mengubah status langkah, menambah percobaan, memindahkan tahap, dan menutup pendaftaran.

### 11.3 Catatan

Pegawai bisa menulis dua jenis catatan pada pendaftaran:
- **catatan untuk siswa**: terlihat oleh pemilik akun;
- **catatan internal**: hanya terlihat oleh pegawai.

Setiap catatan menyimpan penulis dan waktunya. Catatan tidak bisa diubah atau dihapus.

### 11.4 Riwayat perubahan

Sistem mencatat setiap:
- pindah tahap;
- perubahan status langkah;
- penambahan percobaan;
- penutupan;
- perubahan isian formulir pendaftaran oleh pegawai (OD-18).

Setiap catatan riwayat berisi siapa yang melakukannya, kapan, dan apa yang berubah. Riwayat terlihat oleh pegawai di halaman pendaftaran dan tidak bisa diubah atau dihapus, kecuali ikut terhapus bersama datanya (§12.4, §12.5).

### 11.5 Ekspor

Pegawai bisa mengunduh hasil saringan daftar pendaftaran sebagai berkas CSV yang bisa dibuka di Excel. Isinya:
- isian formulir pendaftaran;
- nomor pendaftaran;
- status, tahap, dan status setiap langkah;
- kelas dan level;
- perusahaan penerima;
- tanggal-tanggal langkah.

Ekspor tidak memuat hasil pemeriksaan fisik dan catatan internal.

## 12. Data pribadi

### 12.1 Persetujuan

Calon peserta wajib mencentang persetujuan pemrosesan data saat membuat akun (§5.1). Sistem menyimpan waktu persetujuan itu. Teks Kebijakan Privasi mengikuti OD-04.

### 12.2 Data yang tidak disimpan

Sistem tidak menyimpan (ADR-0004):
- NIK;
- nomor paspor, nomor COE, dan nomor visa;
- pindaian atau unggahan berkas pendaftaran dan dokumen perjalanan.

### 12.3 Data yang hanya terlihat oleh pegawai

- hasil pemeriksaan fisik;
- nilai dan hasil tes internal;
- catatan internal;
- riwayat perubahan.

### 12.4 Penghapusan otomatis

Setiap hari, sistem menghapus akun beserta semua pendaftarannya bila kedua syarat ini terpenuhi:

1. **Statusnya memenuhi syarat:** akun itu tidak pernah mengirim formulir pendaftaran, atau semua pendaftarannya berstatus Ditutup dengan alasan Tidak lolos seleksi atau Mundur. Alasan Dikeluarkan mengikuti OD-17.
2. **Tidak ada aktivitas selama masa simpan:** tanggal login terakhir **dan** tanggal perubahan terakhir pada akun atau pendaftarannya sama-sama sudah lewat masa simpan.

Masa simpan mengikuti OD-03 (contoh: 12 bulan).

"Sudah lewat masa simpan" berarti hari ini sudah sama dengan atau setelah tanggal jatuh tempo. Tanggal jatuh tempo adalah tanggal aktivitas terakhir ditambah masa simpan dalam bulan kalender. Bila tanggal itu tidak ada di bulan tujuan, jatuh temponya tanggal 1 bulan berikutnya.

Akun yang punya pendaftaran Berjalan atau Selesai (alumni) tidak pernah dihapus otomatis.

Contoh dengan masa simpan 12 bulan:
- Ditutup karena Mundur, login dan perubahan terakhir 10-01-2026. Hari ini 09-01-2027 → **belum dihapus**. Hari ini 10-01-2027 → **dihapus**.
- Ditutup karena Tidak lolos seleksi, perubahan terakhir 10-01-2026, login terakhir 01-06-2026. Hari ini 10-01-2027 → **belum dihapus**, karena login terakhir belum lewat 12 bulan.
- Belum pernah mengirim formulir, aktivitas terakhir 31-03-2025. Hari ini 31-03-2026 → **dihapus**.
- Aktivitas terakhir 29-02-2028 → jatuh tempo 01-03-2029. Hari ini 28-02-2029 → **belum dihapus**. Hari ini 01-03-2029 → **dihapus**.
- Pendaftaran Berjalan, aktivitas terakhir 2020 → **tidak dihapus**.

### 12.5 Penghapusan oleh Admin

Admin bisa menghapus secara permanen akun seseorang beserta semua pendaftaran, catatan, dan riwayatnya, misalnya atas permintaan orang itu. Sistem meminta konfirmasi dengan mengetik nomor pendaftaran atau email akun itu.

### 12.6 Permintaan salinan data

Pemilik akun yang meminta salinan seluruh data pribadinya dilayani pegawai di luar sistem, misalnya lewat ekspor (§11.5) ditambah data yang dikecualikan dari ekspor.

### 12.7 Cadangan data

Database dicadangkan sekali sehari di server. Setiap cadangan disimpan **14 hari**, lalu dihapus otomatis. Karena itu, data yang dihapus dari sistem (§12.4, §12.5) paling lama masih ada di cadangan selama 14 hari.

Contoh: cadangan dibuat 01-11-2026 pukul 02.00 WIB. Cadangan itu masih ada pada 14-11-2026, dan dihapus pada 15-11-2026.

Cara membuat dan memulihkan cadangan dicatat di `docs/DEPLOY.md`.

## Lampiran A. Milestone

| Milestone | Isi | Bagian PRD |
|---|---|---|
| M1 – Situs publik dan pendaftaran online | Fondasi aplikasi; situs publik; program, bidang kerja, statistik lembaga, galeri, dan kontak; akun calon peserta dan akun pegawai; formulir pendaftaran, batas usia, dan nomor pendaftaran; daftar dan halaman pendaftaran untuk pegawai; penutupan di tahap 1 | §3, §4, §5, §6, §7.5, §11.1, §11.2 (isian formulir), §12.1, §12.2, §12.5, §12.7 (bersama deploy) |
| M2 – Seleksi dan belajar | Status langkah, pindah tahap, percobaan; pemeriksaan fisik, tes internal, pra-MCU; kelas dan level; ujian resmi; catatan; riwayat perubahan; tahap dan langkah di akun siswa | §2.3, §7.1–§7.4, §8, §9, §11.2–§11.4, §12.3 |
| M3 – Job matching sampai berangkat | Perusahaan penerima, lembaga pendamping, wawancara, langkah bertanggal, magang kerja, berangkat dan alumni; ekspor; penghapusan otomatis | §7.6, §10, §11.5, §12.4 |
| Nanti | Versi bahasa Jepang, akun pengajar, unggah dokumen, pencatatan pembayaran | – |
