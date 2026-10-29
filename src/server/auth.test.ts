import { memoryAdapter } from "better-auth/adapters/memory";
import { isAPIError } from "better-auth/api";
import { hashPassword } from "better-auth/crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buatAuth,
  kirimTautanAturKataSandiPegawaiBaru,
  kirimTautanVerifikasiEmail,
} from "./auth";
import type { Email } from "./email";

// Lupa kata sandi pegawai (PRD §5.4, issue T04): tautan atur ulang berlaku 1 jam.
// Pegawai baru (PRD §5.5, issue T05): tautan atur kata sandi berlaku 24 jam.
// Pemilik akun (PRD §5.3, §5.4, issue T11): tautan verifikasi email berlaku 24 jam, dan tautan atur ulang kata sandi
// menuju halaman atur ulang di situs publik.
// Jam disuntikkan dengan vi.setSystemTime; basis data memakai adapter memori Better Auth.

const ALAMAT_SITUS = "http://localhost:3000";
const PEGAWAI = { nama: "Staf Uji", email: "staf@contoh.test" };
const PEMILIK_AKUN = { nama: "Calon Peserta Uji", email: "calon@contoh.test" };

// Permintaan pada 24-10-2026 pukul 08.00 WIB. Batas 1 jam: 09.00 WIB.
const JAM_PERMINTAAN = new Date("2026-10-24T08:00:00+07:00");
const SEBELUM_1_JAM = new Date("2026-10-24T08:59:59+07:00");
const SESUDAH_1_JAM = new Date("2026-10-24T09:00:01+07:00");

