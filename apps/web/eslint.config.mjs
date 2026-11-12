import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Guest data must never reach logs (D-033, D-049): no console in server routes.
  { files: ["src/app/**/route.ts", "src/app/**/(platform)/**", "src/lib/auth/**", "src/lib/supabase/**"], rules: { "no-console": "error" } },
  // The service-role client may only be imported by the platform-admin actions (owner invites).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/app/**/(platform)/admin/actions.ts", "src/lib/supabase/admin.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "@/lib/supabase/admin", message: "Service role: only the platform-admin invite action may use it." }], patterns: [{ group: ["**/supabase/admin"], message: "Service role: only the platform-admin invite action may use it." }] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
