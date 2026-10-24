import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test e2e (Playwright) ada di tests/e2e/ dan dijalankan terpisah lewat `pnpm test:e2e`.
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [...configDefaults.exclude, ".claude/worktrees/**"],
  },
});
