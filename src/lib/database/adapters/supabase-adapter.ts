/**
 * Supabase Database Adapter
 *
 * Thin wrapper around the native Supabase client that implements
 * the DatabaseClient interface. Mostly delegates to Supabase's native methods.
 *
 * @module lib/database/adapters/supabase-adapter
 */

import { createClient } from '@supabase/supabase-js';
import type {
  SupabaseClient,
  PostgrestSingleResponse,
  PostgrestMaybeSingleResponse,
} from '@supabase/supabase-js';
import type { Database } from '../types';
import type {
  DatabaseClient,
  DatabaseResponse,
  QueryBuilder,
  InsertBuilder,
  UpdateBuilder,
  DeleteBuilder,
  TableQueryBuilder,
  DatabaseError,
} from '../query-builder';

/**
 * Supabase implementation of DatabaseClient
 * Wraps the native Supabase client with minimal overhead
 */
export class SupabaseAdapter implements DatabaseClient {
  private readonly client: SupabaseClient<Database>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    this.client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  from<T = unknown>(table: string): TableQueryBuilder<T> {
    // Type assertion needed: table name is a runtime string but client expects literal type
    type AnyTableName = keyof Database['public']['Tables'];
    return new SupabaseTableQueryBuilder<T>(
      this.client.from(table as AnyTableName) as ReturnType<SupabaseClient<Database>['from']>
    );
  }
}

/**
 * Supabase Table Query Builder
 * Provides methods to start different types of queries
 */
class SupabaseTableQueryBuilder<T> implements TableQueryBuilder<T> {
  constructor(
    private readonly builder: ReturnType<SupabaseClient<Database>['from']>
  ) { }

  select(columns?: string): QueryBuilder<T> {
    // Type assertion needed: Supabase builder implements our chain interface
    return new SupabaseQueryBuilder<T>(
      this.builder.select(columns || '*') as unknown as SupabaseQueryChain<T>
    );
  }

  insert(data: Partial<T> | Partial<T>[]): InsertBuilder<T> {
    // Type assertion needed: bridging generic T with Database schema types
    return new SupabaseInsertBuilder<T>(
      this.builder.insert(data as unknown as Record<string, unknown>[]) as unknown as SupabaseInsertChain<T>
    );
  }

  update(data: Partial<T>): UpdateBuilder<T> {
    // Type assertion needed: bridging generic T with Database schema types
    return new SupabaseUpdateBuilder<T>(
      this.builder.update(data as unknown as Record<string, unknown>) as unknown as SupabaseUpdateChain<T>
    );
  }

  delete(): DeleteBuilder {
    // Type assertion needed: Supabase builder implements our chain interface
    return new SupabaseDeleteBuilder(
      this.builder.delete() as unknown as SupabaseDeleteChain
    );
  }
}

/**
 * Supabase error type guard
 */
interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Type helpers for Supabase builder inference
 * These describe the shape of builders without importing non-exported types
 */
type SupabaseQueryChain<T> = {
  select: (columns?: string) => SupabaseQueryChain<T>;
  eq: (column: string, value: unknown) => SupabaseQueryChain<T>;
  neq: (column: string, value: unknown) => SupabaseQueryChain<T>;
  gt: (column: string, value: unknown) => SupabaseQueryChain<T>;
  gte: (column: string, value: unknown) => SupabaseQueryChain<T>;
  lt: (column: string, value: unknown) => SupabaseQueryChain<T>;
  lte: (column: string, value: unknown) => SupabaseQueryChain<T>;
  in: (column: string, values: unknown[]) => SupabaseQueryChain<T>;
  contains: (column: string, value: unknown) => SupabaseQueryChain<T>;
  or: (query: string) => SupabaseQueryChain<T>;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryChain<T>;
  single: () => PromiseLike<PostgrestSingleResponse<T>>;
  maybeSingle: () => PromiseLike<PostgrestMaybeSingleResponse<T>>;
  then: <TResult>(
    onfulfilled?: ((value: { data: T[] | null; error: unknown }) => TResult | PromiseLike<TResult>) | null,
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ) => PromiseLike<TResult>;
};

