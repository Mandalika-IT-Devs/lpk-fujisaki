-- Isi awal program dan bidang kerja (PRD §4.1, §4.2). Migrasi data ini berjalan sekali di setiap database,
-- termasuk produksi saat deploy menjalankan migrasi, jadi isi awal tersedia tanpa langkah manual.
-- Batas usia 18–30 tahun mengikuti ▶ Keputusan OD-01. Deskripsi, syarat, dan lama pelatihan adalah nilai
-- contoh OD-08 bertanda [CONTOH]; teks resminya diubah Admin lewat panel pegawai setelah pemilik memutuskan.
INSERT INTO "program" ("nama", "deskripsi", "syarat", "lama_pelatihan", "usia_minimal", "usia_maksimal") VALUES
	('Tokutei Ginou (SSW)', 'Bekerja di Jepang dengan visa pekerja berketerampilan khusus (SSW), di bidang kerja yang kamu pelajari. [CONTOH]', 'Sehat jasmani dan rohani, dan siap mengikuti enam tahap dari pendaftaran sampai berangkat, termasuk ujian bahasa Jepang dan ujian keterampilan SSW. [CONTOH]', '6–8 bulan [CONTOH]', 18, 30),
	('Pemagangan', 'Bekerja sambil berlatih di perusahaan Jepang lewat program pemagangan teknis (ginou jisshu). [CONTOH]', 'Sehat jasmani dan rohani, dan siap mengikuti enam tahap dari pendaftaran sampai berangkat, termasuk ujian bahasa Jepang. [CONTOH]', '6–8 bulan [CONTOH]', 18, 30),
	('Gijinkoku', 'Bekerja di Jepang sebagai tenaga ahli, misalnya insinyur, dengan visa gijinkoku. [CONTOH]', 'Sehat jasmani dan rohani, dan siap mengikuti enam tahap dari pendaftaran sampai berangkat. [CONTOH]', '6–8 bulan [CONTOH]', 18, 30),
	('Pelajar', 'Melanjutkan sekolah bahasa atau kuliah di Jepang. [CONTOH]', 'Sehat jasmani dan rohani, dan siap mengikuti enam tahap dari pendaftaran sampai berangkat. [CONTOH]', '6–8 bulan [CONTOH]', 18, 30);
--> statement-breakpoint
INSERT INTO "bidang_kerja" ("nama") VALUES
	('Pembersihan gedung'),
	('Perawat lansia (kaigo)'),
	('Pengolahan makanan dan minuman'),
	('Restoran');
