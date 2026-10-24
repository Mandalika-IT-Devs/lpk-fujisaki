// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KodeStasiun } from "./kode-stasiun";

afterEach(cleanup);

describe("KodeStasiun", () => {
  it.each(["besar", "kecil"] as const)(
    "ukuran %s terbaca sebagai kode stasiun utuh",
    (ukuran) => {
      render(<KodeStasiun nomor="02" ukuran={ukuran} />);

      expect(screen.getByText("FG 02")).toBeTruthy();
    },
  );
});
