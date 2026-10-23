# Keputusan terbuka

Daftar hal yang belum diputuskan pemilik produk. Agent tidak boleh mengisi nilainya sendiri.

Bila sebuah tiket membutuhkan salah satu keputusan ini:
- pakai nilai contohnya di seed dan test, dengan tanda `[CONTOH]`;
- sebut ID OD-nya di PR.

Setelah pemilik memutuskan lewat `/tiket:catat-keputusan`, keputusan itu ditulis ke `docs/PRD.md` sebagai blok ▶ Keputusan, dan barisnya dihapus dari tabel ini.

| ID | Pertanyaan | Pemilik keputusan | Yang terblokir | Nilai contoh untuk pengujian |
|---|---|---|---|---|
| OD-01 | Berapa usia minimal dan maksimal untuk setiap program? | Pemilik produk | PRD §4.1, §6.3: batas usia di formulir pendaftaran (M1) | 18–30 tahun untuk keempat program |
| OD-02 | Berapa ambang kelulusan psikotes dan tes matematika? Bila ambang diubah, apakah percobaan lama ikut dinilai ulang? | Pemilik produk | PRD §8.3: hasil tes internal (M2) | Ambang 60 untuk kedua tes. Perubahan ambang hanya berlaku untuk percobaan yang dicatat sesudahnya |
| OD-03 | Berapa lama data disimpan tanpa aktivitas sebelum dihapus otomatis? | Pemilik produk | PRD §12.4: penghapusan otomatis (M3) | 12 bulan |
| OD-04 | Apa isi halaman Kebijakan Privasi? | Pemilik produk, bersama penasihat hukum lembaga | PRD §3.1, §12.1: halaman Kebijakan Privasi dan persetujuan saat membuat akun (M1) | Draf umum sesuai UU PDP bertanda [CONTOH] |
| OD-05 | Apa alamat lengkap, nomor WhatsApp kantor, email kantor, dan titik peta lembaga? | Pemilik produk | PRD §3.5: halaman Kontak dan tombol WhatsApp (M1) | Alamat "Desa Kesugihan, Kab. Cilacap, Jawa Tengah [CONTOH]", WhatsApp 6280000000000 [CONTOH], email info@lpkfujisaki.com [CONTOH] |
| OD-06 | Logo dan foto mana yang boleh dipakai di situs, dan apakah orang di foto sudah setuju? | Pemilik produk | PRD §3.1, §3.4: tampilan situs publik dan isi awal galeri (M1) | Logo berupa tulisan "Fujisaki" tanpa gambar; galeri kosong |
| OD-07 | Apa teks halaman Tentang Kami (profil, visi dan misi, pimpinan) dan angka awal statistik lembaga? | Pemilik produk | PRD §3.1, §3.3: halaman Tentang Kami dan Beranda (M1) | Terjemahan ringkas profil lembaga bertanda [CONTOH]. Statistik dari profil: N5 65, N4 124, N3 21, N2 0; bidang kerja 88/68/30/24; alumni 1.214; data per 28-08-2025 |
| OD-08 | Apa deskripsi, syarat, dan lama pelatihan setiap program? | Pemilik produk | PRD §4.1: halaman Program (M1) | Teks pendek bertanda [CONTOH]; lama pelatihan "6–8 bulan [CONTOH]" |
| OD-09 | Apakah nomor WhatsApp luar negeri diterima? | Pemilik produk | PRD §5.2: pembuatan akun (M1) | Tidak, hanya nomor HP Indonesia |
| OD-10 | Apakah formulir perlu pilihan pendidikan lain, misalnya Paket C, D1, D2, D4, atau S2? | Pemilik produk | PRD §6.1: isian pendidikan terakhir (M1) | Tidak, hanya SMP, SMA, SMK, D3, S1 |
| OD-11 | Bolehkah alumni mendaftar lagi untuk program lain? | Pemilik produk | PRD §6.6: pengiriman formulir oleh pemilik akun yang pendaftarannya Selesai (M1) | Boleh, sama seperti pendaftaran yang ditutup |
| OD-12 | Bolehkah pegawai memundurkan tahap atau mengubah langkah di tahap yang sudah ditinggalkan, misalnya untuk memperbaiki salah klik? | Pemilik produk | PRD §7.2, §7.3: koreksi tahap dan langkah (M2) | Tidak. Tahap hanya maju, dan langkah di tahap sebelumnya terkunci |
| OD-13 | Ujian apa saja yang menyelesaikan L2.4 Ujian bahasa Jepang? | Pemilik produk | PRD §9.3: penyelesaian L2.4 (M2) | Lulus JFT-Basic, atau lulus JLPT N4, N3, N2, atau N1 |
| OD-14 | Apa yang dilihat pemilik akun saat pendaftarannya ditutup? | Pemilik produk | PRD §2.3, §7.5: halaman akun setelah penutupan (M1) | Status Ditutup dan alasannya (Tidak lolos seleksi, Mundur, Dikeluarkan), tanpa keterangan penutupan |
| OD-15 | Bila perusahaan penerima batal setelah siswa lulus wawancaranya, bagaimana pegawai mencatatnya? | Pemilik produk | PRD §7.4, §10.3: wawancara perusahaan penerima (M3) | Pegawai membatalkan percobaan yang lulus dengan keterangan wajib. L4.2 kembali Belum, perusahaan penerima dilepas dari pendaftaran, dan percobaan baru boleh ditambahkan |
| OD-16 | Siapa yang mengelola galeri: hanya Admin (jawaban Q34) atau juga Staf (jawaban Q36)? | Pemilik produk | PRD §2.2, §3.4: hak akses galeri (M1) | Hanya Admin |
| OD-17 | Apakah data orang yang pendaftarannya ditutup dengan alasan Dikeluarkan juga dihapus otomatis? | Pemilik produk | PRD §12.4: penghapusan otomatis (M3) | Ya, sama seperti Tidak lolos seleksi dan Mundur |
| OD-18 | Apakah perubahan isian formulir pendaftaran oleh pegawai ikut dicatat di riwayat perubahan? | Pemilik produk | PRD §6.5, §11.4: riwayat perubahan (M2) | Ya, dengan nilai lama dan nilai baru |
