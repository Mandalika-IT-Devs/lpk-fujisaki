// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TombolUtama } from "./tombol";
import { TombolWhatsApp } from "./tombol-whatsapp";

afterEach(cleanup);

// Tautan dan catatan dari PRD §3.5, issue T08, dan UAT-C5.
describe("TombolWhatsApp", () => {
  it("membuka percakapan dengan nomor kantor lewat wa.me", () => {
    render(<TombolWhatsApp nomor="6281234567890" />);

    const tombol = screen.getByRole("link", { name: "Chat WhatsApp" });
    expect(tombol.getAttribute("href")).toBe("https://wa.me/6281234567890");
    expect(tombol.hasAttribute("aria-disabled")).toBe(false);
    expect(screen.queryByText("Nomor WhatsApp kantor menyusul.")).toBeNull();
  });

  it("tanpa nomor kantor: nonaktif, tidak menuju ke mana pun, dan catatannya tampil", () => {
    render(<TombolWhatsApp nomor={null} />);

    const tombol = screen.getByRole("link", { name: "Chat WhatsApp" });
    expect(tombol.getAttribute("aria-disabled")).toBe("true");
    expect(tombol.hasAttribute("href")).toBe(false);
    expect(screen.getByText("Nomor WhatsApp kantor menyusul.")).toBeTruthy();
  });

  it("aksi lain tampil sebaris sebelum tombol WhatsApp", () => {
    render(
      <TombolWhatsApp
        nomor={null}
        aksiLain={<TombolUtama href="/daftar">Daftar sekarang</TombolUtama>}
      />,
    );

    expect(
      screen.getAllByRole("link").map((tautan) => tautan.textContent),
    ).toEqual(["Daftar sekarang", "Chat WhatsApp"]);
    expect(screen.getByText("Nomor WhatsApp kantor menyusul.")).toBeTruthy();
  });
});
