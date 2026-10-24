import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { JENIS_BERKAS_FOTO_GALERI } from "@/domain/foto-galeri";
import { db } from "./db";
import { fotoGaleri } from "./db/schema";

// Foto galeri yang dikelola Admin (PRD §3.4). Berkas foto disimpan di disk server, di folder dari variabel
// lingkungan FOLDER_FOTO_GALERI (.env.example); saat deploy, folder itu menjadi volume Docker. Database hanya
// menyimpan nama berkasnya. Nama berkas dibuat server (UUID acak), tidak pernah diambil dari nama berkas unggahan.

/** Foto galeri seperti yang tersimpan. `tanggalKegiatan` berbentuk YYYY-MM-DD. */
export type FotoGaleri = {
  id: number;
  judul: string;
  tanggalKegiatan: string;
  namaBerkas: string;
};

const KOLOM = {
  id: fotoGaleri.id,
  judul: fotoGaleri.judul,
  tanggalKegiatan: fotoGaleri.tanggalKegiatan,
  namaBerkas: fotoGaleri.namaBerkas,
};

/**
 * Akhiran nama berkas foto adalah bagian kedua jenis MIME-nya: image/jpeg → jpeg, image/png → png, image/webp → webp.
 * Daftar jenisnya hanya ada di aturan domain (JENIS_BERKAS_FOTO_GALERI).
 */
