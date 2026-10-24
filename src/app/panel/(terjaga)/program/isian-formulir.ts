import type { Program } from "@/server/program";

/** Isian formulir program seperti yang diketik Admin, supaya isian tetap ada bila ditolak. */
export type IsianFormulirProgram = {
  nama: string;
  deskripsi: string;
  syarat: string;
  lamaPelatihan: string;
  usiaMinimal: string;
  usiaMaksimal: string;
};

/** Isian formulir tambah program. */
export const ISIAN_KOSONG: IsianFormulirProgram = {
  nama: "",
  deskripsi: "",
  syarat: "",
  lamaPelatihan: "",
  usiaMinimal: "",
  usiaMaksimal: "",
};

/** Isian formulir ubah program, diisi dari program yang tersimpan. */
export function keIsianFormulir(program: Program): IsianFormulirProgram {
  return {
    nama: program.nama,
    deskripsi: program.deskripsi,
    syarat: program.syarat,
    lamaPelatihan: program.lamaPelatihan,
    usiaMinimal: String(program.usiaMinimal),
    usiaMaksimal: String(program.usiaMaksimal),
  };
}
