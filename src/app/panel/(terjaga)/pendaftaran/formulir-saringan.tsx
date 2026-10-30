import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { IkonPanahBawah } from "@/components/ikon";
import { nomorStasiun } from "@/components/kode-stasiun";
import { TombolKirimKedua } from "@/components/tombol";
import type { SaringanPendaftaran } from "@/domain/daftar-pendaftaran";
import { BIDANG_KERJA_BELUM_TAHU } from "@/domain/formulir-pendaftaran";
import { STATUS_PENDAFTARAN } from "@/domain/pendaftaran";
import { TAHAP } from "@/domain/tahap";
import { cn } from "@/lib/utils";
import { GAYA_ISIAN, GAYA_LABEL, GAYA_TAUTAN } from "../../akses-pegawai";
import {
  ALAMAT_DAFTAR_PENDAFTARAN,
  alamatDaftar,
  isianSaringan,
  NILAI_BELUM_TAHU,
} from "./saringan";

// Select memakai panah SVG navy di kanan (docs/DESIGN.md, Inputs / Fields).
const GAYA_PILIHAN = cn(GAYA_ISIAN, "cursor-pointer appearance-none pr-10");

type Pilihan = { id: number; nama: string; aktif: boolean };

/** Program dan bidang kerja nonaktif tetap bisa dipilih, karena pendaftarannya tetap tercatat (PRD §4.3). */
const namaPilihan = ({ nama, aktif }: Pilihan) =>
  aktif ? nama : `${nama} (nonaktif)`;

function PilihanSaringan({
  nama,
  label,
  semua,
  nilai,
  children,
}: {
  nama: string;
  label: string;
  semua: string;
  nilai: string;
  children: ReactNode;
}) {
  const id = `saringan-${nama}`;
  return (
    <div className="grid content-start gap-1">
      <label htmlFor={id} className={GAYA_LABEL}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={nama}
          defaultValue={nilai}
          className={GAYA_PILIHAN}
        >
          <option value="">{semua}</option>
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-navy">
          <IkonPanahBawah />
        </span>
      </div>
    </div>
  );
}

/**
 * Saringan dan pencarian daftar pendaftaran (PRD §11.1). Formulir ini mengirim isiannya lewat alamat halaman, jadi
 * hasilnya bisa dibuka ulang. Saringan bisa digabung, dan halaman kembali ke halaman 1 setiap kali diterapkan.
 */
export function FormulirSaringan({
  saringan,
  adaSaringan,
  program,
  bidangKerja,
}: {
  saringan: SaringanPendaftaran;
  adaSaringan: boolean;
  program: readonly Pilihan[];
  bidangKerja: readonly Pilihan[];
}) {
  const isian = isianSaringan(saringan);

  return (
    // Kunci dari saringannya, supaya isian ikut berganti saat saringan diubah lewat tautan, misalnya Hapus saringan.
    <Form
      key={alamatDaftar(saringan, 1)}
      action={ALAMAT_DAFTAR_PENDAFTARAN}
      role="search"
      aria-label="Saring dan cari pendaftaran"
      className="grid gap-4"
    >
      <div className="grid gap-1">
        <label htmlFor="saringan-cari" className={GAYA_LABEL}>
          Cari nama atau nomor pendaftaran
        </label>
        <input
          id="saringan-cari"
          name="cari"
          type="search"
          autoComplete="off"
          defaultValue={isian.cari}
          className={cn(GAYA_ISIAN, "max-w-xl")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PilihanSaringan
          nama="tahap"
          label="Tahap"
          semua="Semua tahap"
          nilai={isian.tahap}
        >
          {TAHAP.map(({ nomor, nama }) => (
            <option key={nomor} value={nomor}>
              FG {nomorStasiun(nomor)} {nama}
            </option>
          ))}
        </PilihanSaringan>
        <PilihanSaringan
          nama="program"
          label="Program"
          semua="Semua program"
          nilai={isian.program}
        >
          {program.map((pilihan) => (
            <option key={pilihan.id} value={pilihan.id}>
              {namaPilihan(pilihan)}
            </option>
          ))}
        </PilihanSaringan>
        <PilihanSaringan
          nama="bidang-kerja"
          label="Bidang kerja"
          semua="Semua bidang kerja"
          nilai={isian["bidang-kerja"]}
        >
          {bidangKerja.map((pilihan) => (
            <option key={pilihan.id} value={pilihan.id}>
              {namaPilihan(pilihan)}
            </option>
          ))}
          {/* Pendaftaran yang belum memilih bidang kerja (PRD §11.1, ▶ Keputusan 2026-10-30), di urutan yang sama
              seperti di formulir pendaftaran. */}
          <option value={NILAI_BELUM_TAHU}>{BIDANG_KERJA_BELUM_TAHU}</option>
        </PilihanSaringan>
        <PilihanSaringan
          nama="status"
          label="Status"
          semua="Semua status"
          nilai={isian.status}
        >
          {STATUS_PENDAFTARAN.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </PilihanSaringan>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TombolKirimKedua>Terapkan</TombolKirimKedua>
        {adaSaringan && (
          <Link
            href={ALAMAT_DAFTAR_PENDAFTARAN}
            className={cn(
              GAYA_TAUTAN,
              "rounded-sudut px-3 font-bold text-jalur no-underline hover:bg-jalur-pucat hover:text-jalur-tua",
            )}
          >
            Hapus saringan
          </Link>
        )}
      </div>
    </Form>
  );
}
