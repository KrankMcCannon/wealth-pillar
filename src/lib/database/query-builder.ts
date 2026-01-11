/**
 * Database Query Builder Interfaces
 *
 * Defines the common interface that the database adapter must implement.
 *
 * @module lib/database/query-builder
 */

/**
 * Standardized error format across all database adapters
 */
export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Standardized response format (matches Supabase response structure)
 */
export interface DatabaseResponse<T> {
  data: T | null;
  error: DatabaseError | null;
}

/**
 * Query Builder interface for SELECT queries
 * Supports chainable operations like Supabase
 * Extends PromiseLike to allow direct awaiting
 */
export interface QueryBuilder<T> extends PromiseLike<DatabaseResponse<T[]>> {
  // Selection
  select(columns?: string): QueryBuilder<T>;

  // Filtering operations
  eq(column: string, value: unknown): QueryBuilder<T>;
  neq(column: string, value: unknown): QueryBuilder<T>;
  gt(column: string, value: unknown): QueryBuilder<T>;
  gte(column: string, value: unknown): QueryBuilder<T>;
  lt(column: string, value: unknown): QueryBuilder<T>;
  lte(column: string, value: unknown): QueryBuilder<T>;
  in(column: string, values: unknown[]): QueryBuilder<T>;
  contains(column: string, value: unknown): QueryBuilder<T>;
  overlaps(column: string, values: unknown[]): QueryBuilder<T>;
  or(query: string): QueryBuilder<T>;

  // Ordering
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;

  // Execution methods
  single(): Promise<DatabaseResponse<T>>;
  maybeSingle(): Promise<DatabaseResponse<T | null>>;

  // Force execution (returns array) - replaces implicit 'then'
  execute(): Promise<DatabaseResponse<T[]>>;
}

/**
 * Insert Builder for INSERT operations
 * Extends PromiseLike to allow direct awaiting
 */
export interface InsertBuilder<T> extends PromiseLike<DatabaseResponse<T[]>> {
  select(columns?: string): InsertBuilder<T>;
  single(): Promise<DatabaseResponse<T>>;
  execute(): Promise<DatabaseResponse<T[]>>;
}

/**
 * Update Builder for UPDATE operations
 * Extends PromiseLike to allow direct awaiting
 */
export interface UpdateBuilder<T> extends PromiseLike<DatabaseResponse<T[]>> {
  eq(column: string, value: unknown): UpdateBuilder<T>;
  select(columns?: string): UpdateBuilder<T>;
  single(): Promise<DatabaseResponse<T>>;
  execute(): Promise<DatabaseResponse<T[]>>;
}

/**
 * Delete Builder for DELETE operations
 * Extends PromiseLike to allow direct awaiting
 */
export interface DeleteBuilder extends PromiseLike<DatabaseResponse<void>> {
  eq(column: string, value: unknown): DeleteBuilder;
  in(column: string, values: unknown[]): DeleteBuilder;
  execute(): Promise<DatabaseResponse<void>>;
}

/**
 * Table Query Builder - starting point for all queries
 */
export interface TableQueryBuilder<T> {
  select(columns?: string): QueryBuilder<T>;
  insert(data: Partial<T> | Partial<T>[]): InsertBuilder<T>;
  update(data: Partial<T>): UpdateBuilder<T>;
  delete(): DeleteBuilder;
}

/**
 * Main Database Client interface
 * Entry point for all database operations
 */
export interface DatabaseClient {
  from<T = unknown>(table: string): TableQueryBuilder<T>;
}
