import type { AccountMetrics } from "@/server/services/reports.service";

/**
 * Sorts account metrics by a predefined order: Payroll > Cash > Savings, then usage frequency or alphabetical.
 */
export const sortAccountMetrics = (entries: [string, AccountMetrics][]): [string, AccountMetrics][] => {
  return entries.sort(([typeA], [typeB]) => {
    const order = ['payroll', 'cash', 'savings'];
    const indexA = order.indexOf(typeA.toLowerCase());
    const indexB = order.indexOf(typeB.toLowerCase());

    // If both are in the priority list, sort by index
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If only A is in list, it comes first
    if (indexA !== -1) return -1;
    // If only B is in list, it comes first
    if (indexB !== -1) return 1;

    // Otherwise alphabetical
    return typeA.localeCompare(typeB);
  });
};
