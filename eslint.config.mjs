import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This app fetches data with plain useEffect + fetch (no client-side cache
      // library like SWR/React Query is installed). That's the standard
      // "setLoading(true); fetch().then(setData)" pattern used across every
      // list/report page here — safe and correct, just flagged by this newer,
      // stricter React Compiler rule. Downgraded to a warning rather than
      // rewriting every data-fetching page onto a cache library.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // .NET backend — a separate project (its own solution/build), not part of the Next.js app.
    "backend/**",
  ]),
]);

export default eslintConfig;