type SupabaseInsertChain<T> = {
  select: (columns?: string) => SupabaseInsertChain<T>;
  single: () => PromiseLike<PostgrestSingleResponse<T>>;
  then: <TResult>(
    onfulfilled?: ((value: { data: T[] | null; error: unknown }) => TResult | PromiseLike<TResult>) | null,
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ) => PromiseLike<TResult>;
};

type SupabaseUpdateChain<T> = {
  eq: (column: string, value: unknown) => SupabaseUpdateChain<T>;
  select: (columns?: string) => SupabaseUpdateChain<T>;
  single: () => PromiseLike<PostgrestSingleResponse<T>>;
  then: <TResult>(
    onfulfilled?: ((value: { data: T[] | null; error: unknown }) => TResult | PromiseLike<TResult>) | null,
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ) => PromiseLike<TResult>;
};

type SupabaseDeleteChain = {
  eq: (column: string, value: unknown) => SupabaseDeleteChain;
  in: (column: string, values: unknown[]) => SupabaseDeleteChain;
  then: <TResult>(
    onfulfilled?: ((value: { error: unknown }) => TResult | PromiseLike<TResult>) | null,
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ) => PromiseLike<TResult>;
};

/**
 * Base class for Supabase builders to deduplicate common logic
 */
abstract class SupabaseBaseBuilder<TData> {
  protected abstract getChain(): PromiseLike<{ data: TData | null; error: unknown }>;

  protected normalizeResponse<R>(data: R | null, error: unknown): DatabaseResponse<R> {
    return {
      data,
      error: error ? this.normalizeError(error) : null,
    };
  }

  protected normalizeError(error: unknown): DatabaseError {
    if (isSupabaseError(error)) {
      return {
        message: error.message,
        code: error.code,
        details: error.details || error.hint,
      };
    }
    return {
      message: error instanceof Error ? error.message : 'Unknown database error',
      code: 'UNKNOWN',
    };
  }

  /**
   * Explicitly execute the builder. 
   * This replaces the implicit 'then' behavior.
   */
  async execute(): Promise<DatabaseResponse<TData>> {
    try {
      const result = await this.getChain();
      return this.normalizeResponse(result.data as TData, result.error);
    } catch (error) {
      return {
        data: null,
        error: this.normalizeError(error),
      };
    }
  }

  protected async _single<R>(promise: PromiseLike<PostgrestSingleResponse<R>>): Promise<DatabaseResponse<R>> {
    const { data, error } = await promise;
    return this.normalizeResponse(data, error);
  }

  protected async _maybeSingle<R>(promise: PromiseLike<PostgrestMaybeSingleResponse<R>>): Promise<DatabaseResponse<R | null>> {
    const { data, error } = await promise;
    return this.normalizeResponse(data, error);
  }
}

/**
 * Supabase Query Builder for SELECT operations
 * Delegates all methods to native Supabase builder
 */
class SupabaseQueryBuilder<T> extends SupabaseBaseBuilder<T[]> implements QueryBuilder<T> {
  constructor(private builder: SupabaseQueryChain<T>) {
    super();
  }

  protected getChain(): PromiseLike<{ data: T[] | null; error: unknown }> {
    return this.builder as unknown as PromiseLike<{ data: T[] | null; error: unknown }>;
  }

  select(columns?: string): QueryBuilder<T> {
    this.builder = this.builder.select(columns || '*');
    return this;
  }

  eq(column: string, value: unknown): QueryBuilder<T> {
    this.builder = this.builder.eq(column, value);
    return this;
  }

  neq(column: string, value: unknown): QueryBuilder<T> {
    this.builder = this.builder.neq(column, value);
    return this;
  }

  gt(column: string, value: unknown): QueryBuilder<T> {
    this.builder = this.builder.gt(column, value);
    return this;
  }

  gte(column: string, value: unknown): QueryBuilder<T> {
    this.builder = this.builder.gte(column, value);
    return this;
  }

