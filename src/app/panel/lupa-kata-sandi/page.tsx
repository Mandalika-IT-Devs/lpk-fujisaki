import type { Metadata } from "next";
import Link from "next/link";
import { MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM } from "@/domain/akun";
import { GAYA_TAUTAN, KartuAksesPegawai } from "../akses-pegawai";
import { FormulirLupaKataSandi } from "./formulir-lupa-kata-sandi";

export const metadata: Metadata = { title: "Lupa kata sandi" };

/** Pegawai meminta tautan atur ulang kata sandi (PRD §5.4). */
export default function HalamanLupaKataSandi() {
  return (
    <KartuAksesPegawai
      judul="Lupa kata sandi"
      pengantar={`Isi email akun pegawaimu. Kami kirim tautan untuk mengatur kata sandi baru, yang berlaku ${MASA_BERLAKU_TAUTAN_ATUR_ULANG_KATA_SANDI_JAM} jam.`}
    >
      <FormulirLupaKataSandi />
      <p className="text-body-kecil">
        <Link href="/panel/masuk" className={GAYA_TAUTAN}>
          Kembali ke halaman masuk
        </Link>
      </p>
    </KartuAksesPegawai>
  );
}
