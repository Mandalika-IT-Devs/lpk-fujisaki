import type { ReactNode } from "react";

// Ikon garis 20px, stroke 2, ujung bulat, mengikuti warna teks (docs/DESIGN.md, Shapes).
function Ikon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function IkonPanahKanan() {
  return (
    <Ikon>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Ikon>
  );
}

export function IkonPanahKiri() {
  return (
    <Ikon>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Ikon>
  );
}

/** Panah bawah pada isian pilihan (docs/DESIGN.md, Inputs / Fields: select). */
export function IkonPanahBawah() {
  return (
    <Ikon>
      <path d="m6 9 6 6 6-6" />
    </Ikon>
  );
}

export function IkonMenu() {
  return (
    <Ikon>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Ikon>
  );
}

/** Tanda seru dalam lingkaran: isian atau tindakan yang tidak memenuhi syarat. */
export function IkonSeru() {
  return (
    <Ikon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16.5h.01" />
    </Ikon>
  );
}

/** Centang: permintaan atau isian yang berhasil diproses. */
export function IkonCentang() {
  return (
    <Ikon>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Ikon>
  );
}
