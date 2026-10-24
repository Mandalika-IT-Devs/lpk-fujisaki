"use client";

import { useActionState } from "react";
import { IkonPanahBawah } from "@/components/ikon";
import { TombolKirim } from "@/components/tombol";
import { GAYA_ISIAN, GAYA_LABEL } from "../../akses-pegawai";
import { buatAkun } from "./aksi";
import { PesanTindakan } from "./pesan-tindakan";

/** Formulir Admin untuk membuat akun pegawai dengan nama, email, dan peran (PRD §5.5). */
export function FormulirBuatAkun() {
  const [keadaan, kirim] = useActionState(buatAkun, {
    pesan: null,
    isian: { nama: "", email: "", peran: "staf" },
  });

  return (
    <form action={kirim} className="grid max-w-md gap-5">
      <div className="grid gap-1">
        <label htmlFor="nama" className={GAYA_LABEL}>
          Nama
        </label>
        <input
          id="nama"
          name="nama"
          type="text"
          autoComplete="off"
          required
          defaultValue={keadaan.isian.nama}
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
          autoComplete="off"
          required
          defaultValue={keadaan.isian.email}
          className={GAYA_ISIAN}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="peran" className={GAYA_LABEL}>
          Peran
        </label>
        {/* Select dengan panah navy di kanan (docs/DESIGN.md, Inputs / Fields). */}
        <div className="relative">
          <select
            id="peran"
            name="peran"
            required
            defaultValue={keadaan.isian.peran}
            className={`${GAYA_ISIAN} cursor-pointer appearance-none pr-10`}
          >
            <option value="staf">Staf</option>
            <option value="admin">Admin</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-navy">
            <IkonPanahBawah />
          </span>
        </div>
      </div>
      <PesanTindakan pesan={keadaan.pesan} />
      <TombolKirim>Buat akun</TombolKirim>
    </form>
  );
}