function akhiranBerkas(jenisBerkas: string): string {
  return jenisBerkas.slice(jenisBerkas.indexOf("/") + 1);
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * Nama berkas foto galeri buatan server: UUID huruf kecil dengan akhiran jenis fotonya, misalnya
 * 3f2a9b1c-0d4e-4f5a-8b6c-7d8e9f0a1b2c.jpeg. Nama dari luar, misalnya dari alamat /foto-galeri/[nama], divalidasi
 * dengan skema ini sebelum dipakai membaca disk; nama lain tidak pernah dibaca.
 */
export const skemaNamaBerkasFotoGaleri = z
  .string()
  .regex(
    new RegExp(
      `^${UUID}\\.(${JENIS_BERKAS_FOTO_GALERI.map(akhiranBerkas).join("|")})$`,
    ),
  )
  .brand<"NamaBerkasFotoGaleri">();

type NamaBerkasFotoGaleri = z.infer<typeof skemaNamaBerkasFotoGaleri>;

const PESAN_FOLDER =
  "FOLDER_FOTO_GALERI belum diisi, jadi foto galeri tidak bisa disimpan atau dibaca. Isi dengan folder penyimpanan foto, misalnya data/foto-galeri, di .env, lalu mulai ulang aplikasi.";

/** Folder penyimpanan foto galeri; folder relatif dihitung dari folder tempat aplikasi dijalankan. */
function folderFotoGaleri(): string {
  const folder = process.env.FOLDER_FOTO_GALERI?.trim();
  if (!folder) throw new Error(PESAN_FOLDER);
  return folder;
}

/**
 * Lokasi sebuah berkas di folder foto galeri. Folder itu baru diketahui saat aplikasi berjalan, jadi build Next.js
 * diminta tidak menelusurinya (turbopackIgnore); tanpa itu build menyertakan seluruh isi proyek.
 */
function lokasiBerkas(namaBerkas: string): string {
  return path.join(/*turbopackIgnore: true*/ folderFotoGaleri(), namaBerkas);
}

/** Apakah isi berkas diawali deretan byte tertentu, mulai dari posisi `mulai`. */
function diawali(isi: Uint8Array, tanda: readonly number[], mulai = 0) {
  return tanda.every((byte, i) => isi[mulai + i] === byte);
}

const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

/**
 * Jenis berkas menurut tanda di awal isinya, bukan menurut nama berkas atau jenis yang dikirim browser, supaya server
 * memeriksa format yang sebenarnya: JPG diawali FF D8 FF, PNG diawali 89 50 4E 47 0D 0A 1A 0A, dan WebP diawali
 * "RIFF", empat byte ukuran, lalu "WEBP". Berkas lain dianggap application/octet-stream.
 */
export function kenaliJenisBerkas(isi: Uint8Array): string {
  if (diawali(isi, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (diawali(isi, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (diawali(isi, RIFF) && diawali(isi, WEBP, 8)) return "image/webp";
  return "application/octet-stream";
}

/**
 * Semua foto galeri, terbaru di atas: tanggal kegiatan terbaru lebih dulu, lalu yang terakhir diunggah. `batas`
 * membatasi jumlahnya, misalnya tiga foto terbaru untuk Beranda.
 */
export async function daftarFotoGaleri(batas?: number): Promise<FotoGaleri[]> {
  const kueri = db
    .select(KOLOM)
    .from(fotoGaleri)
    .orderBy(
      desc(fotoGaleri.tanggalKegiatan),
      desc(fotoGaleri.diunggahPada),
      desc(fotoGaleri.id),
    );
  return batas === undefined ? kueri : kueri.limit(batas);
}

/**
 * Menyimpan foto yang sudah lolos syarat unggah (PRD §3.4): berkasnya ditulis ke folder foto galeri, lalu datanya
 * ke database. Bila penyimpanan data gagal, berkasnya dihapus lagi.
 */
export async function simpanFotoGaleri(foto: {
  judul: string;
  tanggalKegiatan: string;
  isi: Uint8Array;
  jenisBerkas: string;
}): Promise<FotoGaleri> {
  if (!JENIS_BERKAS_FOTO_GALERI.includes(foto.jenisBerkas)) {
    throw new Error(
      `Jenis berkas ${foto.jenisBerkas} bukan jenis foto galeri yang disimpan.`,
    );
  }
  const namaBerkas = `${randomUUID()}.${akhiranBerkas(foto.jenisBerkas)}`;
  const lokasi = lokasiBerkas(namaBerkas);
  await mkdir(path.dirname(lokasi), { recursive: true });
  await writeFile(lokasi, foto.isi, { flag: "wx" });
  try {
    const [baris] = await db
      .insert(fotoGaleri)
      .values({
        judul: foto.judul,
        tanggalKegiatan: foto.tanggalKegiatan,
        namaBerkas,
      })
      .returning(KOLOM);
    return baris;
  } catch (galat) {
    await rm(lokasi, { force: true });
    throw galat;
  }
}

/**
 * Folder tembolok next/image di `next start` (<distDir>/cache/images, distDir bawaan .next), tempat salinan kecil
 * setiap foto disimpan. Next.js tidak punya cara membatalkan satu salinan, dan salinan yang berkas aslinya sudah tidak
 * ada terus disajikan sebagai salinan lama; dokumentasi next/image (images.minimumCacheTTL) menganjurkan menghapus
 * folder ini. Salinan foto lain dibuat ulang saat diminta lagi.
 */
const FOLDER_TEMBOLOK_NEXT_IMAGE = path.join(
  /*turbopackIgnore: true*/ ".next",
  "cache",
  "images",
);

/**
 * Menghapus foto galeri beserta berkasnya dari disk; undefined bila foto itu tidak ada. Bila berkasnya gagal dihapus,
 * datanya juga batal dihapus, supaya data dan berkas tidak pernah terpisah. Sesudahnya tembolok next/image
 * dikosongkan, supaya salinan kecil foto itu juga hilang.
 */
export async function hapusFotoGaleri(
  id: number,
): Promise<FotoGaleri | undefined> {
  const foto = await db.transaction(async (tx) => {
    const [terhapus] = await tx
      .delete(fotoGaleri)
      .where(eq(fotoGaleri.id, id))
      .returning(KOLOM);
    if (terhapus) {
      await rm(lokasiBerkas(terhapus.namaBerkas), { force: true });
    }
    return terhapus;
  });
  if (foto) {
    // Foto dan berkas aslinya sudah terhapus, jadi kegagalan di sini dicatat tanpa membatalkan penghapusan.
    await rm(FOLDER_TEMBOLOK_NEXT_IMAGE, {
      recursive: true,
      force: true,
    }).catch((galat) =>
      console.error(
        `Tembolok next/image di ${FOLDER_TEMBOLOK_NEXT_IMAGE} belum terhapus, jadi salinan kecil foto "${foto.judul}" masih bisa tersaji. Hapus folder itu secara manual.`,
        galat,
      ),
    );
  }
  return foto;
}

/** Isi dan jenis berkas sebuah foto galeri untuk ditampilkan; undefined bila berkasnya tidak ada. */
export async function bacaBerkasFotoGaleri(
  nama: NamaBerkasFotoGaleri,
): Promise<{ isi: Buffer; jenisBerkas: string } | undefined> {
  const jenisBerkas = JENIS_BERKAS_FOTO_GALERI.find((jenis) =>
    nama.endsWith(`.${akhiranBerkas(jenis)}`),
  );
  if (!jenisBerkas) return undefined;
  try {
    const isi = await readFile(lokasiBerkas(nama));
    return { isi, jenisBerkas };
  } catch (galat) {
    if (galat instanceof Error && "code" in galat && galat.code === "ENOENT") {
      return undefined;
    }
    throw galat;
  }
}
