"use client";

import { useActionState } from "react";
import { IkonSeru } from "@/components/ikon";
import { TombolKirimKedua } from "@/components/tombol";
import type { AlasanPenutupan } from "@/domain/penutupan";
import { cn } from "@/lib/utils";
import { GAYA_ISIAN, GAYA_LABEL } from "../../../akses-pegawai";
import { PesanTindakan } from "../../pesan-tindakan";
import { tutupPendaftaranDariPanel } from "./aksi";

// Isian yang salah memakai gaya yang sama seperti formulir isian pendaftaran: border navy, dan pesan di bawah isian
// dengan ikon tanda seru dan teks navy; tidak memakai oranye.
const GAYA_KETERANGAN = cn(
  GAYA_ISIAN,
  "aria-invalid:border-navy",
  "h-auto min-h-28 py-2.5",
);

const ID_ALASAN = "penutupan-alasan";
const ID_KETERANGAN = "penutupan-keterangan";

function PesanGalat({ id, teks }: { id: string; teks: string | undefined }) {
  if (!teks) return null;
  return (
    <p
      id={id}
      className="flex items-start gap-2 text-body-kecil font-medium text-navy"
    >
      <span className="mt-px">
        <IkonSeru />
      </span>
      <span>{teks}</span>
    </p>
  );
}

/**
 * Formulir pegawai untuk menutup pendaftaran Berjalan (PRD §7.5): alasan dari `pilihanAlasan` dan keterangan wajib.
 * Semua isian diperiksa di server, jadi pemeriksaan bawaan browser dimatikan supaya setiap isian yang salah ditandai
 * dengan pesan dalam bahasa Indonesia. Tombolnya tombol kedua, karena tombol utama halaman ini menyimpan isian
 * formulir pendaftaran.
 */
export function FormulirTutupPendaftaran({
  nomor,
  pilihanAlasan,
  idJudul,
}: {
  nomor: string;
  pilihanAlasan: readonly AlasanPenutupan[];
  /** Id judul bagian yang menamai formulir ini. */
  idJudul: string;
}) {
  const [keadaan, kirim] = useActionState(tutupPendaftaranDariPanel, {
    pesan: [],
    isian: { alasan: "", keterangan: "" },
    galat: {},
    versi: "awal",
  });
  const { isian, galat } = keadaan;
  const galatAlasan = `galat-${ID_ALASAN}`;
  const galatKeterangan = `galat-${ID_KETERANGAN}`;
  const penjelasKeterangan = `penjelas-${ID_KETERANGAN}`;

  return (
    <form
      action={kirim}
      noValidate
      aria-labelledby={idJudul}
      className="grid gap-6"
    >
      <input type="hidden" name="nomor" value={nomor} />
      {/* Isian dipasang ulang dengan kunci versi, supaya isian yang ditolak tetap terisi sesudah formulir diproses. */}
      <div key={keadaan.versi} className="grid gap-5">
        <div className="grid gap-1">
          <p id={ID_ALASAN} className={GAYA_LABEL}>
            Alasan penutupan
          </p>
          <div
            role="radiogroup"
            aria-labelledby={ID_ALASAN}
            aria-invalid={galat.alasan ? true : undefined}
            aria-describedby={galat.alasan ? galatAlasan : undefined}
            className="flex flex-wrap gap-x-8"
          >
            {pilihanAlasan.map((alasan) => (
              <label
                key={alasan}
                className="flex min-h-11 cursor-pointer items-center gap-3"
              >
                <input
                  type="radio"
                  name="alasan"
                  value={alasan}
                  defaultChecked={isian.alasan === alasan}
                  className="size-6 shrink-0 cursor-pointer accent-jalur"
                />
                {alasan}
              </label>
            ))}
          </div>
          <PesanGalat id={galatAlasan} teks={galat.alasan} />
        </div>
        <div className="grid gap-1">
          <label htmlFor={ID_KETERANGAN} className={GAYA_LABEL}>
            Keterangan penutupan
          </label>
          <textarea
            id={ID_KETERANGAN}
            name="keterangan"
            defaultValue={isian.keterangan}
            aria-invalid={galat.keterangan ? true : undefined}
            aria-describedby={
              galat.keterangan
                ? `${penjelasKeterangan} ${galatKeterangan}`
                : penjelasKeterangan
            }
            className={GAYA_KETERANGAN}
          />
          <p id={penjelasKeterangan} className="text-keterangan text-teks-2">
            Hanya terlihat oleh pegawai. Pemilik akun hanya melihat status
            Ditutup dan alasannya.
          </p>
          <PesanGalat id={galatKeterangan} teks={galat.keterangan} />
        </div>
      </div>
      <div className="grid gap-4">
        {keadaan.pesan.map((pesan) => (
          <PesanTindakan key={pesan.teks} pesan={pesan} />
        ))}
        <div>
          <TombolKirimKedua>Tutup pendaftaran</TombolKirimKedua>
        </div>
      </div>
    </form>
  );
}
