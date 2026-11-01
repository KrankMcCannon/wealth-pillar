export const RECURRING_FREQUENCIES = ['once', 'weekly', 'biweekly', 'monthly', 'yearly'] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];