  lt(column: string, value: unknown): QueryBuilder<T> {
    this.builder = this.builder.lt(column, value);
    return this;
  }

  lte(column: string, value: unknown): QueryBuilder<T> {
    this.builder = this.builder.lte(column, value);
    return this;
  }

  in(column: string, values: unknown[]): QueryBuilder<T> {
    this.builder = this.builder.in(column, values);
    return this;
  }

  contains(column: string, value: unknown): QueryBuilder<T> {
    this.builder = this.builder.contains(column, value);
    return this;
  }

  overlaps(column: string, values: unknown[]): QueryBuilder<T> {
    // Supabase doesn't have overlaps in the SupabaseQueryChain type, but it exists at runtime
    // We need to cast to access it
    (this.builder as unknown as { overlaps: (col: string, vals: unknown[]) => SupabaseQueryChain<T> })
      .overlaps(column, values);
    return this;
  }

  or(query: string): QueryBuilder<T> {
    this.builder = this.builder.or(query);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T> {
    this.builder = this.builder.order(column, options);
    return this;
  }

  async single(): Promise<DatabaseResponse<T>> {
    return this._single(this.builder.single());
  }

  async maybeSingle(): Promise<DatabaseResponse<T | null>> {
    return this._maybeSingle(this.builder.maybeSingle());
  }

  // Make the builder awaitable - returns DatabaseResponse when awaited
  then<TResult1 = DatabaseResponse<T[]>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

/**
 * Supabase Insert Builder
 */
class SupabaseInsertBuilder<T> extends SupabaseBaseBuilder<T[]> implements InsertBuilder<T> {
  constructor(private builder: SupabaseInsertChain<T>) {
    super();
  }

  protected getChain(): PromiseLike<{ data: T[] | null; error: unknown }> {
    return this.builder as unknown as PromiseLike<{ data: T[] | null; error: unknown }>;
  }

  select(columns?: string): InsertBuilder<T> {
    this.builder = this.builder.select(columns || '*');
    return this;
  }

  async single(): Promise<DatabaseResponse<T>> {
    return this._single(this.builder.single());
  }

  // Make the builder awaitable - returns DatabaseResponse when awaited
  then<TResult1 = DatabaseResponse<T[]>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

/**
 * Supabase Update Builder
 */
class SupabaseUpdateBuilder<T> extends SupabaseBaseBuilder<T[]> implements UpdateBuilder<T> {
  constructor(private builder: SupabaseUpdateChain<T>) {
    super();
  }

  protected getChain(): PromiseLike<{ data: T[] | null; error: unknown }> {
    return this.builder as unknown as PromiseLike<{ data: T[] | null; error: unknown }>;
  }

  eq(column: string, value: unknown): UpdateBuilder<T> {
    this.builder = this.builder.eq(column, value);
    return this;
  }

  select(columns?: string): UpdateBuilder<T> {
    this.builder = this.builder.select(columns || '*');
    return this;
  }

  async single(): Promise<DatabaseResponse<T>> {
    return this._single(this.builder.single());
  }

  // Make the builder awaitable - returns DatabaseResponse when awaited
  then<TResult1 = DatabaseResponse<T[]>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

/**
 * Supabase Delete Builder
 */
class SupabaseDeleteBuilder extends SupabaseBaseBuilder<void> implements DeleteBuilder {
  constructor(private builder: SupabaseDeleteChain) {
    super();
  }

  protected getChain(): PromiseLike<{ data: null; error: unknown }> {
    return this.builder as unknown as PromiseLike<{ data: null; error: unknown }>;
  }

  eq(column: string, value: unknown): DeleteBuilder {
    this.builder = this.builder.eq(column, value);
    return this;
  }

  in(column: string, values: unknown[]): DeleteBuilder {
    this.builder = this.builder.in(column, values);
    return this;
  }

  // Make the builder awaitable - returns DatabaseResponse when awaited
  then<TResult1 = DatabaseResponse<void>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResponse<void>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}
