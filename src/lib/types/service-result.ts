/**
 * Standard server action result shape (mutations that return data or error).
 */
export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};
