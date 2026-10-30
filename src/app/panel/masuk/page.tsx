import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { bacaAkunMasuk } from "@/app/(publik)/penjaga-akun";
import { ALAMAT_AKUN } from "@/components/tautan-situs";
import {
  bolehMembukaPanelPegawai,
  perluPesanPanelKhususPegawai,
} from "@/domain/panel-pegawai";
import { GAYA_TAUTAN, KartuAksesPegawai, Peringatan } from "../akses-pegawai";
import { masukPegawai } from "./aksi";
import { FormulirMasuk } from "./formulir-masuk";

export const metadata: Metadata = { title: "Masuk pegawai" };

/**
 * Halaman masuk pegawai. Pegawai yang sudah masuk langsung dibawa ke panel pegawai.
 * Pemilik akun yang sedang masuk, baik yang ditolak penjaga panel maupun yang baru masuk lewat formulir ini, melihat
 * pesan bahwa panel ini khusus pegawai beserta tautan ke halaman akunnya (PRD §2.2, ▶ Keputusan 2026-10-30).
 */
export default async function HalamanMasukPegawai() {
  const akunMasuk = (await bacaAkunMasuk())?.akun ?? null;
  if (akunMasuk && bolehMembukaPanelPegawai(akunMasuk)) redirect("/panel");

  return (
    <KartuAksesPegawai
      judul="Masuk pegawai"
      pengantar="Untuk Admin dan Staf lembaga. Masuk dengan email dan kata sandi akun pegawaimu."
    >
      {perluPesanPanelKhususPegawai(akunMasuk) && (
        <Peringatan>
          Panel ini khusus pegawai lembaga, jadi akunmu tidak bisa membukanya.{" "}
          <Link href={ALAMAT_AKUN}>Buka akunmu</Link> untuk mengisi formulir
          pendaftaran dan memantau pendaftaranmu.
        </Peringatan>
      )}
      <FormulirMasuk aksi={masukPegawai} />
      <p className="text-body-kecil">
        <Link href="/panel/lupa-kata-sandi" className={GAYA_TAUTAN}>
          Lupa kata sandi?
        </Link>
      </p>
    </KartuAksesPegawai>
  );
}
