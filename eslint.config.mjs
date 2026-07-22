import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-require-imports": "off",
      "prefer-const": "off",
      "@next/next/no-assign-module-variable": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react/jsx-no-comment-textnodes": "off"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "archive/**",
    "migrate.js",
    "test_db.js",
    "test-first-runtime-flow-demonstration.mjs",
  ]),
]);

export default eslintConfig;
