import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const serviceRole = { name: "@/lib/supabase/admin", message: "Service role: only the platform-admin invite action may use it." };
const serviceRolePattern = { group: ["**/supabase/admin"], message: serviceRole.message };
const demoFile = { name: "@/data/demo-lodge", message: "The app reads the database; demo-lodge.ts only feeds the seed (and the not-configured fallback in get-site.ts)." };
const demoPattern = { group: ["**/data/demo-lodge"], message: demoFile.message };
const ADMIN_ACTIONS = "src/app/**/(platform)/admin/actions.ts";
// get-site.ts serves the bundled demo while Supabase is not configured (until G2).
const GET_SITE = "src/data/get-site.ts";

function restrictedImports() {
  const rule = (paths, patterns) => ({ "no-restricted-imports": ["error", { paths, patterns }] });
  return [
    { files: ["src/**/*.{ts,tsx}"], ignores: [ADMIN_ACTIONS, GET_SITE, "src/lib/supabase/admin.ts"], rules: rule([serviceRole, demoFile], [serviceRolePattern, demoPattern]) },
    { files: [GET_SITE], rules: rule([serviceRole], [serviceRolePattern]) },
    { files: [ADMIN_ACTIONS], rules: rule([demoFile], [demoPattern]) },
  ];
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Guest data must never reach logs (D-033, D-049): no console in server routes.
  { files: ["src/app/**/route.ts", "src/app/**/(platform)/**", "src/lib/auth/**", "src/lib/supabase/**"], rules: { "no-console": "error" } },
  // Restricted imports (one rule, so it is configured per file group; later blocks would replace earlier ones):
  // the service-role client only in the platform-admin actions; demo-lodge.ts only feeds the seed.
  ...restrictedImports(),
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
