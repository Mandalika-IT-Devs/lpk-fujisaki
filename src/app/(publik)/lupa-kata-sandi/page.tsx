import type { Metadata } from "next";
import Link from "next/link";
import { GAYA_TAUTAN } from "@/app/panel/akses-pegawai";
import { FormulirLupaKataSandi } from "@/app/panel/lupa-kata-sandi/formulir-lupa-kata-sandi";
import { ALAMAT_MASUK } from "@/components/tautan-situs";
import { MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM } from "@/domain/akun";
import { KartuAksesAkun } from "../akses-akun";
import { mintaTautanAturUlangAkun } from "./aksi";

export const metadata: Metadata = { title: "Lupa kata sandi" };

/** Pemilik akun meminta tautan atur ulang kata sandi (PRD §5.4). */
export default function HalamanLupaKataSandi() {
  return (
    <KartuAksesAkun
      judul="Lupa kata sandi"
      pengantar={`Isi email akunmu. Kami kirim tautan untuk mengatur kata sandi baru, yang berlaku ${MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM} jam.`}
    >
      <FormulirLupaKataSandi aksi={mintaTautanAturUlangAkun} />
      <p className="text-body-kecil">
        <Link href={ALAMAT_MASUK} className={GAYA_TAUTAN}>
          Kembali ke halaman masuk
        </Link>
      </p>
    </KartuAksesAkun>
  );
}
