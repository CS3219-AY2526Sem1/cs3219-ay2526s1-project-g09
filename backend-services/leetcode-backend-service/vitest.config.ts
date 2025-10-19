import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    setupFiles: ["tests/setup-env.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "html", "lcov"],
      exclude: ["**/tests/**", "**/dist/**"],
    },
    typecheck: {
      tsconfig: "tsconfig.test.json",
    },
  },
});
