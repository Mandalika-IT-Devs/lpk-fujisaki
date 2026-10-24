import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { kirimEmail } from "./email";

describe("kirimEmail", () => {
  let kotakKeluar: string;

  beforeEach(async () => {
    kotakKeluar = await mkdtemp(path.join(tmpdir(), "kotak-keluar-"));
    vi.stubEnv(
      "EMAIL_PENGIRIM",
      "LPKS Fujisaki Gakuin Center <no-reply@contoh.test>",
    );
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(kotakKeluar, { recursive: true, force: true });
  });

  it("menulis email ke kotak keluar berkas bila EMAIL_KOTAK_KELUAR diisi, tanpa mengirimnya", async () => {
    vi.stubEnv("EMAIL_KOTAK_KELUAR", kotakKeluar);

    await kirimEmail({
      kepada: "staf@contoh.test",
      subjek: "Atur ulang kata sandi",
      teks: "Buka tautan ini.",
    });

    const berkas = await readdir(kotakKeluar);
    expect(berkas).toHaveLength(1);
    const email = JSON.parse(
      await readFile(path.join(kotakKeluar, berkas[0]), "utf8"),
    );
    expect(email.to).toEqual([{ address: "staf@contoh.test", name: "" }]);
    expect(email.from).toEqual({
      address: "no-reply@contoh.test",
      name: "LPKS Fujisaki Gakuin Center",
    });
    expect(email.subject).toBe("Atur ulang kata sandi");
    expect(email.text).toBe("Buka tautan ini.");
  });

  it("menolak mengirim bila SMTP belum diatur, dengan pesan yang menyebut langkah berikutnya", async () => {
    vi.stubEnv("EMAIL_KOTAK_KELUAR", "");
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("SMTP_PORT", "");

    await expect(
      kirimEmail({ kepada: "staf@contoh.test", subjek: "Uji", teks: "Uji" }),
    ).rejects.toThrow(/SMTP_HOST belum diisi.*\.env/);
  });
});
