"use client";

import { type FormEvent, useActionState, useState } from "react";
import { TombolKirim } from "@/components/tombol";
import {
  JENIS_BERKAS_FOTO_GALERI,
  periksaSyaratUnggahFotoGaleri,
} from "@/domain/foto-galeri";
import { GAYA_ISIAN, GAYA_LABEL } from "../../akses-pegawai";
import { type Pesan, PesanTindakan } from "../pesan-tindakan";
import { unggahFoto } from "./aksi";
import { PESAN_BERKAS_KOSONG, pesanPenolakanFoto } from "./pesan-unggah";

const GAYA_KETERANGAN = "text-keterangan text-teks-2";

// Isian berkas memakai gaya isian yang sama, dengan tombol pilih berkas bawaan browser di dalamnya.
const GAYA_ISIAN_BERKAS = `${GAYA_ISIAN} h-auto min-h-12 py-2.5 file:mr-3 file:cursor-pointer file:rounded-sudut-kecil file:border-0 file:bg-jalur-pucat file:px-3 file:py-1.5 file:font-semibold file:text-jalur`;

/** Pesan penolakan dari pemeriksaan di browser, sebelum foto dikirim ke server. */
function periksaDiBrowser(formulir: FormData): Pesan | null {
  const berkas = formulir.get("berkas");
  if (!(berkas instanceof File) || berkas.size === 0) {
    return { jenis: "peringatan", teks: PESAN_BERKAS_KOSONG };
  }
  const syarat = periksaSyaratUnggahFotoGaleri({
    jenisBerkas: berkas.type,
    ukuranByte: berkas.size,
    persetujuanOrangDiFoto: formulir.get("persetujuan") === "ya",
  });
  if (syarat.diterima) return null;
  return {
    jenis: "peringatan",
    teks: pesanPenolakanFoto(syarat.alasan, berkas.size),
  };
}

/**
 * Formulir unggah foto galeri (PRD §3.4): judul, tanggal kegiatan, berkas foto, dan centang persetujuan orang di foto.
 * Syarat unggah diperiksa di browser dulu, jadi foto yang tidak memenuhi syarat tidak perlu dikirim; server
 * memeriksanya ulang dengan aturan domain yang sama.
 */
export function FormulirUnggahFoto() {
  const [keadaan, kirim] = useActionState(unggahFoto, {
    pesan: null,
    isian: { judul: "", tanggalKegiatan: "", persetujuan: false },
  });
  const [pesanBrowser, setPesanBrowser] = useState<Pesan | null>(null);
  const { isian } = keadaan;

  function periksaSebelumDikirim(event: FormEvent<HTMLFormElement>) {
    const pesan = periksaDiBrowser(new FormData(event.currentTarget));
    if (pesan) event.preventDefault();
    setPesanBrowser(pesan);
  }

  return (
    <form
      action={kirim}
      onSubmit={periksaSebelumDikirim}
      aria-labelledby="judul-unggah-foto"
      className="grid max-w-xl gap-5"
    >
      <div className="grid gap-1">
        <label htmlFor="judul" className={GAYA_LABEL}>
          Judul
        </label>
        <input
          id="judul"
          name="judul"
          required
          autoComplete="off"
          defaultValue={isian.judul}
          className={GAYA_ISIAN}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="tanggalKegiatan" className={GAYA_LABEL}>
          Tanggal kegiatan
        </label>
        <input
          id="tanggalKegiatan"
          name="tanggalKegiatan"
          type="date"
          required
          defaultValue={isian.tanggalKegiatan}
          className={GAYA_ISIAN}
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="berkas" className={GAYA_LABEL}>
          Berkas foto
        </label>
        <input
          id="berkas"
          name="berkas"
          type="file"
          accept={JENIS_BERKAS_FOTO_GALERI.join(",")}
          aria-describedby="keterangan-berkas"
          className={GAYA_ISIAN_BERKAS}
        />
        <p id="keterangan-berkas" className={GAYA_KETERANGAN}>
          JPG, PNG, atau WebP, paling besar 5 MB. Ukuran foto dikecilkan
          otomatis saat ditampilkan.
        </p>
      </div>
      <label className="flex min-h-11 cursor-pointer items-start gap-3">
        <input
          name="persetujuan"
          type="checkbox"
          value="ya"
          defaultChecked={isian.persetujuan}
          className="mt-0.5 size-5 shrink-0 cursor-pointer"
        />
        <span className="font-semibold">
          Orang di foto sudah setuju fotonya dipublikasikan
        </span>
      </label>
      <PesanTindakan pesan={pesanBrowser ?? keadaan.pesan} />
      <TombolKirim>Unggah foto</TombolKirim>
    </form>
  );
}
