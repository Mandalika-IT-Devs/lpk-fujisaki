import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Bawaan eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Worktree buatan Claude Code dan keluaran test:
    ".claude/worktrees/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
