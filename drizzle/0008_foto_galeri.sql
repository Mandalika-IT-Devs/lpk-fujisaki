CREATE TABLE "foto_galeri" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "foto_galeri_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"judul" text NOT NULL,
	"tanggal_kegiatan" date NOT NULL,
	"nama_berkas" text NOT NULL,
	"diunggah_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "foto_galeri_nama_berkas_unique" UNIQUE("nama_berkas")
);
