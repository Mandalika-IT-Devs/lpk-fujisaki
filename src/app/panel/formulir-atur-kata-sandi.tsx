"use client";

import Link from "next/link";
import { useActionState } from "react";
import { TombolKirim, TombolUtama } from "@/components/tombol";
import { PANJANG_MINIMAL_KATA_SANDI } from "@/domain/akun";
import { GAYA_ISIAN, GAYA_LABEL, Kabar, Peringatan } from "./akses-pegawai";
import type { KeadaanAturKataSandi } from "./kata-sandi-dari-tautan";

/**
 * Formulir kata sandi dari tautan di email, untuk atur ulang kata sandi (PRD §5.4) dan pegawai baru (PRD §5.5).
 * `aksi` adalah Server Action halaman pemakainya, dan `kabarBerhasil` tampil setelah kata sandi disimpan.
 * `alamatMasuk` dan `alamatLupaKataSandi` menunjuk halaman masuk dan Lupa kata sandi yang sesuai: milik pegawai
 * di panel pegawai, atau milik pemilik akun di situs publik.
 */
export function FormulirAturKataSandi({
  token,
  aksi,
  kabarBerhasil,
  alamatMasuk,
  alamatLupaKataSandi,
}: {
  token: string;
  aksi: (
    keadaan: KeadaanAturKataSandi,
    formulir: FormData,
  ) => Promise<KeadaanAturKataSandi>;
  kabarBerhasil: string;
  alamatMasuk: string;
  alamatLupaKataSandi: string;
}) {
  const [keadaan, kirim] = useActionState(aksi, { hasil: "belum" });

  if (keadaan.hasil === "berhasil") {
    return (
      <div className="grid gap-5">
        <Kabar>{kabarBerhasil}</Kabar>
        <TombolUtama href={alamatMasuk}>Masuk</TombolUtama>
      </div>
    );
  }

  return (
    <form action={kirim} className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      <div className="grid gap-1">
        <label htmlFor="kataSandiBaru" className={GAYA_LABEL}>
          Kata sandi baru
        </label>
        <input
          id="kataSandiBaru"
          name="kataSandiBaru"
          type="password"
          autoComplete="new-password"
          required
          minLength={PANJANG_MINIMAL_KATA_SANDI}
          aria-describedby="petunjuk-kata-sandi"
          className={GAYA_ISIAN}
        />
        <p id="petunjuk-kata-sandi" className="text-keterangan text-teks-2">
          Minimal {PANJANG_MINIMAL_KATA_SANDI} karakter.
        </p>
      </div>
      {keadaan.hasil === "galat" && (
        <Peringatan>
          {keadaan.pesan}
          {keadaan.perluTautanBaru && (
            <>
              {" "}
              <Link href={alamatLupaKataSandi}>
                Buka halaman Lupa kata sandi
              </Link>
            </>
          )}
        </Peringatan>
      )}
      <TombolKirim>Simpan kata sandi</TombolKirim>
    </form>
  );
}
