import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * ESLint flat config.
 *
 * Next 16 removed `next lint`, so the presets are composed directly. The
 * ignore list keeps the linter off build output, the demo JSON store and the
 * reference imagery folder.
 */
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      ".data/**",
      "image-search/**",
      "next-env.d.ts",
      "**/*.d.ts",
    ],
  },
  ...next,
  ...nextTs,
  {
    rules: {
      // The design system leans on short uppercase HUD labels; that is intentional.
      "react/no-unescaped-entities": "off",
      // `any` appears at the JSON-store boundary, where rows are untyped by design.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Accessibility is a hard requirement of the brief (spec §43).
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/no-autofocus": "error",

      /*
       * Advisory React Compiler rules, kept as warnings on purpose.
       *
       * Every remaining `set-state-in-effect` site is a deliberate sync with an
       * external system — a scroll listener hydrating its initial value, an
       * IntersectionObserver announcing entry, a route change collapsing a
       * drawer, or a Server Action result arriving from the network. None of
       * them run with the React Compiler enabled, and rewriting them as
       * render-phase state adjustments would make the code harder to follow for
       * no measurable gain. They are warnings so new occurrences stay visible.
       *
       * `purity` and `refs`, by contrast, ARE errors: an impure call or a ref
       * read during render is a real correctness bug, and both were fixed
       * rather than suppressed (see the dwell-time stamping in ContactForm and
       * StorageCalculator).
       */
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/incompatible-library": "warn",
      "react-hooks/purity": "error",
      "react-hooks/refs": "error",
    },
  },
];
