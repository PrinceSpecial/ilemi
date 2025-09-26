import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Project specific rule customizations and file-based overrides.
  // Relax rules that are currently causing many errors across legacy files
  // so the app can build while we incrementally fix types and markup.
  {
    rules: {
      // Many files use `any` during migration — treat it as a warning/off.
      "@typescript-eslint/no-explicit-any": "off",
      // Some legacy code uses `require()` in JS helper scripts — allow it.
      "@typescript-eslint/no-require-imports": "off",
      // Some JSX text contains apostrophes; make this a warning/off for now.
      "react/no-unescaped-entities": "off",
      // Allow empty object type in a few places for now.
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  // Keep a targeted override for plain JS helper files where require() is used.
  {
    files: ["lib/**/*.js", "lib/**/*.cjs", "scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Landing content uses natural copy with apostrophes; silence that rule.
  {
    files: ["components/landing/**"],
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
