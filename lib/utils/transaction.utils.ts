/**
 * Transaction Utilities
 * Centralizes all transaction-related operations following SOLID and DRY principles
 */

import { Transaction, TransactionType } from '../../types';

/**
 * Transaction Utility Class
 * Single Responsibility: Handles only transaction data operations
 */
export class TransactionUtils {
  /**
   * Sort transactions by date (newest first)
   */
  static sortByDateDesc(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Sort transactions by date (oldest first)
   */
  static sortByDateAsc(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Filter transactions by type
   */
  static filterByType(transactions: Transaction[], type: TransactionType): Transaction[] {
    return transactions.filter(t => t.type === type);
  }

  /**
   * Filter transactions by date range
   */
  static filterByDateRange(
    transactions: Transaction[], 
    startDate: Date, 
    endDate: Date
  ): Transaction[] {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= start && txDate <= end;
    });
  }

  /**
   * Filter transactions by account ID
   */
  static filterByAccount(transactions: Transaction[], accountId: string): Transaction[] {
    return transactions.filter(t => t.accountId === accountId);
  }

  /**
   * Filter transactions by search term
   */
  static filterBySearchTerm(transactions: Transaction[], searchTerm: string): Transaction[] {
    if (!searchTerm.trim()) return transactions;
    
    const lowercased = searchTerm.toLowerCase();
    return transactions.filter(t => 
      t.description.toLowerCase().includes(lowercased) ||
      t.category.toLowerCase().includes(lowercased)
    );
  }

  /**
   * Get recent transactions (default: last 10)
   */
  static getRecentTransactions(transactions: Transaction[], limit: number = 10): Transaction[] {
    return TransactionUtils.sortByDateDesc(transactions).slice(0, limit);
  }

  /**
   * Calculate total amount for transactions
   */
  static calculateTotal(transactions: Transaction[]): number {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Group transactions by date
   * @param transactions Array of transactions to group
   * @returns Object with date as key and array of transactions as value
   */
  static groupByDate(transactions: Transaction[]): Record<string, Transaction[]> {
    return transactions.reduce((groups, transaction) => {
      const date = transaction.date.split('T')[0]; // Extract YYYY-MM-DD from ISO string
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }

  /**
   * Get grouped transactions sorted by date (most recent first)
   * @param transactions Array of transactions to group and sort
   * @returns Array of objects with date and transactions
   */
  static getGroupedTransactionsByDate(transactions: Transaction[]): Array<{ date: string; transactions: Transaction[] }> {
    const grouped = this.groupByDate(transactions);
    
    return Object.entries(grouped)
      .map(([date, txs]) => ({
        date,
        transactions: this.sortByDateDesc(txs) // Sort transactions within each group
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort groups by date desc
  }
}

/**
 * Transaction State Calculator
 * Centralizes complex transaction state calculations
 */
export class TransactionStateCalculator {
  /**
   * Calculate comprehensive transaction display data
   */
  static calculateTransactionData(
    transaction: Transaction,
    getRemainingAmount: (tx: Transaction) => number,
    isParentTransaction: (tx: Transaction) => boolean
  ) {
    const remainingAmount = getRemainingAmount(transaction);
    const isParent = isParentTransaction(transaction);
    const showRemainingAmount = transaction.isReconciled && isParent;
    const shouldBlurTransaction = transaction.isReconciled && (!isParent || remainingAmount === 0);

    return {
      remainingAmount,
      isParent,
      showRemainingAmount,
      shouldBlurTransaction
    };
  }

  /**
   * Calculate transaction visual properties
   */
  static calculateVisualProperties(transaction: Transaction) {
    const isIncome = transaction.type === TransactionType.ENTRATA;
    
    return {
      isIncome,
      iconColor: isIncome ? 'text-green-500' : 'text-red-500',
      backgroundColor: isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900',
      amountColor: isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      icon: isIncome ? '💰' : '💸'
    };
  }
}