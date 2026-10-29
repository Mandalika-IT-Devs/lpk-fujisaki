import type { Metadata } from "next";
import Link from "next/link";
import { GAYA_TAUTAN } from "@/app/panel/akses-pegawai";
import { aturKataSandiBaru } from "@/app/panel/atur-ulang-kata-sandi/aksi";
import { FormulirAturKataSandi } from "@/app/panel/formulir-atur-kata-sandi";
import {
  ALAMAT_LUPA_KATA_SANDI,
  ALAMAT_MASUK,
} from "@/components/tautan-situs";
import { KartuAksesAkun } from "../akses-akun";

export const metadata: Metadata = { title: "Atur kata sandi baru" };

/**
 * Tujuan tautan di email atur ulang kata sandi untuk pemilik akun (src/server/auth.ts). Token diperiksa Better Auth
 * saat kata sandi baru dikirim: tautan yang lewat 1 jam atau sudah dipakai ditolak (PRD §5.4). Sesudah disimpan,
 * semua sesi akun itu diakhiri, termasuk di browser ini (▶ Keputusan 2026-10-29), jadi pemiliknya masuk lagi.
 */
export default async function HalamanAturUlangKataSandi({
  searchParams,
}: PageProps<"/atur-ulang-kata-sandi">) {
  const { token } = await searchParams;

  return (
    <KartuAksesAkun
      judul="Atur kata sandi baru"
      pengantar="Isi kata sandi baru untuk akunmu. Sesudah disimpan, kata sandi lama tidak berlaku lagi."
    >
      <FormulirAturKataSandi
        token={typeof token === "string" ? token : ""}
        aksi={aturKataSandiBaru}
        kabarBerhasil="Kata sandi baru sudah disimpan, dan kata sandi lama tidak berlaku lagi. Masuk dengan kata sandi barumu."
        alamatMasuk={ALAMAT_MASUK}
        alamatLupaKataSandi={ALAMAT_LUPA_KATA_SANDI}
      />
      <p className="text-body-kecil">
        <Link href={ALAMAT_MASUK} className={GAYA_TAUTAN}>
          Kembali ke halaman masuk
        </Link>
      </p>
    </KartuAksesAkun>
  );
}
