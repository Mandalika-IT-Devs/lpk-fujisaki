import type { Metadata } from "next";
import Link from "next/link";
import { GAYA_TAUTAN, KartuAksesPegawai } from "../akses-pegawai";
import { FormulirAturUlang } from "./formulir-atur-ulang";

export const metadata: Metadata = { title: "Atur kata sandi baru" };

/**
 * Tujuan tautan di email atur ulang kata sandi (src/server/auth.ts). Token diperiksa Better Auth saat
 * kata sandi baru dikirim: tautan yang lewat 1 jam atau sudah dipakai ditolak (PRD §5.4).
 */
export default async function HalamanAturUlangKataSandi({
  searchParams,
}: PageProps<"/panel/atur-ulang-kata-sandi">) {
  const { token } = await searchParams;

  return (
    <KartuAksesPegawai
      judul="Atur kata sandi baru"
      pengantar="Isi kata sandi baru untuk akun pegawaimu. Sesudah disimpan, kata sandi lama tidak berlaku lagi."
    >
      <FormulirAturUlang token={typeof token === "string" ? token : ""} />
      <p className="text-body-kecil">
        <Link href="/panel/masuk" className={GAYA_TAUTAN}>
          Kembali ke halaman masuk
        </Link>
      </p>
    </KartuAksesPegawai>
  );
}
