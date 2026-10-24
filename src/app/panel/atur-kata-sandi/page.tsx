import type { Metadata } from "next";
import Link from "next/link";
import { GAYA_TAUTAN, KartuAksesPegawai } from "../akses-pegawai";
import { FormulirAturKataSandi } from "../formulir-atur-kata-sandi";
import { aturKataSandiPegawaiBaru } from "./aksi";

export const metadata: Metadata = { title: "Atur kata sandi" };

/**
 * Tujuan tautan di email untuk pegawai baru (src/server/auth.ts). Token diperiksa Better Auth saat kata sandi
 * dikirim: tautan yang lewat 24 jam atau sudah dipakai ditolak (PRD §5.5).
 */
export default async function HalamanAturKataSandiPegawaiBaru({
  searchParams,
}: PageProps<"/panel/atur-kata-sandi">) {
  const { token } = await searchParams;

  return (
    <KartuAksesPegawai
      judul="Atur kata sandi"
      pengantar="Admin lembaga sudah membuatkan akun pegawai untukmu. Isi kata sandi untuk akun itu, lalu masuk dengan email dan kata sandi ini."
    >
      <FormulirAturKataSandi
        token={typeof token === "string" ? token : ""}
        aksi={aturKataSandiPegawaiBaru}
        kabarBerhasil="Kata sandi sudah disimpan. Masuk dengan email dan kata sandimu."
      />
      <p className="text-body-kecil">
        <Link href="/panel/masuk" className={GAYA_TAUTAN}>
          Ke halaman masuk
        </Link>
      </p>
    </KartuAksesPegawai>
  );
}
