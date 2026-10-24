"use client";

import { useActionState } from "react";
import { IkonSeru } from "@/components/ikon";
import { TombolKirim } from "@/components/tombol";
import { masukPegawai } from "./aksi";

// Isian (docs/DESIGN.md, Inputs / Fields): tinggi 48px, border 2px garis, fokus border jalur dengan halo jalur-muda.
const GAYA_ISIAN =
  "h-12 w-full rounded-sudut border-2 border-garis bg-dasar px-3 font-medium text-navy hover:border-jalur-muda focus-visible:border-jalur focus-visible:ring-3 focus-visible:ring-jalur-muda focus-visible:outline-none";
const GAYA_LABEL = "text-body-kecil font-semibold";

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
      {keadaan.pesan && (
        <p
          role="alert"
          className="flex gap-2 rounded-sudut bg-jalur-pucat px-3.5 py-3 text-body-kecil text-navy"
        >
          <IkonSeru />
          {keadaan.pesan}
        </p>
      )}
      <TombolKirim>Masuk</TombolKirim>
    </form>
  );
}
