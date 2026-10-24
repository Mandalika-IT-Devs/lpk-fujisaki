CREATE TABLE "bidang_kerja" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bidang_kerja_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nama" text NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "program_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nama" text NOT NULL,
	"deskripsi" text NOT NULL,
	"syarat" text NOT NULL,
	"lama_pelatihan" text NOT NULL,
	"usia_minimal" integer NOT NULL,
	"usia_maksimal" integer NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL
);
