CREATE TABLE "statistik_lembaga" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"data_per" date NOT NULL,
	"siswa_n5" integer NOT NULL,
	"siswa_n4" integer NOT NULL,
	"siswa_n3" integer NOT NULL,
	"siswa_n2" integer NOT NULL,
	"alumni_di_jepang" integer NOT NULL,
	CONSTRAINT "statistik_lembaga_satu_baris" CHECK ("statistik_lembaga"."id" = 1),
	CONSTRAINT "statistik_lembaga_angka_tidak_negatif" CHECK ("statistik_lembaga"."siswa_n5" >= 0 and "statistik_lembaga"."siswa_n4" >= 0 and "statistik_lembaga"."siswa_n3" >= 0 and "statistik_lembaga"."siswa_n2" >= 0 and "statistik_lembaga"."alumni_di_jepang" >= 0)
);
--> statement-breakpoint
CREATE TABLE "statistik_lembaga_bidang_kerja" (
	"bidang_kerja_id" integer PRIMARY KEY NOT NULL,
	"jumlah_siswa" integer NOT NULL,
	CONSTRAINT "statistik_lembaga_bidang_kerja_angka_tidak_negatif" CHECK ("statistik_lembaga_bidang_kerja"."jumlah_siswa" >= 0)
);
--> statement-breakpoint
ALTER TABLE "statistik_lembaga_bidang_kerja" ADD CONSTRAINT "statistik_lembaga_bidang_kerja_bidang_kerja_id_bidang_kerja_id_fk" FOREIGN KEY ("bidang_kerja_id") REFERENCES "public"."bidang_kerja"("id") ON DELETE no action ON UPDATE no action;