import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Carga inicial vía fetch en useEffect (páginas del SIGC). La regla nueva
      // de React Compiler lo marca como error; se revisará al introducir un
      // data-fetching library. Hasta entonces no bloquea el CI.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
