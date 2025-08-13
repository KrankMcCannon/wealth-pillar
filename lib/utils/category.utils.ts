/**
 * Category Utilities
 * Centralizes all category-related operations to avoid code duplication
 * Follows DRY principle and Single Responsibility Principle
 */

import { Category, CategoryOption, Transaction } from '../../types';

/**
 * Constants for category operations
 */
export const CATEGORY_CONSTANTS = {
  TRANSFER_CATEGORY: 'trasferimento',
  DEFAULT_CATEGORY: 'altro',
  ALL_CATEGORIES: 'all',
} as const;

/**
 * Category Utility Class
 * Centralizes all category-related business logic
 */
export class CategoryUtils {
  /**
   * Check if a transaction is a transfer
   */
  static isTransfer(transaction: Transaction): boolean {
    return transaction.category === CATEGORY_CONSTANTS.TRANSFER_CATEGORY;
  }

  /**
   * Check if a category string represents a transfer
   */
  static isCategoryTransfer(category: string): boolean {
    return category === CATEGORY_CONSTANTS.TRANSFER_CATEGORY;
  }

  /**
   * Get category display name with fallback logic
   */
  static getCategoryDisplayName(category: Category, categories: CategoryOption[]): string {
    if (!category) {
      return '';
    }

    const foundCategory = categories.find(c => c.name === category);
    return foundCategory ? (foundCategory.label || foundCategory.name) : category;
  }

  /**
   * Convert CategoryOption array to select options
   */
  static toSelectOptions(categories: CategoryOption[]): Array<{ value: string; label: string }> {
    return categories.map(cat => ({
      value: cat.name,
      label: cat.label || cat.name,
    }));
  }

  /**
   * Filter transactions by category
   */
  static filterByCategory<T extends { category: string }>(
    items: T[], 
    categoryFilter: string
  ): T[] {
    if (categoryFilter === CATEGORY_CONSTANTS.ALL_CATEGORIES) {
      return items;
    }
    return items.filter(item => item.category === categoryFilter);
  }

  /**
   * Filter transactions excluding transfers
   */
  static excludeTransfers<T extends { category: string }>(items: T[]): T[] {
    return items.filter(item => !CategoryUtils.isCategoryTransfer(item.category));
  }

  /**
   * Get unique categories from transactions
   */
  static getUniqueCategories<T extends { category: string }>(items: T[]): string[] {
    return [...new Set(items.map(item => item.category))].sort();
  }

  /**
   * Count transactions by category
   */
  static countByCategory<T extends { category: string }>(
    items: T[], 
    targetCategory: string
  ): number {
    return items.filter(item => item.category === targetCategory).length;
  }

  /**
   * Validate category data for forms
   */
  static validateCategoryData(data: { category?: string }): string | null {
    if (!data.category || data.category.trim() === '') {
      return 'Categoria richiesta';
    }
    return null;
  }

  /**
   * Validate transfer-specific data
   */
  static validateTransferData(data: { 
    category?: string; 
    accountId?: string; 
    toAccountId?: string; 
  }): string | null {
    if (!CategoryUtils.isCategoryTransfer(data.category || '')) {
      return null;
    }

    if (!data.toAccountId || data.toAccountId.trim() === '') {
      return 'Account di destinazione richiesto per i trasferimenti';
    }

    if (data.accountId === data.toAccountId) {
      return 'L\'account di origine e destinazione non possono essere uguali';
    }

    return null;
  }

  /**
   * Check if transaction can be linked (excludes transfers)
   */
  static canBeLinked(transaction: Transaction): boolean {
    return !CategoryUtils.isTransfer(transaction) && !transaction.isReconciled;
  }
}

/**
 * Hook-like utility functions for common category operations
 */
export const categoryOperations = {
  /**
   * Create category display function with closure
   */
  createDisplayFunction: (categories: CategoryOption[]) => 
    (category: Category) => CategoryUtils.getCategoryDisplayName(category, categories),

  /**
   * Create category filter function with closure
   */
  createFilterFunction: <T extends { category: string }>(categoryFilter: string) =>
    (items: T[]) => CategoryUtils.filterByCategory(items, categoryFilter),

  /**
   * Create transfer checker function
   */
  createTransferChecker: () => (transaction: Transaction) => CategoryUtils.isTransfer(transaction),
};
