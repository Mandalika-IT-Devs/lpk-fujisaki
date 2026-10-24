import type { Kontak } from "@/server/kontak";

/** Isian formulir kontak lembaga seperti yang diketik Admin, supaya isian tetap ada bila ditolak. */
export type IsianFormulirKontak = {
  alamat: string;
  nomorWhatsApp: string;
  email: string;
  tautanPeta: string;
};

/** Isian formulir dari kontak yang tersimpan; isian yang belum diisi dimulai kosong. */
export function keIsianFormulir(
  kontak: Kontak | undefined,
): IsianFormulirKontak {
  return {
    alamat: kontak?.alamat ?? "",
    nomorWhatsApp: kontak?.nomorWhatsApp ?? "",
    email: kontak?.email ?? "",
    tautanPeta: kontak?.tautanPeta ?? "",
  };
}
