"use client";

import Link from "next/link";
import { useActionState } from "react";
import { TombolKirim, TombolUtama } from "@/components/tombol";
import { PANJANG_MINIMAL_KATA_SANDI } from "@/domain/akun";
import { GAYA_ISIAN, GAYA_LABEL, Kabar, Peringatan } from "../akses-pegawai";
import { aturKataSandiBaru } from "./aksi";

export function FormulirAturUlang({ token }: { token: string }) {
  const [keadaan, kirim] = useActionState(aturKataSandiBaru, {
    hasil: "belum",
  });

  if (keadaan.hasil === "berhasil") {
    return (
      <div className="grid gap-5">
        <Kabar>
          Kata sandi baru sudah disimpan, dan kata sandi lama tidak berlaku
          lagi. Masuk dengan kata sandi barumu.
        </Kabar>
        <TombolUtama href="/panel/masuk">Masuk</TombolUtama>
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
              <Link href="/panel/lupa-kata-sandi">
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
