"use client";

import { useActionState } from "react";
import { TombolKirim } from "@/components/tombol";
import { GAYA_ISIAN, GAYA_LABEL, Peringatan } from "../akses-pegawai";
import { masukPegawai } from "./aksi";

export function FormulirMasuk() {
  const [keadaan, kirim] = useActionState(masukPegawai, {
    pesan: null,
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
      <div className="grid gap-1">
        <label htmlFor="kataSandi" className={GAYA_LABEL}>
          Kata sandi
        </label>
        <input
          id="kataSandi"
          name="kataSandi"
          type="password"
          autoComplete="current-password"
          required
          className={GAYA_ISIAN}
        />
      </div>
      {keadaan.pesan && <Peringatan>{keadaan.pesan}</Peringatan>}
      <TombolKirim>Masuk</TombolKirim>
    </form>
  );
}
