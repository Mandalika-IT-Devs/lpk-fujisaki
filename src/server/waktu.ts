// Jam sistem dibaca di sini, lalu diteruskan ke aturan domain sebagai "sekarang" (ADR-0002, src/domain/AGENTS.md).

/** Saat ini menurut jam server. */
export function bacaSekarang(): Date {
  return new Date();
}
