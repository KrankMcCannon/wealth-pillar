/**
 * Error Utilities
 * Centralizza la gestione degli errori seguendo il principio DRY
 */

export enum ErrorCodes {
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE = 'DUPLICATE',
  
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Business logic errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_OPERATION = 'INVALID_OPERATION',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // Data validation errors
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_RANGE = 'INVALID_RANGE',
}

export interface ErrorDetails {
  code: ErrorCodes;
  message: string;
  field?: string;
  value?: any;
  cause?: Error;
  timestamp: string;
}

/**
 * Utility class per la gestione standardizzata degli errori
 */
export class ErrorHandler {
  /**
   * Crea un errore standardizzato
   */
  static createError(
    code: ErrorCodes,
    message: string,
    field?: string,
    value?: any,
    cause?: Error
  ): ErrorDetails {
    return {
      code,
      message,
      field,
      value,
      cause,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Estrae un messaggio di errore da un errore sconosciuto
   */
  static extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Errore sconosciuto';
  }

  /**
   * Determina il codice di errore basato sul tipo di errore
   */
  static determineErrorCode(error: unknown): ErrorCodes {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('not found')) {
        return ErrorCodes.NOT_FOUND;
      }
      if (message.includes('duplicate') || message.includes('unique')) {
        return ErrorCodes.DUPLICATE;
      }
      if (message.includes('unauthorized') || message.includes('permission')) {
        return ErrorCodes.UNAUTHORIZED;
      }
      if (message.includes('validation') || message.includes('invalid')) {
        return ErrorCodes.VALIDATION_ERROR;
      }
    }
    
    return ErrorCodes.UNKNOWN_ERROR;
  }

  /**
   * Crea un errore standardizzato da un errore generico
   */
  static fromError(error: unknown, context?: string): ErrorDetails {
    const message = this.extractMessage(error);
    const code = this.determineErrorCode(error);
    const contextMessage = context ? `${context}: ${message}` : message;
    
    return this.createError(
      code,
      contextMessage,
      undefined,
      undefined,
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Verifica se un errore è di un tipo specifico
   */
  static isErrorOfType(error: ErrorDetails, code: ErrorCodes): boolean {
    return error.code === code;
  }

  /**
   * Converte un ErrorDetails in una stringa leggibile
   */
  static toString(error: ErrorDetails): string {
    let message = `[${error.code}] ${error.message}`;
    if (error.field) {
      message += ` (campo: ${error.field})`;
    }
    return message;
  }
}

/**
 * Decorator per la gestione automatica degli errori nei metodi
 */
export function handleErrors(context?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        const errorDetails = ErrorHandler.fromError(error, context || `${target.constructor.name}.${propertyName}`);
        throw new Error(ErrorHandler.toString(errorDetails));
      }
    };
  };
}
