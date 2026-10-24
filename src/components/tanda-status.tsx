import { cn } from "@/lib/utils";

export type JenisTanda = "selesai" | "sekarang" | "belum" | "tidak-berlaku";

const BENTUK: Record<JenisTanda, string> = {
  selesai: "border-jalur bg-jalur text-dasar",
  // Penanda posisi, bukan status yang disimpan: tahap sekarang, atau langkah Belum yang menjadi berikutnya.
  sekarang:
    "border-oranye bg-dasar shadow-[0_0_0_4px_var(--color-oranye-pucat)]",
  belum: "border-jalur bg-dasar",
  "tidak-berlaku": "border-dashed border-lewat bg-dasar",
};

/**
 * Tanda status (docs/DESIGN.md, Tanda Status): bentuk dan isinya berbeda untuk setiap status,
 * jadi tidak bergantung pada warna saja. Tanda ini hanya gambar; pemakainya menulis teks statusnya,
 * terlihat atau khusus pembaca layar.
 * Ukuran 24px untuk peta mini; `kecil` 22px untuk daftar langkah dan legenda.
 */
export function TandaStatus({
  jenis,
  kecil = false,
}: {
  jenis: JenisTanda;
  kecil?: boolean;
}) {
  const ukuran =
    jenis === "tidak-berlaku"
      ? "m-0.5 size-5 border-3"
      : kecil
        ? "mt-px size-5.5 border-4"
        : "size-6 border-5";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-1 grid place-items-center rounded-bulat",
        ukuran,
        BENTUK[jenis],
      )}
    >
      {jenis === "selesai" && (
        <svg
          viewBox="0 0 24 24"
          className={kecil ? "size-3" : "size-3.5"}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12 5 5 9-10" />
        </svg>
      )}
    </span>
  );
}
