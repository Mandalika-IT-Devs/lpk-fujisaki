import Link from "next/link";

/** Ditampilkan dengan status 404 saat alamat halaman pendaftaran menunjuk nomor pendaftaran yang tidak ada. */
export default function PendaftaranTidakDitemukan() {
  return (
    <div className="grid max-w-[60ch] gap-3">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Pendaftaran tidak ditemukan
      </h1>
      <p>
        Tidak ada pendaftaran dengan nomor di alamat ini. Kembali ke{" "}
        <Link href="/panel/pendaftaran">daftar pendaftaran</Link>, lalu cari
        pendaftarannya menurut nama atau nomor pendaftaran.
      </p>
    </div>
  );
}