// Akun uji diisi langsung ke basis data memori, sama seperti tests/e2e/siapkan-database.ts mengisi tabelnya.
// Pegawai baru belum punya kata sandi, jadi belum punya baris kredensial. Pemilik akun belum memverifikasi emailnya.
async function siapkan({ pegawaiBaru = false, pemilikAkun = false } = {}) {
  const id = "00000000-0000-4000-8000-000000000001";
  const dibuatPada = new Date("2026-10-01T08:00:00+07:00");
  const terkirim: Email[] = [];
  const isianAkun = pemilikAkun
    ? {
        name: PEMILIK_AKUN.nama,
        email: PEMILIK_AKUN.email,
        emailVerified: false,
        jenis: "pemilik_akun",
        peran: null,
      }
    : {
        name: PEGAWAI.nama,
        email: PEGAWAI.email,
        emailVerified: true,
        jenis: "pegawai",
        peran: "staf",
      };
  const auth = buatAuth({
    database: memoryAdapter({
      akun: [
        {
          id,
          ...isianAkun,
          image: null,
          aktif: true,
          createdAt: dibuatPada,
          updatedAt: dibuatPada,
        },
      ],
      kredensial: pegawaiBaru
        ? []
        : [
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
  return { auth, terkirim, id };
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

// Pegawai dibuat Admin pada 24-10-2026 pukul 08.00 WIB. Batas 24 jam: 25-10-2026 pukul 08.00 WIB.
const JAM_DIBUAT = new Date("2026-10-24T08:00:00+07:00");
const SEBELUM_24_JAM = new Date("2026-10-25T07:59:59+07:00");
const SESUDAH_24_JAM = new Date("2026-10-25T08:00:01+07:00");

describe("tautan atur kata sandi pegawai baru", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_URL", ALAMAT_SITUS);
    vi.stubEnv("BETTER_AUTH_SECRET", "rahasia-khusus-test-unit-0123456789");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(JAM_DIBUAT);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  /** Mengirim email atur kata sandi pegawai baru, lalu mengambil tautan dari email yang terkirim. */
  async function kirimTautan() {
    const { auth, terkirim, id } = await siapkan({ pegawaiBaru: true });
    await kirimTautanAturKataSandiPegawaiBaru(
      {
        auth,
        kirimEmail: async (email) => {
          terkirim.push(email);
        },
      },
      { id, nama: PEGAWAI.nama, email: PEGAWAI.email },
    );
    const tautan = terkirim.at(-1)?.teks.match(/https?:\/\/\S+/)?.[0];
    if (!tautan) throw new Error("Email atur kata sandi tidak berisi tautan.");
    return { auth, terkirim, tautan: new URL(tautan) };
  }

  it("pegawai baru menerima email berbahasa Indonesia berisi tautan ke halaman atur kata sandi pegawai baru", async () => {
    const { terkirim, tautan } = await kirimTautan();

    expect(terkirim).toHaveLength(1);
    expect(terkirim[0].kepada).toBe(PEGAWAI.email);
    expect(terkirim[0].subjek).toBe("Atur kata sandi akun pegawai");
    expect(terkirim[0].teks).toContain("Halo Staf Uji,");
    expect(terkirim[0].teks).toContain("berlaku 24 jam");
    expect(tautan.origin).toBe(ALAMAT_SITUS);
    expect(tautan.pathname).toBe("/panel/atur-kata-sandi");
    expect(tautan.searchParams.get("token")).toBeTruthy();
  });

  it("tautan diterima sebelum 24 jam, untuk pegawai yang belum punya kata sandi", async () => {
    const { auth, tautan } = await kirimTautan();

    vi.setSystemTime(SEBELUM_24_JAM);
    const hasil = await auth.api.resetPassword({
      body: {
        token: tautan.searchParams.get("token") ?? "",
        newPassword: "sandi-pertama-uji",
      },
    });

    expect(hasil).toEqual({ status: true });
  });

  it("tautan ditolak sesudah 24 jam", async () => {
    const { auth, tautan } = await kirimTautan();

    vi.setSystemTime(SESUDAH_24_JAM);
    const galat = await auth.api
      .resetPassword({
        body: {
          token: tautan.searchParams.get("token") ?? "",
          newPassword: "sandi-pertama-uji",
        },
      })
      .catch((e: unknown) => e);

    expect(isAPIError(galat) && galat.body?.code).toBe("INVALID_TOKEN");
  });
});

// Akun dibuat pada 24-10-2026 pukul 08.00 WIB. Batas 24 jam: 25-10-2026 pukul 08.00 WIB.
describe("tautan verifikasi email pemilik akun", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_URL", ALAMAT_SITUS);
    vi.stubEnv("BETTER_AUTH_SECRET", "rahasia-khusus-test-unit-0123456789");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(JAM_DIBUAT);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  /** Mengirim email verifikasi, lalu mengambil tautan dari email yang terkirim. */
  async function kirimTautan() {
    const { auth, terkirim } = await siapkan({ pemilikAkun: true });
    await kirimTautanVerifikasiEmail(
      {
        auth,
        kirimEmail: async (email) => {
          terkirim.push(email);
        },
      },
      PEMILIK_AKUN,
    );
    const tautan = terkirim.at(-1)?.teks.match(/https?:\/\/\S+/)?.[0];
    if (!tautan) throw new Error("Email verifikasi tidak berisi tautan.");
    return { auth, terkirim, tautan: new URL(tautan) };
  }

  async function emailTerverifikasi(auth: ReturnType<typeof buatAuth>) {
    const konteks = await auth.$context;
    const akun = await konteks.internalAdapter.findUserByEmail(
      PEMILIK_AKUN.email,
    );
    return akun?.user.emailVerified;
  }

  it("pemilik akun menerima email berbahasa Indonesia berisi tautan ke halaman verifikasi email", async () => {
    const { terkirim, tautan } = await kirimTautan();

    expect(terkirim).toHaveLength(1);
    expect(terkirim[0].kepada).toBe(PEMILIK_AKUN.email);
    expect(terkirim[0].subjek).toBe("Verifikasi email akunmu");
    expect(terkirim[0].teks).toContain("Halo Calon Peserta Uji,");
    expect(terkirim[0].teks).toContain("berlaku 24 jam");
    expect(tautan.origin).toBe(ALAMAT_SITUS);
    expect(tautan.pathname).toBe("/verifikasi-email");
    expect(tautan.searchParams.get("token")).toBeTruthy();
  });

  it("tautan diterima sebelum 24 jam, dan email menjadi terverifikasi", async () => {
    const { auth, tautan } = await kirimTautan();
    expect(await emailTerverifikasi(auth)).toBe(false);

    vi.setSystemTime(SEBELUM_24_JAM);
    await auth.api.verifyEmail({
      query: { token: tautan.searchParams.get("token") ?? "" },
    });

    expect(await emailTerverifikasi(auth)).toBe(true);
  });

  it("tautan ditolak sesudah 24 jam, dan email tetap belum terverifikasi", async () => {
    const { auth, tautan } = await kirimTautan();

    vi.setSystemTime(SESUDAH_24_JAM);
    const galat = await auth.api
      .verifyEmail({
        query: { token: tautan.searchParams.get("token") ?? "" },
      })
      .catch((e: unknown) => e);

    expect(isAPIError(galat) && galat.body?.code).toBe("TOKEN_EXPIRED");
    expect(await emailTerverifikasi(auth)).toBe(false);
  });
});

describe("lupa kata sandi pemilik akun", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_URL", ALAMAT_SITUS);
    vi.stubEnv("BETTER_AUTH_SECRET", "rahasia-khusus-test-unit-0123456789");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("tautan atur ulang menuju halaman atur ulang kata sandi di situs publik", async () => {
    const { auth, terkirim } = await siapkan({ pemilikAkun: true });

    await auth.api.requestPasswordReset({
      body: { email: PEMILIK_AKUN.email },
    });

    expect(terkirim).toHaveLength(1);
    expect(terkirim[0].kepada).toBe(PEMILIK_AKUN.email);
    expect(terkirim[0].subjek).toBe("Atur ulang kata sandi");
    const tautan = new URL(terkirim[0].teks.match(/https?:\/\/\S+/)?.[0] ?? "");
    expect(tautan.origin).toBe(ALAMAT_SITUS);
    expect(tautan.pathname).toBe("/atur-ulang-kata-sandi");
    expect(tautan.searchParams.get("token")).toBeTruthy();
  });
});
