import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import vitest from "@vitest/eslint-plugin";

export default defineConfig(
  {
    ignores: ["dist", "coverage", "node_modules", "*.config.mjs"],
  },

  {
    files: ["**/*.{js,cjs,mjs}"],
    ...eslint.configs.recommended, // normal JS rules
    languageOptions: {
      sourceType: "module",
    },
  },

  ...tseslint.configs.recommendedTypeChecked,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ["**/*.test.{ts,tsx,js,jsx}", "tests/**/*.{ts,tsx,js,jsx}"],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },

  eslintConfigPrettier,
);
