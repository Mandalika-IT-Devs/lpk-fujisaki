// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ChipStatus } from "./chip-status";

afterEach(cleanup);

describe("ChipStatus", () => {
  // PRD §7.6: status pendaftaran Berjalan, Ditutup, atau Selesai. Bedanya tidak bergantung pada warna saja, jadi
  // teks statusnya selalu terbaca (docs/DESIGN.md, Chips).
  it.each(["Berjalan", "Ditutup", "Selesai"] as const)(
    "chip %s menampilkan teks statusnya",
    (status) => {
      render(<ChipStatus status={status} />);

      expect(screen.getByText(status, { exact: true })).toBeTruthy();
    },
  );
});
