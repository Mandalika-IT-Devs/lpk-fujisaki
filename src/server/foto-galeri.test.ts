import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { simpanFotoGaleri } from "./foto-galeri";

// Foto galeri (PRD §3.4, issue T09): hanya JPG, PNG, atau WebP yang disimpan.
describe("simpanFotoGaleri", () => {
  let folder: string;

  beforeEach(async () => {
    folder = await mkdtemp(path.join(tmpdir(), "foto-galeri-"));
    vi.stubEnv("FOLDER_FOTO_GALERI", folder);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(folder, { recursive: true, force: true });
  });

  it("menolak berkas yang bukan JPG, PNG, atau WebP tanpa menulisnya ke disk, dengan pesan yang menyebut langkah berikutnya", async () => {
    await expect(
      simpanFotoGaleri({
        judul: "Animasi GIF",
        tanggalKegiatan: "2026-09-14",
        isi: new Uint8Array([0x47, 0x49, 0x46, 0x38]),
        jenisBerkas: "image/gif",
      }),
    ).rejects.toThrow(
      /Jenis berkas image\/gif .*JPG, PNG, atau WebP.*\. Periksa .*periksaSyaratUnggahFotoGaleri.*kenaliJenisBerkas/,
    );
    expect(await readdir(folder)).toEqual([]);
  });
});
