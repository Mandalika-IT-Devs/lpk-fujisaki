import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Cara LPKS Fujisaki Gakuin Center memproses data pribadi calon peserta dan siswa.",
};

const JUDUL_BAGIAN =
  "max-w-[22ch] font-papan text-headline-bagian text-balance lg:text-headline-bagian-lebar";
const BACAAN = "max-w-[60ch]";
const DAFTAR = "grid list-disc gap-2 pl-5 marker:text-jalur";

// [CONTOH] OD-04: draf umum sesuai UU PDP, sampai lembaga dan penasihat hukumnya menyerahkan teks resmi.
// Isinya mengikuti aturan data pribadi di PRD §2.3, §5.1, §6.1, dan §12. Masa simpan 12 bulan adalah nilai contoh OD-03.
export default function HalamanKebijakanPrivasi() {
  return (
    <main className="wadah pt-8 pb-pad lg:pt-12 lg:pb-pad-lebar">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Kebijakan Privasi
      </h1>
      <p className={`mt-3 text-teks-2 ${BACAAN}`}>
        Kebijakan ini menjelaskan data pribadi apa yang kami kumpulkan, untuk
        apa data itu dipakai, siapa yang bisa melihatnya, berapa lama disimpan,
        dan apa hakmu atas data itu. Kebijakan ini mengikuti Undang-Undang Nomor
        27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
      </p>
      <p
        className={`mt-5 rounded-sudut bg-jalur-pucat px-3.5 py-3 text-body-kecil ${BACAAN}`}
      >
        <b className="mb-0.5 block text-keterangan font-semibold text-teks-2">
          [CONTOH]
        </b>
        Ini draf umum yang belum diperiksa penasihat hukum lembaga. Teks
        resminya menyusul.
      </p>

      <section aria-labelledby="judul-pemroses" className="mt-12 lg:mt-16">
        <h2 id="judul-pemroses" className={JUDUL_BAGIAN}>
          Siapa yang memproses datamu
        </h2>
        <p className={`mt-4 ${BACAAN}`}>
          Datamu diproses oleh PT Fujisaki Global Inspirasi, pengelola LPKS
          Fujisaki Gakuin Center di Desa Kesugihan, Kabupaten Cilacap, Jawa
          Tengah. Dalam UU PDP, kami adalah pengendali data pribadi.
        </p>
      </section>

      <section aria-labelledby="judul-data" className="mt-12 lg:mt-16">
        <h2 id="judul-data" className={JUDUL_BAGIAN}>
          Data yang kami kumpulkan
        </h2>
        <div className={`mt-4 grid gap-4 ${BACAAN}`}>
          <ul className={DAFTAR}>
            <li>
              <b>Saat membuat akun:</b> nama lengkap, email, nomor WhatsApp, dan
              kata sandi.
            </li>
            <li>
              <b>Saat mengisi formulir pendaftaran:</b> nama lengkap sesuai KTP,
              jenis kelamin, tempat dan tanggal lahir, kabupaten/kota dan
              provinsi domisili, pendidikan terakhir dan jurusannya, program dan
              bidang kerja yang diminati, kemampuan bahasa Jepang, pengalaman
              kerja, serta nama, hubungan, dan nomor HP kontak darurat.
            </li>
            <li>
              <b>Selama pendaftaran berjalan:</b> hasil pemeriksaan fisik
              (tinggi badan, berat badan, tato, dan tindik), hasil tes dan
              ujian, hasil wawancara, catatan pegawai, dan tanggal terbit
              dokumen perjalanan.
            </li>
          </ul>
          <p>
            Hasil pemeriksaan fisik termasuk data kesehatan, yang dalam UU PDP
            tergolong data pribadi yang bersifat spesifik. Data ini hanya bisa
            dilihat pegawai lembaga.
          </p>
          <p>
            Kami tidak menyimpan NIK, nomor paspor, nomor COE, nomor visa,
            maupun pindaian dokumen. Berkas pendaftaran seperti KTP dan ijazah
            diperiksa langsung di kantor, tidak diunggah ke situs ini.
          </p>
        </div>
      </section>

      <section aria-labelledby="judul-tujuan" className="mt-12 lg:mt-16">
        <h2 id="judul-tujuan" className={JUDUL_BAGIAN}>
          Untuk apa datamu dipakai
        </h2>
        <div className={`mt-4 grid gap-4 ${BACAAN}`}>
          <ul className={DAFTAR}>
            <li>
              Memproses pendaftaranmu melalui enam tahap, dari pendaftaran dan
              seleksi sampai berangkat ke Jepang.
            </li>
            <li>Menghubungimu dan kontak daruratmu tentang pendaftaranmu.</li>
            <li>
              Mengirim email verifikasi akun dan email atur ulang kata sandi.
            </li>
            <li>
              Menyiapkan wawancara dengan lembaga pendamping dan perusahaan
              penerima di Jepang.
            </li>
          </ul>
          <p>
            Dasar pemrosesannya adalah persetujuanmu. Kamu memberikannya dengan
            mencentang persetujuan saat membuat akun, dan waktu persetujuan itu
            kami simpan.
          </p>
          <p>
            Kami tidak menjual datamu. Data hanya kami sampaikan kepada pihak
            lain bila diperlukan untuk penempatanmu, misalnya kepada lembaga
            pendamping dan perusahaan penerima di Jepang saat job matching, atau
            bila diwajibkan peraturan.
          </p>
        </div>
      </section>

      <section aria-labelledby="judul-melihat" className="mt-12 lg:mt-16">
        <h2 id="judul-melihat" className={JUDUL_BAGIAN}>
          Siapa yang bisa melihat datamu
        </h2>
        <div className={`mt-4 grid gap-4 ${BACAAN}`}>
          <p>
            Di akunmu, kamu bisa melihat isian formulir pendaftaranmu, nomor dan
            status pendaftaranmu, tahap dan langkah yang sedang berjalan, hasil
            ujian resmi, dan catatan untuk siswa.
          </p>
          <p>
            Pegawai lembaga melihat seluruh data pendaftaran. Hasil pemeriksaan
            fisik, nilai tes internal, catatan internal, dan riwayat perubahan
            hanya terlihat oleh pegawai.
          </p>
        </div>
      </section>

      <section aria-labelledby="judul-simpan" className="mt-12 lg:mt-16">
        <h2 id="judul-simpan" className={JUDUL_BAGIAN}>
          Berapa lama datamu disimpan
        </h2>
        <div className={`mt-4 grid gap-4 ${BACAAN}`}>
          <p>
            Bila kamu belum pernah mengirim formulir pendaftaran, atau
            pendaftaranmu ditutup karena tidak lolos seleksi atau mundur, akun
            dan datamu dihapus otomatis setelah 12 bulan [CONTOH] tanpa
            aktivitas, yaitu tanpa masuk ke akun dan tanpa perubahan data.
          </p>
          <p>
            Data pendaftaran yang sedang berjalan, dan data alumni yang sudah
            berangkat, tetap kami simpan.
          </p>
          <p>
            Database dicadangkan sekali sehari, dan setiap cadangan dihapus
            otomatis setelah 14 hari. Karena itu, data yang sudah dihapus masih
            ada di cadangan paling lama 14 hari.
          </p>
        </div>
      </section>

      <section aria-labelledby="judul-hak" className="mt-12 lg:mt-16">
        <h2 id="judul-hak" className={JUDUL_BAGIAN}>
          Hakmu atas datamu
        </h2>
        <div className={`mt-4 grid gap-4 ${BACAAN}`}>
          <p>Sesuai UU PDP, kamu berhak:</p>
          <ul className={DAFTAR}>
            <li>mendapat penjelasan tentang pemrosesan datamu;</li>
            <li>meminta salinan datamu;</li>
            <li>meminta data yang salah diperbaiki;</li>
            <li>meminta akun dan datamu dihapus;</li>
            <li>menarik kembali persetujuanmu.</li>
          </ul>
          <p>
            Ajukan permintaanmu ke kantor lembaga. Alamat dan kontaknya ada di
            halaman <Link href="/kontak">Kontak</Link>.
          </p>
        </div>
      </section>

      <section aria-labelledby="judul-perubahan" className="mt-12 lg:mt-16">
        <h2 id="judul-perubahan" className={JUDUL_BAGIAN}>
          Perubahan kebijakan ini
        </h2>
        <p className={`mt-4 ${BACAAN}`}>
          Bila kebijakan ini berubah, versi terbarunya kami tampilkan di halaman
          ini.
        </p>
      </section>
    </main>
  );
}
