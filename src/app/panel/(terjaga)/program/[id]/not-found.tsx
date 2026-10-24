import Link from "next/link";

/** Ditampilkan dengan status 404 saat alamat ubah program menunjuk program yang tidak ada. */
export default function ProgramTidakDitemukan() {
  return (
    <div className="grid max-w-[60ch] gap-3">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Program tidak ditemukan
      </h1>
      <p>
        Program di alamat ini tidak ada. Kembali ke{" "}
        <Link href="/panel/program">daftar program</Link>, lalu pilih program
        yang ingin diubah.
      </p>
    </div>
  );
}
