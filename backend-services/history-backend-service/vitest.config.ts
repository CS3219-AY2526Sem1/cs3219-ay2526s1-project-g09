import { defineConfig } from "vitest/config";
import type { AliasOptions } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const alias = [
  { find: "@src", replacement: resolve(__dirname, "./src") },
] satisfies AliasOptions;

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{js,ts}"],
    globals: true,
    setupFiles: ["tests/setup-env.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "lcov"],
      exclude: ["**/tests/**", "**/dist/**"],
    },
  },
  resolve: {
    alias: [...alias],
  },
});
