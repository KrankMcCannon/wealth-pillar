/**
 * Card Utilities
 *
 * Shared utilities for card components
 * Follows DRY principle by centralizing common card logic
 */

/**
 * Get status variant based on progress percentage
 * Used by budget cards, goal cards, etc.
 */
export function getProgressStatus(progress: number): "success" | "warning" | "danger" {
  if (progress >= 100) return 'danger';
  if (progress >= 80) return 'warning';
  return 'success';
}

/**
 * Get status variant based on value comparison to limit
 * Used by spending cards, limit cards, etc.
 */
export function getComparisonStatus(
  value: number,
  limit: number,
  thresholds = { warning: 0.8, danger: 1.0 }
): "success" | "warning" | "danger" {
  const ratio = value / limit;
  if (ratio >= thresholds.danger) return 'danger';
  if (ratio >= thresholds.warning) return 'warning';
  return 'success';
}

/**
 * Calculate days between two dates
 */
export function calculateDaysDifference(date1: Date, date2: Date = new Date()): number {
  return Math.ceil((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get relative date label (Today, Tomorrow, X days ago, etc.)
 */
export function getRelativeDateLabel(
  date: Date,
  options: { showFuture?: boolean; showPast?: boolean; maxDays?: number } = {}
): string {
  const { showFuture = true, showPast = true, maxDays = 7 } = options;
  const days = calculateDaysDifference(date);

  if (days === 0) return 'Oggi';
  if (days === 1 && showFuture) return 'Domani';
  if (days === -1 && showPast) return 'Ieri';
  if (days < 0 && showPast) return `${Math.abs(days)} giorni fa`;
  if (days > 0 && days <= maxDays && showFuture) return `Tra ${days} giorni`;

  return date.toLocaleDateString('it-IT');
}

/**
 * Get frequency label in Italian
 */
export function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    once: 'Una volta',
    daily: 'Giornaliera',
    weekly: 'Settimanale',
    biweekly: 'Quindicinale',
    monthly: 'Mensile',
    quarterly: 'Trimestrale',
    yearly: 'Annuale',
  };
  return labels[frequency] || frequency;
}

/**
 * Get icon color based on status
 */
export function getIconColorByStatus(
  status: 'active' | 'inactive' | 'warning' | 'error' | 'overdue'
): "primary" | "warning" | "destructive" | "success" | "muted" {
  const colorMap: Record<typeof status, ReturnType<typeof getIconColorByStatus>> = {
    active: 'primary',
    inactive: 'muted',
    warning: 'warning',
    error: 'destructive',
    overdue: 'destructive',
  };
  return colorMap[status] || 'primary';
}

/**
 * Format card subtitle with truncation
 */
export function formatCardSubtitle(text: string, maxLength: number = 30): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get amount type based on transaction type and conditions
 */
export function getAmountTypeByTransaction(
  type: 'income' | 'expense' | 'transfer',
  options: { isRecurrent?: boolean; isInactive?: boolean } = {}
): "income" | "expense" | "balance" | "neutral" {
  if (options.isInactive) return 'neutral';
  if (options.isRecurrent) return 'balance';
  return type === 'income' ? 'income' : 'expense';
}
