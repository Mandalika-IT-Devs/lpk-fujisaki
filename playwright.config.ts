import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Test e2e selalu memakai .env.ci (database app_test). Override menimpa nilai dari shell,
// sehingga server e2e tidak pernah memakai database pengembangan.
config({ path: ".env.ci", override: true, quiet: true });

const port = Number(process.env.E2E_PORT || 3100);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // Mengosongkan database test, menerapkan migrasi, dan mengisi pegawai uji.
  globalSetup: "./tests/e2e/siapkan-database.ts",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /statistik-lembaga\.spec\.ts$/,
    },
    // Statistik lembaga berisi satu angka per bidang kerja aktif. Test program dan bidang kerja menambah dan
    // menonaktifkan bidang kerja, jadi test statistik baru berjalan sesudah semua test lain selesai.
    {
      name: "statistik-lembaga",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /statistik-lembaga\.spec\.ts$/,
      dependencies: ["chromium"],
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${port}`,
    // Playwright menunggu server siap sebelum globalSetup menerapkan migrasi, jadi di CI database test masih
    // kosong saat itu. Kesiapan diperiksa di halaman yang isinya dari kode dan tidak membaca database.
    url: `${baseURL}/kebijakan-privasi`,
    // Server yang sudah jalan bisa saja memuat .env pengembangan, jadi selalu mulai server sendiri.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
