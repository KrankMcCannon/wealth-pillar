/**
 * JSON Server Database Adapter
 *
 * Translates Supabase-style query builder calls into REST API requests to json-server.
 * Supports basic filtering, ordering, and CRUD operations.
 * Complex operations (or, contains on arrays) use client-side filtering.
 *
 * @module lib/database/adapters/json-server-adapter
 */

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
 * JSON Server implementation of DatabaseClient
 * Translates queries to REST API calls
 */
export class JsonServerAdapter implements DatabaseClient {
  constructor(private readonly baseUrl: string) { }

  from<T = unknown>(table: string): TableQueryBuilder<T> {
    return new JsonServerTableQueryBuilder<T>(this.baseUrl, table);
  }
}

/**
 * JSON Server Table Query Builder
 */
class JsonServerTableQueryBuilder<T> implements TableQueryBuilder<T> {
  constructor(
    private readonly baseUrl: string,
    private readonly table: string
  ) { }

  select(): QueryBuilder<T> {
    // json-server always returns all columns, ignore select parameter
    return new JsonServerQueryBuilder<T>(this.baseUrl, this.table);
  }

  insert(data: Partial<T> | Partial<T>[]): InsertBuilder<T> {
    return new JsonServerInsertBuilder<T>(this.baseUrl, this.table, data);
  }

  update(data: Partial<T>): UpdateBuilder<T> {
    return new JsonServerUpdateBuilder<T>(this.baseUrl, this.table, data);
  }

  delete(): DeleteBuilder {
    return new JsonServerDeleteBuilder(this.baseUrl, this.table);
  }
}

/**
 * Base class for JSON Server builders to deduplicate common logic
 */
abstract class JsonServerBaseBuilder<TData> {
  /**
   * Execute the actual network request.
   */
  abstract execute(): Promise<DatabaseResponse<TData>>;

  protected async _single<TSingle>(): Promise<DatabaseResponse<TSingle>> {
    const response = await this.execute();
    if (response.error) return { data: null, error: response.error };

    const data = response.data;
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return {
        data: null,
        error: { message: 'Not found', code: '404' },
      };
    }

    const item = Array.isArray(data) ? data[0] : data;
    return { data: item as TSingle, error: null };
  }

  protected async _maybeSingle<TSingle>(): Promise<DatabaseResponse<TSingle | null>> {
    const response = await this.execute();
    if (response.error) return { data: null, error: response.error };

    const data = response.data;
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return { data: null, error: null };
    }

    const item = Array.isArray(data) ? data[0] : data;
    return { data: item as TSingle, error: null };
  }

  protected normalizeError(error: unknown): DatabaseError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'NETWORK_ERROR',
      };
    }
    return {
      message: 'Unknown error',
      code: 'UNKNOWN',
    };
  }
}

/**
 * JSON Server Query Builder for SELECT operations
 */
class JsonServerQueryBuilder<T> extends JsonServerBaseBuilder<T[]> implements QueryBuilder<T> {
  private readonly filters: Map<string, unknown> = new Map();
  private orderBy?: { column: string; order: 'asc' | 'desc' };
  private readonly clientFilters: Array<{
    type: 'or' | 'contains' | 'overlaps';
    value: unknown;
  }> = [];

  constructor(
    private readonly baseUrl: string,
    private readonly table: string
  ) {
    super();
  }

  select(): QueryBuilder<T> {
    // json-server returns all columns, ignore
    return this;
  }

  eq(column: string, value: unknown): QueryBuilder<T> {
    this.filters.set(column, value);
    return this;
  }

  neq(column: string, value: unknown): QueryBuilder<T> {
    this.filters.set(`${column}_ne`, value);
    return this;
  }

  gt(column: string, value: unknown): QueryBuilder<T> {
    this.filters.set(`${column}_gt`, value);
    return this;
  }

  gte(column: string, value: unknown): QueryBuilder<T> {
    this.filters.set(`${column}_gte`, value);
    return this;
  }

  lt(column: string, value: unknown): QueryBuilder<T> {
    this.filters.set(`${column}_lt`, value);
    return this;
  }

  lte(column: string, value: unknown): QueryBuilder<T> {
    this.filters.set(`${column}_lte`, value);
    return this;
  }

  in(column: string, values: unknown[]): QueryBuilder<T> {
    // json-server doesn't support IN, use client-side filtering
    this.clientFilters.push({
      type: 'or',
      value: { column, values },
    });
    return this;
  }

  contains(column: string, value: unknown): QueryBuilder<T> {
    // For array fields, use client-side filtering
    this.clientFilters.push({
      type: 'contains',
      value: { column, value },
    });
    return this;
  }

  overlaps(column: string, values: unknown[]): QueryBuilder<T> {
    // json-server doesn't support overlaps, use client-side filtering
    this.clientFilters.push({
      type: 'overlaps',
      value: { column, values },
    });
    return this;
  }

