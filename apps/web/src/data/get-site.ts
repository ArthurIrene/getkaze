import type { SiteData } from "@getkaze/core";
import { demoLodge } from "./demo-lodge";

/**
 * The business site to show. Part 1 always returns the fake demo lodge.
 * This is the one place that changes when businesses come from the database
 * and are found by domain or subdomain (days 5–7).
 */
export async function getSite(): Promise<SiteData> {
  return demoLodge;
}
