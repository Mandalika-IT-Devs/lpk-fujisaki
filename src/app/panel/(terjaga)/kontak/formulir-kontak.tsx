"use client";

import { useActionState } from "react";
import { TombolKirim } from "@/components/tombol";
import { cn } from "@/lib/utils";
import { GAYA_ISIAN, GAYA_LABEL } from "../../akses-pegawai";
import { PesanTindakan } from "../pesan-tindakan";
import { simpanKontakLembaga } from "./aksi";
import type { IsianFormulirKontak } from "./isian-formulir";

// Isian teks panjang: gaya isian yang sama, tetapi tingginya mengikuti isi (docs/DESIGN.md, Inputs / Fields).
const GAYA_ISIAN_PANJANG = cn(GAYA_ISIAN, "h-auto min-h-28 py-2.5");
const GAYA_KETERANGAN = "text-keterangan text-teks-2";

/**
 * Formulir kontak lembaga (PRD §3.5): alamat, nomor WhatsApp kantor, email kantor, dan tautan lokasi peta. Nomor
 * WhatsApp dan tautan peta boleh dikosongkan selama belum ada.
 */
export function FormulirKontak({ awal }: { awal: IsianFormulirKontak }) {
  const [keadaan, kirim] = useActionState(simpanKontakLembaga, {
    pesan: null,
    isian: awal,
  });
  const { isian } = keadaan;

  return (
    <form action={kirim} className="grid max-w-xl gap-5">
      <div className="grid gap-1">
        <label htmlFor="alamat" className={GAYA_LABEL}>
          Alamat
        </label>
        <textarea
          id="alamat"
          name="alamat"
          required
          defaultValue={isian.alamat}
          className={GAYA_ISIAN_PANJANG}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="nomorWhatsApp" className={GAYA_LABEL}>
          Nomor WhatsApp kantor
        </label>
        <input
          id="nomorWhatsApp"
          name="nomorWhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          aria-describedby="keterangan-nomor-whatsapp"
          defaultValue={isian.nomorWhatsApp}
          className={GAYA_ISIAN}
        />
        <p id="keterangan-nomor-whatsapp" className={GAYA_KETERANGAN}>
          Nomor HP Indonesia, misalnya 0812-3456-7890. Nomor disimpan dalam
          bentuk 62…, misalnya 6281234567890. Bila dikosongkan, tombol Chat
          WhatsApp nonaktif sampai nomornya diisi.
        </p>
      </div>
      <div className="grid gap-1">
        <label htmlFor="email" className={GAYA_LABEL}>
          Email kantor
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          required
          defaultValue={isian.email}
          className={GAYA_ISIAN}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="tautanPeta" className={GAYA_LABEL}>
          Tautan lokasi peta
        </label>
        <input
          id="tautanPeta"
          name="tautanPeta"
          type="url"
          autoComplete="off"
          aria-describedby="keterangan-tautan-peta"
          defaultValue={isian.tautanPeta}
          className={GAYA_ISIAN}
        />
        <p id="keterangan-tautan-peta" className={GAYA_KETERANGAN}>
          Tautan lengkap dari aplikasi peta, yang diawali https://. Tautan ini
          menjadi &ldquo;Lihat di peta&rdquo; di halaman Kontak. Boleh
          dikosongkan selama belum ada.
        </p>
      </div>
      <PesanTindakan pesan={keadaan.pesan} />
      <TombolKirim>Simpan kontak</TombolKirim>
    </form>
  );
}
