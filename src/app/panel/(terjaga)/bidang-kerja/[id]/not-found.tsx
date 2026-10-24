import Link from "next/link";

/** Ditampilkan dengan status 404 saat alamat ubah bidang kerja menunjuk bidang kerja yang tidak ada. */
export default function BidangKerjaTidakDitemukan() {
  return (
    <div className="grid max-w-[60ch] gap-3">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Bidang kerja tidak ditemukan
      </h1>
      <p>
        Bidang kerja di alamat ini tidak ada. Kembali ke{" "}
        <Link href="/panel/bidang-kerja">daftar bidang kerja</Link>, lalu pilih
        bidang kerja yang ingin diubah.
      </p>
    </div>
  );
}
