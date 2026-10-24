// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TombolKedua, TombolKirim, TombolUtama } from "./tombol";

afterEach(cleanup);

describe("TombolUtama", () => {
  it("menuju tujuannya", () => {
    render(<TombolUtama href="/daftar">Daftar sekarang</TombolUtama>);

    const tombol = screen.getByRole("link", { name: "Daftar sekarang" });
    expect(tombol.getAttribute("href")).toBe("/daftar");
  });
});

describe("TombolKirim", () => {
  it("mengirim formulirnya", () => {
    render(
      <form>
        <TombolKirim>Masuk</TombolKirim>
      </form>,
    );

    const tombol = screen.getByRole("button", { name: "Masuk" });
    expect(tombol.getAttribute("type")).toBe("submit");
  });
});

describe("TombolKedua", () => {
  it("menuju tujuannya", () => {
    render(<TombolKedua href="/alur-program">Lihat alur program</TombolKedua>);

    const tombol = screen.getByRole("link", { name: "Lihat alur program" });
    expect(tombol.getAttribute("href")).toBe("/alur-program");
    expect(tombol.hasAttribute("aria-disabled")).toBe(false);
  });

  it("nonaktif: ditandai aria-disabled dan tidak menuju ke mana pun", () => {
    render(<TombolKedua nonaktif>Chat WhatsApp</TombolKedua>);

    const tombol = screen.getByRole("link", { name: "Chat WhatsApp" });
    expect(tombol.getAttribute("aria-disabled")).toBe("true");
    expect(tombol.hasAttribute("href")).toBe(false);
  });
});
