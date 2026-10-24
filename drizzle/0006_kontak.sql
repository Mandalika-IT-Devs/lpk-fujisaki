CREATE TABLE "kontak" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"alamat" text NOT NULL,
	"nomor_whatsapp" text,
	"email" text NOT NULL,
	"tautan_peta" text,
	CONSTRAINT "kontak_satu_baris" CHECK ("kontak"."id" = 1)
);
