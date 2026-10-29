import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ALAMAT_AKUN } from "@/components/tautan-situs";
import { TombolWhatsApp } from "@/components/tombol-whatsapp";
import { bacaKontak } from "@/server/kontak";
import { bacaPendaftaranBerjalan } from "@/server/pendaftaran";
import { GAYA_TAUTAN } from "@/app/panel/akses-pegawai";
import { pastikanPemilikAkun } from "../../penjaga-akun";

export const metadata: Metadata = { title: "Pendaftaran terkirim" };

/**
 * Halaman konfirmasi sesudah formulir pendaftaran dikirim (PRD §6.5): nomor pendaftaran dan tombol "Chat WhatsApp" ke
 * nomor WhatsApp kantor (§3.5). Halaman ini hanya untuk pemilik akun (§2.2); tanpa pendaftaran Berjalan, halaman ini
 * mengarah ke halaman akun.
 */
export default async function HalamanKonfirmasiPendaftaran() {
  const pemilikAkun = await pastikanPemilikAkun();
  const [pendaftaran, kontak] = await Promise.all([
    bacaPendaftaranBerjalan(pemilikAkun.id),
    bacaKontak(),
  ]);
  if (!pendaftaran) redirect(ALAMAT_AKUN);

  return (
    <main className="wadah pt-8 pb-pad lg:pt-12 lg:pb-pad-lebar">
      <div className="grid max-w-2xl gap-6">
        <div className="grid gap-1">
          <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
            Pendaftaran terkirim
          </h1>
          <p className="max-w-[60ch] text-teks-2">
            Formulir pendaftaranmu untuk {pendaftaran.program} sudah kami
            terima.
          </p>
        </div>

        <section
          aria-labelledby="judul-nomor-pendaftaran"
          className="grid gap-4 rounded-sudut bg-dasar p-4 shadow-papan lg:p-6"
        >
          <div className="grid gap-1">
            <h2
              id="judul-nomor-pendaftaran"
              className="text-keterangan font-semibold text-teks-2"
            >
              Nomor pendaftaran
            </h2>
            <p className="font-papan text-nomor">{pendaftaran.nomor}</p>
          </div>
          <p className="max-w-[60ch]">
            Simpan nomor ini. Isian formulirmu sekarang terkunci; bila ada yang
            perlu diubah, hubungi lembaga lewat WhatsApp.
          </p>
          <TombolWhatsApp nomor={kontak?.nomorWhatsApp ?? null} />
        </section>

        <Link
          href={ALAMAT_AKUN}
          className={`${GAYA_TAUTAN} justify-self-start font-bold`}
        >
          Buka akunmu
        </Link>
      </div>
    </main>
  );
}
