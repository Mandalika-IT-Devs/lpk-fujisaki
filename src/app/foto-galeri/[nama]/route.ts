import { bacaBerkasFotoGaleri } from "@/server/foto-galeri";

// Berkas asli foto galeri dari folder penyimpanan di disk (PRD §3.4). Folder itu di luar public/, karena Next.js hanya
// menyajikan isi public/ yang sudah ada saat build. Halaman menampilkan foto lewat next/image, yang mengambil berkas
// dari sini lalu mengecilkannya.

/**
 * `no-cache` membuat next/image menyimpan hasil kecilnya selama waktu bawaannya saja, bukan lebih lama, jadi foto
 * yang dihapus tidak tertahan lama di tembolok.
 */
const KEPALA_TETAP = {
  "Cache-Control": "no-cache",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(
  _permintaan: Request,
  { params }: RouteContext<"/foto-galeri/[nama]">,
) {
  const berkas = await bacaBerkasFotoGaleri((await params).nama);
  if (!berkas) {
    return new Response("Foto tidak ditemukan.", {
      status: 404,
      headers: KEPALA_TETAP,
    });
  }
  return new Response(new Uint8Array(berkas.isi), {
    headers: { ...KEPALA_TETAP, "Content-Type": berkas.jenisBerkas },
  });
}
