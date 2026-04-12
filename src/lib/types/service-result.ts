/**
 * Standard server action result shape (mutations that return data or error).
 * `errorCode` opzionale per ramificazioni lato client senza dipendere dal testo tradotto.
 */
export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
  errorCode?: string;
};
