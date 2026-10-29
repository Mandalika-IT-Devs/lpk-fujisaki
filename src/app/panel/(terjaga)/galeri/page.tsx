import type { Metadata } from "next";
import { daftarFotoGaleri } from "@/server/foto-galeri";
import { metadataMenu, pastikanBolehMembuka } from "../../penjaga";
import { DaftarFoto } from "./daftar-foto";
import { FormulirUnggahFoto } from "./formulir-unggah-foto";

const KUNCI_MENU = "galeri";

const GAYA_JUDUL_BAGIAN =
  "max-w-[22ch] font-papan text-headline-bagian text-balance lg:text-headline-bagian-lebar";

export function generateMetadata(): Promise<Metadata> {
  return metadataMenu(KUNCI_MENU);
}

/**
 * Admin mengelola galeri (PRD §3.4, ▶ Keputusan OD-16): daftar foto beserta tombol hapusnya, dan formulir unggah foto.
 * Staf ditolak dengan 403.
 */
export default async function HalamanKelolaGaleri() {
  const menu = await pastikanBolehMembuka(KUNCI_MENU);
  const daftar = await daftarFotoGaleri();

  return (
    <div className="grid gap-10">
      <div className="grid gap-3">
        <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
          {menu.nama}
        </h1>
        <p className="max-w-[60ch] text-teks-2">
          Foto di sini tampil di halaman Galeri, terbaru di atas, dan tiga foto
          terbaru tampil di Beranda.
        </p>
      </div>
      <section aria-labelledby="judul-daftar-foto" className="grid gap-4">
        <h2 id="judul-daftar-foto" className={GAYA_JUDUL_BAGIAN}>
          Foto di galeri
        </h2>
        <p className="max-w-[60ch] text-teks-2">
          Foto tidak bisa diubah setelah diunggah. Foto yang dihapus hilang dari
          situs, dan berkasnya ikut dihapus dari server.
        </p>
        <DaftarFoto daftar={daftar} />
      </section>
      <section aria-labelledby="judul-unggah-foto" className="grid gap-4">
        <h2 id="judul-unggah-foto" className={GAYA_JUDUL_BAGIAN}>
          Unggah foto
        </h2>
        <p className="max-w-[60ch] text-teks-2">
          Unggah hanya foto yang orangnya sudah setuju fotonya dipublikasikan.
          Foto baru langsung tampil di situs publik.
        </p>
        <FormulirUnggahFoto />
      </section>
    </div>
  );
}
