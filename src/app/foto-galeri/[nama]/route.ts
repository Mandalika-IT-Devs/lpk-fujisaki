import { z } from "zod";
import {
  bacaBerkasFotoGaleri,
  skemaNamaBerkasFotoGaleri,
} from "@/server/foto-galeri";

// Berkas asli foto galeri dari folder penyimpanan di disk (PRD §3.4). Folder itu di luar public/, karena Next.js hanya
// menyajikan isi public/ yang sudah ada saat build. Halaman menampilkan foto lewat next/image, yang mengambil berkas
// dari sini lalu mengecilkannya. Foto galeri terbuka untuk siapa pun di situs publik, jadi rute ini tanpa sesi dan
// tanpa pemeriksaan kewenangan: nama berkas divalidasi Zod, lalu berkasnya dibaca server.

/**
 * Dengan `no-cache`, next/image menyimpan salinan kecilnya selama images.minimumCacheTTL saja (bawaan Next.js 16:
 * 4 jam), tidak lebih lama. Salinan itu tidak kedaluwarsa sendiri bila berkas aslinya sudah dihapus, jadi
 * hapusFotoGaleri (src/server/foto-galeri.ts) mengosongkan tembolok next/image.
 */
const KEPALA_TETAP = {
  "Cache-Control": "no-cache",
  "X-Content-Type-Options": "nosniff",
};

const skemaParameter = z.object({ nama: skemaNamaBerkasFotoGaleri });

const PESAN_TIDAK_DITEMUKAN =
  "Foto tidak ditemukan; mungkin sudah dihapus dari galeri. Buka halaman Galeri di /galeri untuk melihat foto yang ada.";

function tidakDitemukan(): Response {
  return new Response(PESAN_TIDAK_DITEMUKAN, {
    status: 404,
    headers: { ...KEPALA_TETAP, "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(
  _permintaan: Request,
  { params }: RouteContext<"/foto-galeri/[nama]">,
) {
  const parameter = skemaParameter.safeParse(await params);
  if (!parameter.success) return tidakDitemukan();

  const berkas = await bacaBerkasFotoGaleri(parameter.data.nama);
  if (!berkas) return tidakDitemukan();
  return new Response(new Uint8Array(berkas.isi), {
    headers: { ...KEPALA_TETAP, "Content-Type": berkas.jenisBerkas },
  });
}
