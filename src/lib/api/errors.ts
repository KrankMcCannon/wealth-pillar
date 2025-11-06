/**
 * Comprehensive API Error Handling System
 * Provides structured error responses with meaningful messages
 */
import { NextResponse } from 'next/server';

/**
 * Standard error codes with Italian messages
 */
export enum ErrorCode {
  // Authentication & Authorization
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELDS = 'MISSING_FIELDS',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_VALUE = 'INVALID_VALUE',

  // Database
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  DB_CONSTRAINT_ERROR = 'DB_CONSTRAINT_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Business Logic
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  INVALID_TRANSACTION_TYPE = 'INVALID_TRANSACTION_TYPE',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',

  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_PROCESSOR_ERROR = 'PAYMENT_PROCESSOR_ERROR',

  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CATEGORY_NOT_FOUND = "CATEGORY_NOT_FOUND",
}

/**
 * Error messages in Italian
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication & Authorization
  [ErrorCode.AUTH_REQUIRED]: 'Autenticazione richiesta. Effettua il login per continuare.',
  [ErrorCode.AUTH_INVALID]: 'Credenziali non valide. Verifica i tuoi dati di accesso.',
  [ErrorCode.PERMISSION_DENIED]: 'Non hai i permessi necessari per eseguire questa operazione.',
  [ErrorCode.USER_NOT_FOUND]: 'Utente non trovato nel sistema.',

  // Validation
  [ErrorCode.VALIDATION_ERROR]: 'I dati forniti non sono validi.',
  [ErrorCode.MISSING_FIELDS]: 'Campi obbligatori mancanti nella richiesta.',
  [ErrorCode.INVALID_FORMAT]: 'Il formato dei dati forniti non è corretto.',
  [ErrorCode.INVALID_VALUE]: 'Uno o più valori forniti non sono validi.',

  // Database
  [ErrorCode.DB_CONNECTION_ERROR]: 'Errore di connessione al database. Riprova più tardi.',
  [ErrorCode.DB_QUERY_ERROR]: 'Errore durante l\'esecuzione della query al database.',
  [ErrorCode.DB_CONSTRAINT_ERROR]: 'L\'operazione viola un vincolo del database.',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'La risorsa richiesta non è stata trovata.',
  [ErrorCode.RESOURCE_CONFLICT]: 'Conflitto con una risorsa esistente.',

  // Business Logic
  [ErrorCode.INSUFFICIENT_BALANCE]: 'Saldo insufficiente per completare l\'operazione.',
  [ErrorCode.BUDGET_EXCEEDED]: 'L\'operazione supererebbe il budget disponibile.',
  [ErrorCode.INVALID_TRANSACTION_TYPE]: 'Tipo di transazione non valido.',
  [ErrorCode.ACCOUNT_INACTIVE]: 'L\'account selezionato non è attivo.',

  // External Services
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'Errore nel servizio esterno. Riprova più tardi.',
  [ErrorCode.PAYMENT_PROCESSOR_ERROR]: 'Errore nel processore di pagamento.',

  // System
  [ErrorCode.INTERNAL_ERROR]: 'Si è verificato un errore interno. Il team tecnico è stato notificato.',
  [ErrorCode.NOT_IMPLEMENTED]: 'Funzionalità non ancora implementata.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Troppe richieste. Riprova tra qualche minuto.',
  [ErrorCode.CATEGORY_NOT_FOUND]: 'Categoria non trovata.',
};

/**
 * HTTP status codes for error types
 */
const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  // 401 Unauthorized
  [ErrorCode.AUTH_REQUIRED]: 401,
  [ErrorCode.AUTH_INVALID]: 401,

  // 403 Forbidden
  [ErrorCode.PERMISSION_DENIED]: 403,

  // 400 Bad Request
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.MISSING_FIELDS]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.INVALID_VALUE]: 400,
  [ErrorCode.INVALID_TRANSACTION_TYPE]: 400,

  // 404 Not Found
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.CATEGORY_NOT_FOUND]: 404,

  // 409 Conflict
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.DB_CONSTRAINT_ERROR]: 409,

  // 422 Unprocessable Entity
  [ErrorCode.INSUFFICIENT_BALANCE]: 422,
  [ErrorCode.BUDGET_EXCEEDED]: 422,
  [ErrorCode.ACCOUNT_INACTIVE]: 422,

  // 429 Too Many Requests
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  // 500 Internal Server Error
  [ErrorCode.DB_CONNECTION_ERROR]: 500,
  [ErrorCode.DB_QUERY_ERROR]: 500,
  [ErrorCode.INTERNAL_ERROR]: 500,

  // 502 Bad Gateway
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.PAYMENT_PROCESSOR_ERROR]: 502,

  // 501 Not Implemented
  [ErrorCode.NOT_IMPLEMENTED]: 501,
};

/**
 * Custom API Error class
 */
