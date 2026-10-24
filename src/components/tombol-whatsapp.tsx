import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IkonPercakapan } from "./ikon";
import { TombolKedua } from "./tombol";

/**
 * Tombol kedua "Chat WhatsApp" yang membuka percakapan dengan nomor WhatsApp kantor lewat `https://wa.me/<nomor>`
 * (PRD §3.5). Dipakai di loket Beranda, halaman Kontak, dan halaman konfirmasi pendaftaran (§6.5).
 *
 * `nomor` sudah berbentuk ternormalisasi, misalnya 6281234567890. Bila nomor kantor belum diisi, tombolnya nonaktif
 * dengan catatan "Nomor WhatsApp kantor menyusul." `aksiLain`, misalnya tombol utama "Daftar sekarang" di loket,
 * tampil sebaris sebelum tombol ini, dan catatannya tampil di bawah baris itu (prototipe Beranda, bagian loket).
 */
export function TombolWhatsApp({
  nomor,
  aksiLain,
  className,
}: {
  nomor: string | null;
  aksiLain?: ReactNode;
  className?: string;
}) {
  const isi = (
    <>
      <IkonPercakapan />
      Chat WhatsApp
    </>
  );

  return (
    <div className={cn("grid gap-2.5", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {aksiLain}
        {nomor ? (
          <TombolKedua href={`https://wa.me/${nomor}`}>{isi}</TombolKedua>
        ) : (
          <TombolKedua nonaktif>{isi}</TombolKedua>
        )}
      </div>
      {!nomor && (
        <p className="text-keterangan text-teks-2">
          Nomor WhatsApp kantor menyusul.
        </p>
      )}
    </div>
  );
}
