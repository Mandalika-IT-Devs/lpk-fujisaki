CREATE TABLE "draf_formulir_pendaftaran" (
	"akun_id" uuid PRIMARY KEY NOT NULL,
	"nama_lengkap" text,
	"jenis_kelamin" text,
	"tempat_lahir" text,
	"tanggal_lahir" date,
	"kabupaten_kota" text,
	"provinsi" text,
	"pendidikan_terakhir" text,
	"jurusan_pendidikan" text,
	"program_id" integer,
	"bidang_kerja_id" integer,
	"bidang_kerja_belum_tahu" boolean DEFAULT false NOT NULL,
	"kemampuan_bahasa_jepang" text,
	"pengalaman_kerja" text,
	"nama_kontak_darurat" text,
	"hubungan_kontak_darurat" text,
	"nomor_hp_kontak_darurat" text,
	CONSTRAINT "draf_formulir_pendaftaran_jenis_kelamin_sah" CHECK ("draf_formulir_pendaftaran"."jenis_kelamin" in ('Laki-laki', 'Perempuan')),
	CONSTRAINT "draf_formulir_pendaftaran_provinsi_sah" CHECK ("draf_formulir_pendaftaran"."provinsi" in ('Aceh', 'Bali', 'Banten', 'Bengkulu', 'Daerah Istimewa Yogyakarta', 'DKI Jakarta', 'Gorontalo', 'Jambi', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Tengah', 'Kalimantan Timur', 'Kalimantan Utara', 'Kepulauan Bangka Belitung', 'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Pegunungan', 'Papua Selatan', 'Papua Tengah', 'Riau', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tengah', 'Sulawesi Tenggara', 'Sulawesi Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Sumatera Utara')),
	CONSTRAINT "draf_formulir_pendaftaran_pendidikan_terakhir_sah" CHECK ("draf_formulir_pendaftaran"."pendidikan_terakhir" in ('SMP', 'SMA', 'SMK', 'Paket C', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2')),
	CONSTRAINT "draf_formulir_pendaftaran_kemampuan_bahasa_jepang_sah" CHECK ("draf_formulir_pendaftaran"."kemampuan_bahasa_jepang" in ('Belum pernah belajar', 'N5', 'N4', 'N3', 'N2')),
	CONSTRAINT "draf_formulir_pendaftaran_satu_pilihan_bidang_kerja" CHECK (not ("draf_formulir_pendaftaran"."bidang_kerja_belum_tahu" and "draf_formulir_pendaftaran"."bidang_kerja_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "draf_formulir_pendaftaran" ADD CONSTRAINT "draf_formulir_pendaftaran_akun_id_akun_id_fk" FOREIGN KEY ("akun_id") REFERENCES "public"."akun"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draf_formulir_pendaftaran" ADD CONSTRAINT "draf_formulir_pendaftaran_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draf_formulir_pendaftaran" ADD CONSTRAINT "draf_formulir_pendaftaran_bidang_kerja_id_bidang_kerja_id_fk" FOREIGN KEY ("bidang_kerja_id") REFERENCES "public"."bidang_kerja"("id") ON DELETE no action ON UPDATE no action;