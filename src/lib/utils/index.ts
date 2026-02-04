/**
 * React Utils Layer - Utility functions and helpers for React applications
 */
// Currency
export { formatCurrency } from './currency-formatter';

// Date & Time
export {
  toDateTime,
  toISOString,
  toDateString,
  toJSDate,
  now,
  today,
  yesterday,
  nowISO,
  todayDateString,
  formatDateSmart,
  formatDateShort,
  formatDateFull,
  formatDateWithWeekday,
  formatDateRange,
  isToday,
  isYesterday,
  isWithinDays,
  isWithinWeek,
  isWithinMonth,
  isWithinYear,
  isInRange,
  diffInDays,
  addDays,
  addMonths,
  subtractDays,
  startOf,
  endOf,
  getDaysInMonth,
  getNextOccurrenceOfDay,
  daysUntil,
  formatDaysUntil,
  type DateInput,
  type DateFormatOptions,
} from './date-utils';

// Permissions
export {
  hasRole,
  isAdmin,
  isMember,
  isSuperAdmin,
  canAccessUserData,
  canManageOtherUsers,
  getEffectiveUserId,
  getVisibleUsers,
  getSelectableUsers,
  shouldDisableUserField,
  getDefaultFormUserId,
  getUserFieldHelperText,
  filterByUserPermissions,
  requiresAdmin,
} from './permissions';

// String
export { truncateText, truncateMiddle } from './string-formatter';

// UI Variants & CN
export {
  cn,
  cardVariants,
  textVariants,
  iconContainerVariants,
  statusBadgeVariants,
  financialButtonVariants,
  progressBarVariants,
  progressFillVariants,
  transactionCardVariants,
  amountVariants,
  dividerVariants,
  // Types
  type CardVariants,
  type TextVariants,
  type IconContainerVariants,
  type StatusBadgeVariants,
  type FinancialButtonVariants,
  type ProgressBarVariants,
  type ProgressFillVariants,
  type TransactionCardVariants,
  type AmountVariants,
  type DividerVariants,
} from './ui-variants';

// Date Drawer Variants
export {
  dayButtonVariants,
  drawerContentVariants,
  monthNavButtonVariants,
  presetButtonVariants,
  calendarTriggerVariants,
  weekdayLabelVariants,
  getDayState,
  type DayButtonVariants,
  type DrawerContentVariants,
  type MonthNavButtonVariants,
  type PresetButtonVariants,
  type CalendarTriggerVariants,
  type WeekdayLabelVariants,
  type DayState,
} from './date-drawer-variants';

// Constants
export { SHIMMER_BASE, STICKY_HEADER_BASE } from './ui-constants';

// URL
export { getBaseUrl, getAbsoluteUrl, isProduction, isDevelopment } from './url-utils';

// Transaction Sorting
export {
  insertTransactionSorted,
  updateTransactionSorted,
  removeTransaction,
} from './transaction-sorting';

// Temp ID
export { getTempId } from './temp-id';
