"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { IkonCentang, IkonPanahBawah, IkonSeru } from "@/components/ikon";
import { ALAMAT_DAFTAR, ALAMAT_MASUK } from "@/components/tautan-situs";
import { TombolUtama } from "@/components/tombol";
import {
  type HasilPeriksaBatasUsia,
  periksaBatasUsia,
} from "@/domain/batas-usia";
import type { RentangUsia } from "@/domain/program-dan-bidang-kerja";
import { formatTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GAYA_ISIAN, GAYA_LABEL } from "../panel/akses-pegawai";

/** Program aktif yang bisa dipilih di konter, beserta batas usianya. */
type ProgramDiKonter = RentangUsia & { id: number; nama: string };

type Jawaban = { jenis: "netral" | "memenuhi" | "tidak"; teks: string };

const AJAKAN =
  "Isi tanggal lahirmu untuk melihat apakah usiamu masuk rentang program.";

// Sama dengan halaman Program saat tidak ada program aktif (PRD §4.3, ▶ Keputusan 2026-10-24).
const TANPA_PROGRAM =
  "Belum ada program yang dibuka saat ini. Tanyakan program berikutnya ke kantor lembaga di Kesugihan, Cilacap.";

/** Teks jawaban dari hasil aturan domain (docs/design/prototipe/beranda.html, konter). */
function tulisJawaban(hasil: HasilPeriksaBatasUsia, nama: string): Jawaban {
  if (hasil.memenuhi) {
    return {
      jenis: "memenuhi",
      teks: `Usiamu ${hasil.usia} tahun. ${nama} menerima usia ${hasil.usiaMinimal}–${hasil.usiaMaksimal} tahun, jadi kamu bisa mendaftar.`,
    };
  }
  switch (hasil.alasan) {
    case "terlalu-muda":
      return {
        jenis: "tidak",
        teks: `Usiamu ${hasil.usia} tahun. ${nama} menerima usia ${hasil.usiaMinimal}–${hasil.usiaMaksimal} tahun. Kamu bisa mendaftar mulai ${formatTanggal(hasil.bolehMendaftarMulai)}.`,
      };
    case "terlalu-tua":
      return {
        jenis: "tidak",
        teks: `Usiamu ${hasil.usia} tahun, di atas batas ${hasil.usiaMaksimal} tahun untuk ${nama}. Tanyakan program lain di loket kami.`,
      };
    case "tanggal-lahir-tidak-benar":
      return {
        jenis: "tidak",
        teks: "Tanggal lahir belum benar. Periksa lagi tahunnya.",
      };
  }
}

/**
 * Konter "Cek usiamu, lalu daftar" di pembuka Beranda (docs/design/prototipe/beranda.html): tanggal lahir dan
 * program aktif, jawaban langsung yang diumumkan pembaca layar, tombol utama "Daftar sekarang", dan tautan Masuk.
 * Usia dihitung aturan domain batas usia (PRD §6.3) pada saat isian diubah.
 */
export function KonterCekUsia({
  daftarProgram,
}: {
  daftarProgram: readonly ProgramDiKonter[];
}) {
  const id = useId();
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [programId, setProgramId] = useState(daftarProgram[0]?.id);
  // Saat isian terakhir diubah; usia dihitung pada tanggal WIB saat itu.
  const [sekarang, setSekarang] = useState<Date>();

  const program =
    daftarProgram.find((p) => p.id === programId) ?? daftarProgram[0];
  let jawaban: Jawaban = { jenis: "netral", teks: AJAKAN };
  if (!program) {
    jawaban = { jenis: "netral", teks: TANPA_PROGRAM };
  } else if (tanggalLahir && sekarang) {
    jawaban = tulisJawaban(
      periksaBatasUsia({
        tanggalLahir,
        dikirimPada: sekarang,
        usiaMinimal: program.usiaMinimal,
        usiaMaksimal: program.usiaMaksimal,
      }),
      program.nama,
    );
  }

  return (
    <section
      aria-labelledby={`${id}-judul`}
      className="grid gap-2.5 rounded-sudut bg-jalur-pucat p-3.5 lg:gap-3 lg:px-6 lg:py-5"
    >
      <h2
        id={`${id}-judul`}
        className="font-papan text-title-konter lg:text-title-konter-lebar"
      >
        Cek usiamu, lalu daftar
      </h2>
      {program && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="grid gap-1">
            <label htmlFor={`${id}-lahir`} className={GAYA_LABEL}>
              Tanggal lahir
            </label>
            {/* Batas bawah pemilih tanggal seperti di prototipe; bukan aturan usia. */}
            <input
              id={`${id}-lahir`}
              type="date"
              min="1960-01-01"
              autoComplete="bday"
              value={tanggalLahir}
              onChange={(e) => {
                setTanggalLahir(e.target.value);
                setSekarang(new Date());
              }}
              className={cn(GAYA_ISIAN, "text-body")}
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor={`${id}-program`} className={GAYA_LABEL}>
              Program
            </label>
            {/* Select dengan panah navy di kanan (docs/DESIGN.md, Inputs / Fields). */}
            <div className="relative">
              <select
                id={`${id}-program`}
                value={program.id}
                onChange={(e) => {
                  setProgramId(Number(e.target.value));
                  setSekarang(new Date());
                }}
                className={cn(
                  GAYA_ISIAN,
                  "cursor-pointer appearance-none pr-10 text-body",
                )}
              >
                {daftarProgram.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-navy">
                <IkonPanahBawah />
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Jawaban langsung (docs/DESIGN.md, Inputs / Fields): netral teks-2; memenuhi teks navy dan ikon jalur;
          tidak memenuhi teks dan ikon navy dengan tanda seru, tanpa oranye. Tinggi minimal 50px supaya tata letak
          tidak meloncat. */}
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "flex min-h-12.5 items-start gap-2.5 text-body-kecil",
          jawaban.jenis === "netral" ? "text-teks-2" : "text-navy",
        )}
      >
        <span
          className={cn("mt-px", jawaban.jenis === "memenuhi" && "text-jalur")}
        >
          {jawaban.jenis === "memenuhi" ? <IkonCentang /> : <IkonSeru />}
        </span>
        <span>{jawaban.teks}</span>
      </p>
      <TombolUtama href={ALAMAT_DAFTAR}>Daftar sekarang</TombolUtama>
      <p className="text-keterangan text-teks-2">
        Sudah punya akun? <Link href={ALAMAT_MASUK}>Masuk</Link>.
      </p>
    </section>
  );
}
