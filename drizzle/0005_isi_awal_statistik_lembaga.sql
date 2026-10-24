-- Isi awal statistik lembaga (PRD §3.3). Semua angka di bawah adalah nilai contoh OD-07 [CONTOH], diambil dari
-- profil lembaga: N5 65, N4 124, N3 21, N2 0; bidang kerja 88, 68, 30, 24; alumni di Jepang 1.214; data per
-- 28-08-2025. Admin mengubahnya lewat panel pegawai setelah pemilik memutuskan angka resminya.
-- Migrasi data ini berjalan sekali di setiap database, termasuk produksi saat deploy menjalankan migrasi.
INSERT INTO "statistik_lembaga" ("id", "data_per", "siswa_n5", "siswa_n4", "siswa_n3", "siswa_n2", "alumni_di_jepang") VALUES
	(1, '2025-08-28', 65, 124, 21, 0, 1214);
--> statement-breakpoint
-- Jumlah siswa per bidang kerja [CONTOH], dicocokkan dengan nama keempat bidang kerja dari isi awal 0003.
INSERT INTO "statistik_lembaga_bidang_kerja" ("bidang_kerja_id", "jumlah_siswa")
SELECT "bidang_kerja"."id", "contoh"."jumlah_siswa"
FROM "bidang_kerja"
JOIN (VALUES
	('Pembersihan gedung', 88),
	('Perawat lansia (kaigo)', 68),
	('Pengolahan makanan dan minuman', 30),
	('Restoran', 24)
) AS "contoh" ("nama", "jumlah_siswa") ON "contoh"."nama" = "bidang_kerja"."nama";
