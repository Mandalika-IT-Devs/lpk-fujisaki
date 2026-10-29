"use client";

import Link from "next/link";
import { useActionState } from "react";
import { TombolKirim } from "@/components/tombol";
import { PANJANG_MINIMAL_KATA_SANDI } from "@/domain/akun";
import { GAYA_ISIAN, GAYA_LABEL, Peringatan } from "@/app/panel/akses-pegawai";
import { buatAkun } from "./aksi";

const GAYA_KETERANGAN = "text-keterangan text-teks-2";

/**
 * Formulir daftar akun calon peserta (PRD §5.1): nama lengkap, email, nomor WhatsApp, kata sandi, dan centang wajib
 * persetujuan pemrosesan data dengan tautan ke Kebijakan Privasi (§12.1). Semua isian diperiksa di server, jadi
 * pemeriksaan bawaan browser dimatikan supaya setiap penolakan memakai pesan yang sama dalam bahasa Indonesia.
 */
export function FormulirDaftarAkun() {
  const [keadaan, kirim] = useActionState(buatAkun, {
    pesan: null,
    isian: { nama: "", email: "", nomorWhatsApp: "", setuju: false },
  });
  const { isian } = keadaan;

  return (
    <form action={kirim} noValidate className="grid gap-5">
      <div className="grid gap-1">
        <label htmlFor="nama" className={GAYA_LABEL}>
          Nama lengkap
        </label>
        <input
          id="nama"
          name="nama"
          type="text"
          autoComplete="name"
          defaultValue={isian.nama}
          className={GAYA_ISIAN}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="email" className={GAYA_LABEL}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={isian.email}
          className={GAYA_ISIAN}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="nomorWhatsApp" className={GAYA_LABEL}>
          Nomor WhatsApp
        </label>
        <input
          id="nomorWhatsApp"
          name="nomorWhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-describedby="keterangan-nomor-whatsapp"
          defaultValue={isian.nomorWhatsApp}
          className={GAYA_ISIAN}
        />
        <p id="keterangan-nomor-whatsapp" className={GAYA_KETERANGAN}>
          Nomor HP Indonesia yang aktif di WhatsApp, misalnya 0812-3456-7890.
        </p>
      </div>
      <div className="grid gap-1">
        <label htmlFor="kataSandi" className={GAYA_LABEL}>
          Kata sandi
        </label>
        <input
          id="kataSandi"
          name="kataSandi"
          type="password"
          autoComplete="new-password"
          aria-describedby="keterangan-kata-sandi"
          className={GAYA_ISIAN}
        />
        <p id="keterangan-kata-sandi" className={GAYA_KETERANGAN}>
          Minimal {PANJANG_MINIMAL_KATA_SANDI} karakter.
        </p>
      </div>
      {/* Seluruh baris, termasuk celah antara kotak dan teks, adalah label setinggi minimal 44px (docs/DESIGN.md,
          Do's). Tautan di dalam label membuka Kebijakan Privasi tanpa mencentang kotak, karena label tidak meneruskan
          klik pada tautan ke kotak centangnya. */}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-body-kecil">
        <input
          name="setuju"
          type="checkbox"
          defaultChecked={isian.setuju}
          className="mt-0.5 size-6 shrink-0 cursor-pointer accent-jalur"
        />
        <span>
          Saya setuju data pribadi saya diproses lembaga sesuai{" "}
          <Link href="/kebijakan-privasi" target="_blank">
            Kebijakan Privasi
          </Link>
          .
        </span>
      </label>
      {keadaan.pesan && <Peringatan>{keadaan.pesan}</Peringatan>}
      <TombolKirim>Buat akun</TombolKirim>
    </form>
  );
}
