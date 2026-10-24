import type { Metadata } from "next";
import { connection } from "next/server";
import { TombolWhatsApp } from "@/components/tombol-whatsapp";
import { bacaKontak } from "@/server/kontak";

export const metadata: Metadata = {
  title: "Kontak",
  description:
    "Alamat, nomor WhatsApp, email, dan lokasi kantor LPKS Fujisaki Gakuin Center di Kesugihan, Cilacap.",
};

const JUDUL_SUB = "font-papan text-title";
// Tautan teks dengan target sentuh 44px (docs/DESIGN.md, Do's).
const TAUTAN = "inline-flex min-h-11 items-center";

/**
 * Halaman Kontak (PRD §3.1, §3.5): alamat dengan tautan "Lihat di peta", nomor WhatsApp kantor dengan tombol
 * "Chat WhatsApp", dan email kantor. Isinya dikelola Admin dan dibaca dari database pada setiap permintaan, jadi
 * perubahan Admin langsung terlihat. Peta tertanam di luar scope; cukup tautan ke aplikasi peta.
 */
export default async function HalamanKontak() {
  await connection();
  const kontak = await bacaKontak();
  const nomorWhatsApp = kontak?.nomorWhatsApp ?? null;

  return (
    <main className="wadah pt-8 pb-pad lg:pt-12 lg:pb-pad-lebar">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Kontak
      </h1>
      <p className="mt-3 max-w-[60ch] text-teks-2">
        Datang langsung ke loket kami di Kesugihan, atau tanyakan dulu lewat
        WhatsApp atau email.
      </p>

      <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-3 lg:gap-10">
        <section aria-labelledby="judul-alamat">
          <h2 id="judul-alamat" className={JUDUL_SUB}>
            Alamat
          </h2>
          {kontak && (
            <p className="mt-2 max-w-[34ch] text-body-lebar">{kontak.alamat}</p>
          )}
          {kontak?.tautanPeta ? (
            <a href={kontak.tautanPeta} className={`mt-1 ${TAUTAN}`}>
              Lihat di peta
            </a>
          ) : (
            <p className="mt-2 text-keterangan text-teks-2">
              Lokasi peta menyusul.
            </p>
          )}
        </section>

        <section aria-labelledby="judul-whatsapp">
          <h2 id="judul-whatsapp" className={JUDUL_SUB}>
            WhatsApp
          </h2>
          {nomorWhatsApp && (
            <p className="mt-2 text-body-lebar">+{nomorWhatsApp}</p>
          )}
          <TombolWhatsApp nomor={nomorWhatsApp} className="mt-3" />
        </section>

        <section aria-labelledby="judul-email">
          <h2 id="judul-email" className={JUDUL_SUB}>
            Email
          </h2>
          {kontak && (
            <a
              href={`mailto:${kontak.email}`}
              className={`mt-1 text-body-lebar wrap-anywhere ${TAUTAN}`}
            >
              {kontak.email}
            </a>
          )}
        </section>
      </div>
    </main>
  );
}