export class APIError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: unknown
  ) {
    const errorMessage = message || ERROR_MESSAGES[code];
    super(errorMessage);

    this.name = 'APIError';
    this.code = code;
    this.statusCode = ERROR_STATUS_CODES[code];
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      }
    };
  }

  /**
   * Create NextResponse with proper status code
   */
  toResponse(): NextResponse {
    return NextResponse.json(this.toJSON(), {
      status: this.statusCode,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

/**
 * Supabase error mapping
 */
export function mapSupabaseError(error: unknown): APIError {
  const supabaseError = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  // Common Supabase error codes
  switch (supabaseError.code) {
    case '23505': // unique_violation
      return new APIError(
        ErrorCode.RESOURCE_CONFLICT,
        'Un elemento con questi dati esiste già.',
        supabaseError.details
      );

    case '23503': // foreign_key_violation
      return new APIError(
        ErrorCode.DB_CONSTRAINT_ERROR,
        'Riferimento a una risorsa inesistente.',
        supabaseError.details
      );

    case '23514': // check_violation
      return new APIError(
        ErrorCode.VALIDATION_ERROR,
        'I dati non rispettano i vincoli di validità.',
        supabaseError.details
      );

    case '42P01': // undefined_table
    case '42703': // undefined_column
      return new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore nella struttura della query.',
        supabaseError.details
      );

    case 'PGRST116': // row not found
      return new APIError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'La risorsa richiesta non esiste.',
        supabaseError.details
      );

    default:
      // Check for authentication errors
      if (supabaseError.message?.includes('JWT') ||
          supabaseError.message?.includes('auth') ||
          supabaseError.message?.includes('token')) {
        return new APIError(
          ErrorCode.AUTH_INVALID,
          'Sessione non valida o scaduta.',
          supabaseError.details
        );
      }

      // Generic database error
      return new APIError(
        ErrorCode.DB_QUERY_ERROR,
        supabaseError.message || 'Errore durante l\'operazione sul database.',
        supabaseError.details
      );
  }
}

/**
 * Validation error helpers
 */
export function createValidationError(field: string, value?: unknown): APIError {
  return new APIError(
    ErrorCode.VALIDATION_ERROR,
    `Il campo "${field}" non è valido.`,
    { field, value }
  );
}

export function createMissingFieldError(fields: string[]): APIError {
  return new APIError(
    ErrorCode.MISSING_FIELDS,
    `Campi obbligatori mancanti: ${fields.join(', ')}.`,
    { missingFields: fields }
  );
}

/**
 * Business logic error helpers
 */
export function createInsufficientBalanceError(
  currentBalance: number,
  requestedAmount: number
): APIError {
  return new APIError(
    ErrorCode.INSUFFICIENT_BALANCE,
    `Saldo insufficiente. Disponibile: €${currentBalance.toFixed(2)}, richiesto: €${requestedAmount.toFixed(2)}.`,
    { currentBalance, requestedAmount }
  );
}

export function createBudgetExceededError(
  budgetLimit: number,
  currentSpent: number,
  additionalAmount: number
): APIError {
  const total = currentSpent + additionalAmount;
  return new APIError(
    ErrorCode.BUDGET_EXCEEDED,
    `Budget superato. Limite: €${budgetLimit.toFixed(2)}, totale con questa operazione: €${total.toFixed(2)}.`,
    { budgetLimit, currentSpent, additionalAmount, total }
  );
}

/**
 * Generic error wrapper to catch and format any error
 */
export function handleError(error: unknown): APIError {
  // If it's already an APIError, return as is
  if (error instanceof APIError) {
    return error;
  }

  // Handle specific error types
  if (error && typeof error === 'object') {
    // Supabase errors
    if ('code' in error || 'message' in error) {
      return mapSupabaseError(error);
    }

    // Validation errors (like Zod)
    if ('name' in error && (error as Error).name === 'ZodError') {
      const zodError = error as unknown as { issues: Array<{ path: string[]; message: string }> };
      const fields = zodError.issues.map(issue => issue.path.join('.'));
      return createMissingFieldError(fields);
    }

    // Type errors
    if (error instanceof TypeError) {
      return new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Tipo di dato non valido nella richiesta.',
        { originalError: error.message }
      );
    }

    // Syntax errors
    if (error instanceof SyntaxError) {
      return new APIError(
        ErrorCode.INVALID_FORMAT,
        'Formato JSON non valido nella richiesta.',
        { originalError: error.message }
      );
    }
  }

  // For any other error, create a generic internal error
  const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';

  return new APIError(
    ErrorCode.INTERNAL_ERROR,
    undefined, // Use default message
    { originalError: errorMessage }
  );
}

/**
 * API Route error handler wrapper
 * Use this to wrap your API route handlers
 */
export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse | R>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const result = await handler(...args);

      // If the handler returns a NextResponse, return it directly
      if (result instanceof NextResponse) {
        return result;
      }

      // Otherwise, wrap in NextResponse
      return NextResponse.json({ data: result });
    } catch (error) {
      // Log the error for debugging (remove in production if needed)
      console.error('API Error:', {
        error,
        timestamp: new Date().toISOString(),
        args: args.length > 0 ? 'present' : 'none'
      });

      // Handle and format the error
      const apiError = handleError(error);
      return apiError.toResponse();
    }
  };
}