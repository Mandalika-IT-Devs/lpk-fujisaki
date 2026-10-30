import type { StatusPendaftaran } from "@/domain/pendaftaran";
import { cn } from "@/lib/utils";

const BENTUK: Record<StatusPendaftaran, string> = {
  // Pil bergaris jalur dengan titik bulat 8px berwarna sama di depannya.
  Berjalan:
    "border-jalur bg-dasar text-jalur before:size-2 before:rounded-bulat before:bg-current",
  // Pil penuh jalur tanpa titik. Garisnya sewarna latar, supaya ukurannya sama dengan kedua chip bergaris.
  Selesai: "border-jalur bg-jalur text-dasar",
  // Pil bergaris teks-2 berlatar putih, tanpa titik.
  Ditutup: "border-teks-2 bg-dasar text-teks-2",
};

/**
 * Chip status pendaftaran (docs/DESIGN.md, Chips; keputusan pemilik 2026-10-30), dipakai sama di halaman akun dan
 * panel pegawai. Bedanya terlihat dari isi (bergaris atau penuh), titik, dan teks statusnya, jadi tidak bergantung
 * pada warna saja.
 */
export function ChipStatus({ status }: { status: StatusPendaftaran }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pil border-2 px-2.5 py-1.5 text-label whitespace-nowrap",
        BENTUK[status],
      )}
    >
      {status}
    </span>
  );
}
