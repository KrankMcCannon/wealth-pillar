/**
 * Transaction Form Validation Utilities
 * Centralizes validation logic following DRY principle
 * Single Responsibility: Handles only transaction form validation
 */

import { CategoryUtils } from './category.utils';

export interface TransactionFormData {
  description: string;
  amount: string | number;
  accountId: string;
  category: string;
  date: string;
  toAccountId?: string;
  txPersonId?: string;
  type?: any; // For EditTransactionModal compatibility
}

export interface ValidationContext {
  setError: (field: string, message: string) => void;
  validateRequired: (fields: Array<keyof TransactionFormData>) => boolean;
  clearAllErrors: () => void;
}

/**
 * Transaction Form Validator
 * Eliminates duplication between AddTransactionModal and EditTransactionModal
 */
export class TransactionFormValidator {
  /**
   * Unified validation for transaction forms
   * @param data Form data to validate
   * @param isTransfer Whether this is a transfer transaction
   * @param context Validation context with error handling functions
   * @returns true if valid, false otherwise
   */
  static validateTransactionForm(
    data: TransactionFormData,
    isTransfer: boolean,
    context: ValidationContext
  ): boolean {
    const { setError, validateRequired, clearAllErrors } = context;
    
    clearAllErrors();

    // Basic required fields validation
    const requiredFields: Array<keyof TransactionFormData> = [
      'description', 'amount', 'accountId', 'category', 'date'
    ];

    if (!validateRequired(requiredFields)) {
      return false;
    }

    // Amount validation
    const numericAmount = typeof data.amount === 'string' 
      ? parseFloat(data.amount) 
      : data.amount;
      
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('amount', 'Inserisci un importo valido e positivo');
      return false;
    }

    // Transfer validation
    if (isTransfer) {
      const transferError = CategoryUtils.validateTransferData(data);
      if (transferError) {
        setError('toAccountId', transferError);
        return false;
      }
    }

    return true;
  }

  /**
   * Validate individual field
   */
  static validateField(
    fieldName: keyof TransactionFormData,
    value: any,
    isTransfer: boolean = false
  ): string | null {
    switch (fieldName) {
      case 'description':
        if (!value?.trim()) {
          return 'La descrizione è obbligatoria';
        }
        if (value.trim().length < 2) {
          return 'La descrizione deve contenere almeno 2 caratteri';
        }
        break;
        
      case 'amount':
        const numericAmount = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numericAmount) || numericAmount <= 0) {
          return 'Inserisci un importo valido e positivo';
        }
        break;
        
      case 'accountId':
        if (!value) {
          return 'Seleziona un account';
        }
        break;
        
      case 'category':
        if (!isTransfer && !value?.trim()) {
          return 'Seleziona una categoria';
        }
        break;
        
      case 'date':
        if (!value) {
          return 'Seleziona una data';
        }
        const selectedDate = new Date(value);
        const now = new Date();
        if (selectedDate > now) {
          return 'La data non può essere nel futuro';
        }
        break;
        
      case 'toAccountId':
        if (isTransfer && !value) {
          return 'Seleziona l\'account di destinazione per il trasferimento';
        }
        break;
    }
    
    return null;
  }
}
