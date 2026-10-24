import Link from "next/link";

/** Ditampilkan dengan status 403 saat Staf membuka alamat menu khusus Admin (UAT-B1). */
export default function AksesDitolak() {
  return (
    <div className="grid max-w-[60ch] gap-3">
      <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
        Akses ditolak
      </h1>
      <p>
        Halaman ini hanya untuk Admin. Kembali ke{" "}
        <Link href="/panel/pendaftaran">Pendaftaran</Link>, atau hubungi Admin
        lembaga bila kamu memerlukan halaman ini.
      </p>
    </div>
  );
}
