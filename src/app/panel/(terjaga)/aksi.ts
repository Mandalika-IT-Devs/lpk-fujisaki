"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { ALAMAT_MASUK_PEGAWAI } from "../penjaga";

/** Keluar dari panel pegawai: sesi dihapus, lalu kembali ke halaman masuk pegawai. */
export async function keluar() {
  await auth.api.signOut({ headers: await headers() });
  redirect(ALAMAT_MASUK_PEGAWAI);
}
