import type { Level } from "@/domain/statistik-lembaga";
import type { StatistikLembaga } from "@/server/statistik-lembaga";

/** Isian formulir statistik lembaga seperti yang diketik Admin, supaya isian tetap ada bila ditolak. */
export type IsianFormulirStatistik = {
  dataPer: string;
  perLevel: Record<Level, string>;
  /** Kuncinya id bidang kerja. */
  perBidangKerja: Record<number, string>;
  alumniDiJepang: string;
};

/** Isian keempat level, N5 sampai N2. */
export function isiPerLevel(
  isi: (level: Level) => string,
): Record<Level, string> {
  return { N5: isi("N5"), N4: isi("N4"), N3: isi("N3"), N2: isi("N2") };
}

/**
 * Isian formulir dari statistik yang tersimpan. Bidang kerja aktif yang belum punya angka, misalnya bidang kerja
 * yang ditambahkan sesudah statistik terakhir disimpan, dimulai kosong.
 */
export function keIsianFormulir(
  statistik: StatistikLembaga | undefined,
  bidangKerjaAktif: readonly { id: number }[],
): IsianFormulirStatistik {
  const tersimpan = new Map(
    statistik?.perBidangKerja.map((b) => [b.bidangKerjaId, b.jumlahSiswa]),
  );
  const teks = (angka: number | undefined) =>
    angka === undefined ? "" : String(angka);
  return {
    dataPer: statistik?.dataPer ?? "",
    perLevel: isiPerLevel((level) => teks(statistik?.perLevel[level])),
    perBidangKerja: Object.fromEntries(
      bidangKerjaAktif.map(({ id }) => [id, teks(tersimpan.get(id))]),
    ),
    alumniDiJepang: teks(statistik?.alumniDiJepang),
  };
}
