CREATE TABLE "langkah_pendaftaran" (
	"pendaftaran_id" uuid NOT NULL,
	"kode" text NOT NULL,
	"status" text NOT NULL,
	CONSTRAINT "langkah_pendaftaran_pendaftaran_id_kode_pk" PRIMARY KEY("pendaftaran_id","kode"),
	CONSTRAINT "langkah_pendaftaran_kode_sah" CHECK ("langkah_pendaftaran"."kode" in ('L1.1', 'L1.2', 'L1.3', 'L1.4', 'L1.5', 'L2.1', 'L2.2', 'L2.3', 'L2.4', 'L3.1', 'L3.2', 'L3.3', 'L4.1', 'L4.2', 'L4.3', 'L4.4', 'L4.5', 'L5.1', 'L6.1', 'L6.2', 'L6.3', 'L6.4')),
	CONSTRAINT "langkah_pendaftaran_status_sah" CHECK ("langkah_pendaftaran"."status" in ('Belum', 'Selesai', 'Tidak berlaku'))
);
--> statement-breakpoint
CREATE TABLE "nomor_urut_pendaftaran" (
	"tahun" integer PRIMARY KEY NOT NULL,
	"nomor_urut_terakhir" integer NOT NULL,
	CONSTRAINT "nomor_urut_pendaftaran_positif" CHECK ("nomor_urut_pendaftaran"."nomor_urut_terakhir" >= 1)
);
--> statement-breakpoint
CREATE TABLE "pendaftaran" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"akun_id" uuid NOT NULL,
	"nomor" text NOT NULL,
	"dikirim_pada" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"tahap" integer NOT NULL,
	"nama_lengkap" text NOT NULL,
	"jenis_kelamin" text NOT NULL,
	"tempat_lahir" text NOT NULL,
	"tanggal_lahir" date NOT NULL,
	"kabupaten_kota" text NOT NULL,
	"provinsi" text NOT NULL,
	"pendidikan_terakhir" text NOT NULL,
	"jurusan_pendidikan" text,
	"program_id" integer NOT NULL,
	"bidang_kerja_id" integer,
	"bidang_kerja_belum_tahu" boolean DEFAULT false NOT NULL,
	"kemampuan_bahasa_jepang" text NOT NULL,
	"pengalaman_kerja" text,
	"nama_kontak_darurat" text NOT NULL,
	"hubungan_kontak_darurat" text NOT NULL,
	"nomor_hp_kontak_darurat" text NOT NULL,
	CONSTRAINT "pendaftaran_nomor_unique" UNIQUE("nomor"),
	CONSTRAINT "pendaftaran_status_sah" CHECK ("pendaftaran"."status" in ('Berjalan', 'Ditutup', 'Selesai')),
	CONSTRAINT "pendaftaran_tahap_sah" CHECK ("pendaftaran"."tahap" between 1 and 6),
	CONSTRAINT "pendaftaran_jenis_kelamin_sah" CHECK ("pendaftaran"."jenis_kelamin" in ('Laki-laki', 'Perempuan')),
	CONSTRAINT "pendaftaran_provinsi_sah" CHECK ("pendaftaran"."provinsi" in ('Aceh', 'Bali', 'Banten', 'Bengkulu', 'Daerah Istimewa Yogyakarta', 'DKI Jakarta', 'Gorontalo', 'Jambi', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Tengah', 'Kalimantan Timur', 'Kalimantan Utara', 'Kepulauan Bangka Belitung', 'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Pegunungan', 'Papua Selatan', 'Papua Tengah', 'Riau', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tengah', 'Sulawesi Tenggara', 'Sulawesi Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Sumatera Utara')),
	CONSTRAINT "pendaftaran_pendidikan_terakhir_sah" CHECK ("pendaftaran"."pendidikan_terakhir" in ('SMP', 'SMA', 'SMK', 'Paket C', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2')),
	CONSTRAINT "pendaftaran_kemampuan_bahasa_jepang_sah" CHECK ("pendaftaran"."kemampuan_bahasa_jepang" in ('Belum pernah belajar', 'N5', 'N4', 'N3', 'N2')),
	CONSTRAINT "pendaftaran_tepat_satu_pilihan_bidang_kerja" CHECK (("pendaftaran"."bidang_kerja_id" is not null) <> "pendaftaran"."bidang_kerja_belum_tahu")
);
--> statement-breakpoint
ALTER TABLE "langkah_pendaftaran" ADD CONSTRAINT "langkah_pendaftaran_pendaftaran_id_pendaftaran_id_fk" FOREIGN KEY ("pendaftaran_id") REFERENCES "public"."pendaftaran"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendaftaran" ADD CONSTRAINT "pendaftaran_akun_id_akun_id_fk" FOREIGN KEY ("akun_id") REFERENCES "public"."akun"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendaftaran" ADD CONSTRAINT "pendaftaran_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendaftaran" ADD CONSTRAINT "pendaftaran_bidang_kerja_id_bidang_kerja_id_fk" FOREIGN KEY ("bidang_kerja_id") REFERENCES "public"."bidang_kerja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pendaftaran_akun_id_idx" ON "pendaftaran" USING btree ("akun_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pendaftaran_satu_berjalan_per_akun" ON "pendaftaran" USING btree ("akun_id") WHERE "pendaftaran"."status" = 'Berjalan';