-- Isi awal kontak lembaga (PRD §3.5). Semua isian di bawah adalah nilai contoh OD-05 [CONTOH]: alamat
-- "Desa Kesugihan, Kab. Cilacap, Jawa Tengah [CONTOH]", WhatsApp 6280000000000 [CONTOH], dan email
-- info@lpkfujisaki.com [CONTOH]. Tanda [CONTOH] tidak bisa ditulis di dalam nomor dan email, jadi hanya alamat yang
-- membawanya di situs. OD-05 belum punya nilai contoh untuk titik peta, jadi tautan peta dibiarkan kosong.
-- Admin mengubahnya lewat panel pegawai setelah pemilik memutuskan isinya.
-- Migrasi data ini berjalan sekali di setiap database, termasuk produksi saat deploy menjalankan migrasi.
INSERT INTO "kontak" ("id", "alamat", "nomor_whatsapp", "email", "tautan_peta") VALUES
	(1, 'Desa Kesugihan, Kab. Cilacap, Jawa Tengah [CONTOH]', '6280000000000', 'info@lpkfujisaki.com', NULL);
