/**
 * @getkaze/core — shared business rules (CLAUDE.md rule 5).
 *
 * Plain TypeScript only: no React, no Next.js, no database client, so any
 * app (web now, mobile later) can import it. Empty for now; rules arrive
 * feature by feature.
 */

/** Platform settings. The product name is config, not hard-coded (D-051). */
export const platform = {
  name: "GetKaze",
  appName: "Kaze",
} as const;

export type Platform = typeof platform;
