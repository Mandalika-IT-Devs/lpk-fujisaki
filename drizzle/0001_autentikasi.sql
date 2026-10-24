CREATE TABLE "akun" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"jenis" text NOT NULL,
	"peran" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "akun_email_unique" UNIQUE("email"),
	CONSTRAINT "akun_jenis_sah" CHECK ("akun"."jenis" in ('pegawai', 'pemilik_akun')),
	CONSTRAINT "akun_peran_sah" CHECK ("akun"."peran" in ('admin', 'staf')),
	CONSTRAINT "akun_peran_hanya_untuk_pegawai" CHECK (("akun"."jenis" = 'pegawai') = ("akun"."peran" is not null))
);
--> statement-breakpoint
CREATE TABLE "kredensial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sesi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "sesi_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verifikasi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kredensial" ADD CONSTRAINT "kredensial_user_id_akun_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."akun"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesi" ADD CONSTRAINT "sesi_user_id_akun_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."akun"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kredensial_user_id_idx" ON "kredensial" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sesi_user_id_idx" ON "sesi" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifikasi_identifier_idx" ON "verifikasi" USING btree ("identifier");