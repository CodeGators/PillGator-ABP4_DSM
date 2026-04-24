import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: false
      },
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      "no-console": "off"
    }
  },
  {
    ignores: [
        "dist/**", 
        "node_modules/**",
        "jest.config.js",
        "jest.config.cjs"
    ]
  }
);