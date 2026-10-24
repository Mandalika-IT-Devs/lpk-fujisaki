import type { Metadata } from "next";
import { PetaJalur } from "@/components/peta-jalur";

export const metadata: Metadata = {
  title: "Alur Program",
  description:
    "Enam tahap dari pendaftaran di Cilacap sampai berangkat ke Jepang, beserta langkah di setiap tahap.",
};

/**
 * Alur Program (PRD §3.1): peta jalur yang sama dengan Beranda, ditambah daftar langkah setiap tahap (PRD §7.1).
 * Rentang guliran penanda dikalibrasi untuk Beranda; di sini peta sudah terlihat sejak awal di layar lebar,
 * jadi penanda "kamu di sini" diam di FG 01.
 */
export default function HalamanAlurProgram() {
  return (
    <main className="wadah pb-pad lg:pt-12 lg:pb-pad-lebar">
      <PetaJalur
        penandaBerjalan={false}
        kepala={
          <>
            <h1 className="max-w-[18ch] font-papan text-headline text-balance lg:max-w-none lg:text-headline-lebar">
              Alur Program
            </h1>
            <p className="mt-3 max-w-[60ch] text-teks-2">
              Semua program melewati enam tahap yang sama, dari pendaftaran di
              Cilacap sampai berangkat ke Jepang. Setiap langkah dalam satu
              tahap harus selesai, atau dinyatakan tidak berlaku untuk
              programmu, sebelum kamu pindah ke tahap berikutnya.
            </p>
          </>
        }
        isiTambahan={(tahap) => (
          <div className="mt-4 max-w-[46ch]">
            <p className="text-keterangan font-semibold text-teks-2">Langkah</p>
            <ol aria-label={`Langkah tahap ${tahap.nama}`} className="mt-1">
              {tahap.langkah.map(({ kode, nama }) => (
                <li
                  key={kode}
                  className="border-t border-garis py-2 text-body-sedang first:border-t-0"
                >
                  {nama}
                </li>
              ))}
            </ol>
          </div>
        )}
      />
    </main>
  );
}
