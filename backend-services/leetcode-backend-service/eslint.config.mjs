// @ts-check

import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig(
  {
    ignores: ["eslint.config.mjs", "dist"],
  },
  {
    /**
     * Disabled for quick prototyping, but should be enabled later
     * once the codebase is more stable.
     */
    rules: {
      "no-unsafe-assignment": "off",
      "no-unsafe-call": "off",
    },
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  eslintConfigPrettier,
);
