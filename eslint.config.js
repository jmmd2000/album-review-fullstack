import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Global ignores
  {
    // docs/ is gitignored and holds local notes and design handoffs
    ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**", "apps/web/src/routeTree.gen.ts", "docs/**"],
  },

  // Base TS rules
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    rules: {
      "no-extra-boolean-cast": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["warn", { disallowTypeAnnotations: false }],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-extra-non-null-assertion": "off",
    },
  },

  // Type-aware rules, with each file checked against its own package's tsconfig
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: {
          // The web vitest config sits outside the web tsconfigs
          allowDefaultProject: ["apps/web/vitest.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // A forgotten await fails silently: the error is lost and the request carries on.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      // A switch over a union must handle every member, so adding a new one flags every switch to update.
      // A switch with a default case already handles a new member.
      "@typescript-eslint/switch-exhaustiveness-check": ["error", { considerDefaultExhaustiveForUnions: true }],
      "@typescript-eslint/no-non-null-assertion": "error",
      eqeqeq: "error",
    },
  },

  // Frontend
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },

  // Backend
  {
    files: ["apps/api/**/*.ts"],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
    },
    rules: {
      "no-console": "off",
    },
  },

  // Backend request layer: force AppError over bare throws so the error
  // handler can return the right HTTP status.
  {
    files: ["apps/api/src/api/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ThrowStatement > NewExpression[callee.name=/^(Error|TypeError|RangeError|EvalError|ReferenceError|SyntaxError|URIError|AggregateError)$/]",
          message: "Throw an AppError with a status code instead of a bare Error, so the error handler returns the right HTTP status.",
        },
      ],
    },
  },

  // Shared
  {
    files: ["packages/shared/**/*.ts"],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
    },
  },

  // Turns off the style rules Prettier already handles
  prettier
);
