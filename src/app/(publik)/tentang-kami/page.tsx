import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description:
    "Profil, visi dan misi, dan pimpinan LPKS Fujisaki Gakuin Center di Kesugihan, Cilacap.",
};

const JUDUL_BAGIAN =
  "max-w-[22ch] font-papan text-headline-bagian text-balance lg:text-headline-bagian-lebar";
const JUDUL_SUB = "font-papan text-title";
const BACAAN = "max-w-[60ch]";

// [CONTOH] OD-07: seluruh teks halaman ini disusun dari docs/input/profil-perusahaan.md,
// sampai lembaga menyerahkan teks resminya (T18).
export default function HalamanTentangKami() {
  return (
    <main className="wadah pt-8 pb-pad lg:pt-12 lg:pb-pad-lebar">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Tentang Kami
      </h1>
      <p className={`mt-3 text-teks-2 ${BACAAN}`}>
        LPKS Fujisaki Gakuin Center (
        <span lang="ja" className="font-jp font-bold">
          藤崎学院センター
        </span>
        ) adalah lembaga pelatihan kerja di Desa Kesugihan, Kabupaten Cilacap,
        Jawa Tengah. Lembaga ini berdiri pada Maret 2019 di bawah PT Fujisaki
        Global Inspirasi.
      </p>
      <p
        className={`mt-5 rounded-sudut bg-jalur-pucat px-3.5 py-3 text-body-kecil ${BACAAN}`}
      >
        <b className="mb-0.5 block text-keterangan font-semibold text-teks-2">
          [CONTOH]
        </b>
        Teks halaman ini masih contoh yang disusun dari profil lembaga. Teks
        resminya menyusul dari lembaga.
      </p>

      <section aria-labelledby="judul-profil" className="mt-12 lg:mt-16">
        <h2 id="judul-profil" className={JUDUL_BAGIAN}>
          Profil lembaga
        </h2>
        <div className={`mt-4 grid gap-4 ${BACAAN}`}>
          <p>
            Kami melatih anak muda dari Cilacap dan sekitarnya untuk bekerja di
            Jepang. Sejak 2019, sekitar 100 siswa belajar di sini setiap tahun.
          </p>
          <p>
            Lembaga ini juga berstatus P3MI, yaitu perusahaan penempatan pekerja
            migran Indonesia. Artinya, lembaga yang melatihmu adalah lembaga
            yang sama yang memberangkatkanmu ke Jepang, jadi kamu tidak
            berpindah tangan.
          </p>
          <h3 className={`mt-4 ${JUDUL_SUB}`}>Bidang kegiatan</h3>
          <ul className="grid list-disc gap-2 pl-5 marker:text-jalur">
            <li>
              Pelatihan bahasa Jepang sampai setara JFT-Basic A2 atau JLPT N4,
              bersama pengenalan budaya Jepang.
            </li>
            <li>
              Pelatihan tokutei ginou (keterampilan kerja khusus), berupa teori
              dan praktik sesuai bidang kerja.
            </li>
            <li>
              Pengiriman pekerja ke Jepang dengan visa SSW (pekerja
              berketerampilan khusus) sebagai P3MI.
            </li>
            <li>Penyaluran tenaga kerja.</li>
          </ul>
          <p>
            Penutur asli bahasa Jepang rutin datang ke kelas. Alumni kami
            bekerja dan belajar di Jepang dengan visa pemagangan, SSW, gijinkoku
            (tenaga ahli), atau pelajar.
          </p>
        </div>
      </section>

      <section aria-labelledby="judul-visi-misi" className="mt-12 lg:mt-16">
        <h2 id="judul-visi-misi" className={JUDUL_BAGIAN}>
          Visi dan misi
        </h2>
        <div className={`mt-4 grid gap-4 ${BACAAN}`}>
          <h3 className={JUDUL_SUB}>Visi</h3>
          <p>
            Menciptakan generasi muda yang unggul dan terampil, agar siap
            bersaing di industri nasional maupun internasional.
          </p>
          <h3 className={`mt-4 ${JUDUL_SUB}`}>Misi</h3>
          <ol className="grid list-decimal gap-2 pl-6 marker:font-bold marker:text-jalur">
            <li>
              Membekali siswa dengan bahasa Jepang dan pemahaman budaya Jepang.
            </li>
            <li>
              Melatih keterampilan kerja sesuai bidang kerja yang dituju,
              lengkap dengan budaya kerja Jepang.
            </li>
            <li>
              Mendampingi setiap siswa dari pendaftaran sampai berangkat ke
              Jepang, lewat enam tahap yang bisa dipantau sendiri.
            </li>
          </ol>
        </div>
      </section>

      <section aria-labelledby="judul-pimpinan" className="mt-12 lg:mt-16">
        <h2 id="judul-pimpinan" className={JUDUL_BAGIAN}>
          Pimpinan
        </h2>
        <p className={`mt-4 ${JUDUL_SUB}`}>Sugeng Yatno</p>
        <p className="mt-1 text-teks-2">Pimpinan LPKS Fujisaki Gakuin Center</p>
      </section>
    </main>
  );
}
