/**
 * constants.js
 *
 * Role keys match the lowercase strings stored in dummyData users:
 *   "admin" | "parent" | "orphanage"
 *
 * ProtectedRoute and Login both use these, so they must be consistent.
 */

export const roleHome = {
  admin:     "/admin",
  parent:    "/parent",
  orphanage: "/orphanage",
  donor:     "/donor",
};

export const roleLabels = {
  admin:     "Administrator",
  parent:    "Parent",
  orphanage: "Orphanage",
  donor:     "Donor",
};

export const riskClasses = {
  Low:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  Medium: "bg-amber-100  text-amber-700  dark:bg-amber-500/15  dark:text-amber-300",
  High:   "bg-red-100    text-red-700    dark:bg-red-500/15    dark:text-red-300",
};
