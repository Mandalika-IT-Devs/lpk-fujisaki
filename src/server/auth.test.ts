import { memoryAdapter } from "better-auth/adapters/memory";
import { isAPIError } from "better-auth/api";
import { hashPassword } from "better-auth/crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buatAuth } from "./auth";
import type { Email } from "./email";

// Lupa kata sandi pegawai (PRD §5.4, issue T04): tautan atur ulang berlaku 1 jam.
// Jam disuntikkan dengan vi.setSystemTime; basis data memakai adapter memori Better Auth.

const ALAMAT_SITUS = "http://localhost:3000";
const PEGAWAI = { nama: "Staf Uji", email: "staf@contoh.test" };

// Permintaan pada 24-10-2026 pukul 08.00 WIB. Batas 1 jam: 09.00 WIB.
const JAM_PERMINTAAN = new Date("2026-10-24T08:00:00+07:00");
const SEBELUM_1_JAM = new Date("2026-10-24T08:59:59+07:00");
const SESUDAH_1_JAM = new Date("2026-10-24T09:00:01+07:00");

// Pegawai uji diisi langsung ke basis data memori, sama seperti tests/e2e/siapkan-database.ts mengisi tabelnya.
async function siapkan() {
  const id = "00000000-0000-4000-8000-000000000001";
  const dibuatPada = new Date("2026-10-01T08:00:00+07:00");
  const terkirim: Email[] = [];
  const auth = buatAuth({
    database: memoryAdapter({
      akun: [
        {
          id,
          name: PEGAWAI.nama,
          email: PEGAWAI.email,
          emailVerified: true,
          image: null,
          jenis: "pegawai",
          peran: "staf",
          aktif: true,
          createdAt: dibuatPada,
          updatedAt: dibuatPada,
        },
      ],
      kredensial: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          accountId: id,
          providerId: "credential",
          userId: id,
          password: await hashPassword("sandi-lama-uji"),
          createdAt: dibuatPada,
          updatedAt: dibuatPada,
        },
      ],
      sesi: [],
      verifikasi: [],
    }),
    kirimEmail: async (email) => {
      terkirim.push(email);
    },
  });
  return { auth, terkirim };
}

/** Meminta tautan atur ulang, lalu mengambil token dari tautan di email yang terkirim. */
async function mintaTautan(
  auth: ReturnType<typeof buatAuth>,
  terkirim: Email[],
) {
  await auth.api.requestPasswordReset({ body: { email: PEGAWAI.email } });
  const tautan = terkirim.at(-1)?.teks.match(/https?:\/\/\S+/)?.[0];
  if (!tautan) throw new Error("Email atur ulang tidak berisi tautan.");
  return new URL(tautan);
}

describe("lupa kata sandi pegawai", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_URL", ALAMAT_SITUS);
    vi.stubEnv("BETTER_AUTH_SECRET", "rahasia-khusus-test-unit-0123456789");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(JAM_PERMINTAAN);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("permintaan atur ulang mengirim email berbahasa Indonesia berisi tautan ke halaman atur ulang pegawai", async () => {
    const { auth, terkirim } = await siapkan();

    const tautan = await mintaTautan(auth, terkirim);

    expect(terkirim).toHaveLength(1);
    expect(terkirim[0].kepada).toBe(PEGAWAI.email);
    expect(terkirim[0].subjek).toBe("Atur ulang kata sandi");
    expect(terkirim[0].teks).toContain("Halo Staf Uji,");
    expect(terkirim[0].teks).toContain("berlaku 1 jam");
    expect(tautan.origin).toBe(ALAMAT_SITUS);
    expect(tautan.pathname).toBe("/panel/atur-ulang-kata-sandi");
    expect(tautan.searchParams.get("token")).toBeTruthy();
  });

  it("tautan diterima sebelum 1 jam", async () => {
    const { auth, terkirim } = await siapkan();
    const tautan = await mintaTautan(auth, terkirim);

    vi.setSystemTime(SEBELUM_1_JAM);
    const hasil = await auth.api.resetPassword({
      body: {
        token: tautan.searchParams.get("token") ?? "",
        newPassword: "sandi-baru-uji",
      },
    });

    expect(hasil).toEqual({ status: true });
  });

  it("tautan ditolak sesudah 1 jam", async () => {
    const { auth, terkirim } = await siapkan();
    const tautan = await mintaTautan(auth, terkirim);

    vi.setSystemTime(SESUDAH_1_JAM);
    const galat = await auth.api
      .resetPassword({
        body: {
          token: tautan.searchParams.get("token") ?? "",
          newPassword: "sandi-baru-uji",
        },
      })
      .catch((e: unknown) => e);

    expect(isAPIError(galat) && galat.body?.code).toBe("INVALID_TOKEN");
  });

  it("permintaan untuk email yang tidak terdaftar tidak mengirim email", async () => {
    const { auth, terkirim } = await siapkan();

    await auth.api.requestPasswordReset({
      body: { email: "tidak.terdaftar@contoh.test" },
    });

    expect(terkirim).toHaveLength(0);
  });
});
