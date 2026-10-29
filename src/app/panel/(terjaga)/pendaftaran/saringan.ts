import { z } from "zod";
import type { SaringanPendaftaran } from "@/domain/daftar-pendaftaran";
import { BIDANG_KERJA_BELUM_TAHU } from "@/domain/formulir-pendaftaran";
import { STATUS_PENDAFTARAN } from "@/domain/pendaftaran";
import { TAHAP } from "@/domain/tahap";
import { bacaId } from "@/lib/baca-id";

// Saringan, pencarian, dan nomor halaman daftar pendaftaran disimpan di alamat halaman (formulir GET), misalnya
// /panel/pendaftaran?tahap=1&status=Ditutup&halaman=2, supaya bisa dibuka ulang dan dibagikan antarpegawai.

/** Nilai saringan bidang kerja di alamat halaman untuk "Belum tahu". */
export const NILAI_BELUM_TAHU = "belum-tahu";

/** Parameter alamat halaman seperti yang diberikan Next.js: satu teks, beberapa teks, atau tidak ada. */
type ParameterAlamat = Record<string, string | string[] | undefined>;

/** Parameter yang diulang, misalnya ?tahap=1&tahap=2, dibaca nilai pertamanya. */
const nilaiPertama = (nilai: unknown) =>
  Array.isArray(nilai) ? nilai[0] : nilai;

/** Parameter yang tidak ada atau tidak sah dibaca sebagai tidak diisi. */
const parameter = <T extends z.ZodType>(skema: T) =>
  z.preprocess(nilaiPertama, skema.optional()).catch(undefined);

/** Id program atau bidang kerja; undefined bila teksnya bukan id. */
const id = z.unknown().transform(bacaId);

const SKEMA = z.object({
  cari: parameter(z.string().trim().min(1)),
  tahap: parameter(
    z.enum(TAHAP.map(({ nomor }) => String(nomor))).transform(Number),
  ),
  program: parameter(id),
  "bidang-kerja": parameter(
    z.union([
      z
        .literal(NILAI_BELUM_TAHU)
        .transform(
          (): typeof BIDANG_KERJA_BELUM_TAHU => BIDANG_KERJA_BELUM_TAHU,
        ),
      id,
    ]),
  ),
  status: parameter(z.enum(STATUS_PENDAFTARAN)),
  halaman: parameter(id),
});

/** Saringan, pencarian, dan nomor halaman daftar pendaftaran dari alamat halaman. */
export function bacaSaringan(parameterAlamat: ParameterAlamat): {
  saringan: SaringanPendaftaran;
  halaman: number;
} {
  const dibaca = SKEMA.parse(parameterAlamat);
  return {
    saringan: {
      cari: dibaca.cari,
      tahap: dibaca.tahap,
      programId: dibaca.program,
      bidangKerja: dibaca["bidang-kerja"],
      status: dibaca.status,
    },
    halaman: dibaca.halaman ?? 1,
  };
}

export const ALAMAT_DAFTAR_PENDAFTARAN = "/panel/pendaftaran";

/** Nilai isian formulir saringan untuk sebuah saringan, dengan nama isian yang sama seperti parameter alamatnya. */
export function isianSaringan(saringan: SaringanPendaftaran) {
  const teks = (nilai: number | string | undefined) =>
    nilai === undefined ? "" : String(nilai);
  return {
    cari: saringan.cari ?? "",
    tahap: teks(saringan.tahap),
    program: teks(saringan.programId),
    "bidang-kerja":
      saringan.bidangKerja === BIDANG_KERJA_BELUM_TAHU
        ? NILAI_BELUM_TAHU
        : teks(saringan.bidangKerja),
    status: saringan.status ?? "",
  };
}

/** Alamat sebuah halaman daftar pendaftaran beserta saringan dan pencariannya. Halaman 1 tidak ditulis. */
export function alamatDaftar(
  saringan: SaringanPendaftaran,
  halaman: number,
): string {
  const parameterAlamat = new URLSearchParams(
    Object.entries(isianSaringan(saringan)).filter(([, nilai]) => nilai !== ""),
  );
  if (halaman > 1) parameterAlamat.set("halaman", String(halaman));
  const teks = parameterAlamat.toString();
  return teks
    ? `${ALAMAT_DAFTAR_PENDAFTARAN}?${teks}`
    : ALAMAT_DAFTAR_PENDAFTARAN;
}
