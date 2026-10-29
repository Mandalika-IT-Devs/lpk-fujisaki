"use client";

import { useActionState } from "react";
import { TombolKirim } from "@/components/tombol";
import { GAYA_ISIAN, GAYA_LABEL, Kabar, Peringatan } from "../akses-pegawai";
import type { KeadaanLupaKataSandi } from "./aksi";

/**
 * Formulir permintaan tautan atur ulang kata sandi, untuk pegawai (halaman ini) dan pemilik akun
 * (src/app/(publik)/lupa-kata-sandi). `aksi` adalah Server Action halaman pemakainya.
 */
export function FormulirLupaKataSandi({
  aksi,
}: {
  aksi: (
    keadaan: KeadaanLupaKataSandi,
    formulir: FormData,
  ) => Promise<KeadaanLupaKataSandi>;
}) {
  const [keadaan, kirim] = useActionState(aksi, {
    hasil: "belum",
    email: "",
  });

  return (
    <form action={kirim} className="grid gap-5">
      <div className="grid gap-1">
        <label htmlFor="email" className={GAYA_LABEL}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={keadaan.email}
          className={GAYA_ISIAN}
        />
      </div>
      {keadaan.hasil === "galat" && <Peringatan>{keadaan.pesan}</Peringatan>}
      {keadaan.hasil === "diproses" && <Kabar>{keadaan.pesan}</Kabar>}
      <TombolKirim>Kirim tautan</TombolKirim>
    </form>
  );
}
