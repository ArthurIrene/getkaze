/** Modules a template cares about. Full module list arrives with the database (day 5). */
export const moduleIds = ["menu", "ordering", "booking"] as const;
export type ModuleId = (typeof moduleIds)[number];
