// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KonterCekUsia } from "./konter-cek-usia";

afterEach(cleanup);

describe("KonterCekUsia", () => {
  it("tanpa program aktif: memberi tahu belum ada program yang dibuka, tombol Daftar sekarang tetap ada", () => {
    render(<KonterCekUsia daftarProgram={[]} />);

    expect(screen.getByRole("status").textContent).toBe(
      "Belum ada program yang dibuka saat ini. Tanyakan program berikutnya ke kantor lembaga di Kesugihan, Cilacap.",
    );
    expect(screen.queryByLabelText("Tanggal lahir")).toBeNull();
    expect(screen.queryByLabelText("Program")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Daftar sekarang" })
        .getAttribute("href"),
    ).toBe("/daftar");
  });
});
