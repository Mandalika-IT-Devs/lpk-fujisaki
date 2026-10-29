ALTER TABLE "akun" ADD COLUMN "nomor_whatsapp" text;--> statement-breakpoint
ALTER TABLE "akun" ADD COLUMN "waktu_persetujuan" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "akun" ADD CONSTRAINT "akun_nomor_whatsapp_unique" UNIQUE("nomor_whatsapp");--> statement-breakpoint
ALTER TABLE "akun" ADD CONSTRAINT "akun_pemilik_akun_punya_nomor_dan_persetujuan" CHECK ("akun"."jenis" <> 'pemilik_akun' or ("akun"."nomor_whatsapp" is not null and "akun"."waktu_persetujuan" is not null));