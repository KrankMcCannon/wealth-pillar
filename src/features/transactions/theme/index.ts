/**
 * Transaction Feature Theme Exports
 * Central export point for all theme-related utilities
 *
 * This barrel export provides a clean import path for all transaction theme utilities.
 * Import styles, tokens, and helper functions from this single entry point.
 *
 * @example
 * ```typescript
 * import { transactionStyles, transactionInteraction } from '@/features/transactions/theme';
 * ```
 */

export {
  transactionStyles,
  getTransactionTypeStyles,
  getAmountStyles,
  getIconStyles,
  getDayTotalStyles,
  getCardVariantStyles,
  getHeaderVariantStyles,
  getTotalAmountColor,
  getTransactionAmountColor,
  getTransactionIconColor,
  getTransactionBadgeColor
} from './transaction-styles';
export {
  transactionColors,
  transactionSpacing,
  transactionTypography,
  transactionComponents,
  transactionAnimations,
  transactionTypeStyles,
  transactionBreakpoints,
  transactionZIndex,
  transactionInteraction,
  groupedCardTokens,
  cardVariants,
  contextColors
} from './transaction-tokens';
