import Link from "next/link";

/** Ditampilkan dengan status 404 saat alamat di panel pegawai bukan menu panel. */
export default function HalamanTidakDitemukan() {
  return (
    <div className="grid max-w-[60ch] gap-3">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Halaman tidak ditemukan
      </h1>
      <p>
        Alamat ini bukan menu panel pegawai. Pilih salah satu menu, atau kembali
        ke <Link href="/panel/pendaftaran">Pendaftaran</Link>.
      </p>
    </div>
  );
}