  or(query: string): QueryBuilder<T> {
    // json-server doesn't support OR, use client-side filtering
    this.clientFilters.push({
      type: 'or',
      value: query,
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T> {
    this.orderBy = {
      column,
      order: options?.ascending === false ? 'desc' : 'asc',
    };
    return this;
  }

  async single(): Promise<DatabaseResponse<T>> {
    return this._single<T>();
  }

  async maybeSingle(): Promise<DatabaseResponse<T | null>> {
    return this._maybeSingle<T>();
  }

  // Make the builder awaitable - returns DatabaseResponse when awaited
  then<TResult1 = DatabaseResponse<T[]>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute(): Promise<DatabaseResponse<T[]>> {
    try {
      // Build query string
      const params = new URLSearchParams();

      this.filters.forEach((value, key) => {
        params.append(key, String(value));
      });

      if (this.orderBy) {
        params.append('_sort', this.orderBy.column);
        params.append('_order', this.orderBy.order);
      }

      const queryString = params.toString();
      const url = `${this.baseUrl}/${this.table}${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      // Ensure data is an array
      let data = Array.isArray(rawData) ? rawData : [rawData];

      // Apply client-side filters
      data = this.applyClientFilters(data);

      return { data: data as T[], error: null };
    } catch (error) {
      return {
        data: null,
        error: this.normalizeError(error),
      };
    }
  }

  private applyClientFilters(data: unknown[]): unknown[] {
    let result = data;

    for (const filter of this.clientFilters) {
      if (filter.type === 'contains') {
        const { column, value } = filter.value as { column: string; value: unknown };
        result = result.filter((item: unknown) => {
          if (!this.isRecord(item)) return false;
          const itemValue = item[column];
          if (Array.isArray(itemValue)) {
            return itemValue.includes(value);
          }
          return false;
        });
      } else if (filter.type === 'overlaps') {
        const { column, values } = filter.value as { column: string; values: unknown[] };
        result = result.filter((item: unknown) => {
          if (!this.isRecord(item)) return false;
          const itemValue = item[column];
          if (Array.isArray(itemValue)) {
            // Check if there's any overlap between itemValue and values
            return itemValue.some((v) => values.includes(v));
          }
          return false;
        });
      } else if (filter.type === 'or') {
        const filterValue = filter.value;
        if (typeof filterValue === 'object' && filterValue !== null && 'column' in filterValue) {
          // IN operation
          const { column, values } = filterValue as { column: string; values: unknown[] };
          result = result.filter((item: unknown) => {
            if (!this.isRecord(item)) return false;
            return values.includes(item[column]);
          });
        }
        // OR query string not implemented - would require parsing
      }
    }

    return result;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

/**
 * JSON Server Insert Builder
 */
class JsonServerInsertBuilder<T> extends JsonServerBaseBuilder<T[]> implements InsertBuilder<T> {
  private selectColumns?: string;

  constructor(
    private readonly baseUrl: string,
    private readonly table: string,
    private readonly data: Partial<T> | Partial<T>[]
  ) {
    super();
  }

  select(columns?: string): InsertBuilder<T> {
    this.selectColumns = columns;
    return this;
  }

  async single(): Promise<DatabaseResponse<T>> {
    return this._single<T>();
  }

  // Make the builder awaitable - returns DatabaseResponse when awaited
  then<TResult1 = DatabaseResponse<T[]>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute(): Promise<DatabaseResponse<T[]>> {
    try {
      const url = `${this.baseUrl}/${this.table}`;
      const isArray = Array.isArray(this.data);

      if (isArray) {
        // Multiple inserts - send multiple requests
        const results = await Promise.all(
          (this.data).map((item) =>
            fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            }).then((res) => res.json())
          )
        );

        return { data: results as T[], error: null };
      } else {
        // Single insert
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { data: [data] as T[], error: null };
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Insert failed',
          code: '500',
        },
      };
    }
  }
}

/**
 * Shared logic for Update and Delete builders that use ID
 */
abstract class JsonServerIdBuilder<TData> extends JsonServerBaseBuilder<TData> {
  protected whereId?: string;

  constructor(
    protected readonly baseUrl: string,
    protected readonly table: string
  ) {
    super();
  }

  eq(column: string, value: unknown): this {
    if (column === 'id') {
      this.whereId = String(value);
    }
    return this;
  }

  in(): this {
    // json-server doesn't support batch delete/update with IN clause
    // This would require multiple requests which is not implemented
    throw new Error('JSON Server adapter does not support IN clause for delete/update operations');
  }
}

/**
 * JSON Server Update Builder
 */
class JsonServerUpdateBuilder<T> extends JsonServerIdBuilder<T[]> implements UpdateBuilder<T> {
  private selectColumns?: string;

  constructor(
    baseUrl: string,
    table: string,
    private readonly data: Partial<T>
  ) {
    super(baseUrl, table);
  }

  select(columns?: string): UpdateBuilder<T> {
    this.selectColumns = columns;
    return this;
  }

  async single(): Promise<DatabaseResponse<T>> {
    return this._single<T>();
  }

  // Make the builder awaitable - returns DatabaseResponse when awaited
  then<TResult1 = DatabaseResponse<T[]>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute(): Promise<DatabaseResponse<T[]>> {
    try {
      if (!this.whereId) {
        throw new Error('Update requires an ID (use .eq("id", value))');
      }

      const url = `${this.baseUrl}/${this.table}/${this.whereId}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data: [data] as T[], error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Update failed',
          code: '500',
        },
      };
    }
  }
}

/**
 * JSON Server Delete Builder
 */
class JsonServerDeleteBuilder extends JsonServerIdBuilder<void> implements DeleteBuilder {
  // Make the builder awaitable - returns DatabaseResponse when awaited
  then<TResult1 = DatabaseResponse<void>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResponse<void>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute(): Promise<DatabaseResponse<void>> {
    try {
      if (!this.whereId) {
        throw new Error('Delete requires an ID (use .eq("id", value))');
      }

      const url = `${this.baseUrl}/${this.table}/${this.whereId}`;

      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { data: null, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Delete failed',
          code: '500',
        },
      };
    }
  }
}
