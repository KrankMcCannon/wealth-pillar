/**
 * Server-side Supabase client with enhanced security
 * This client runs only on the server and has access to service role keys
 */
import { createClient } from '@supabase/supabase-js';
import { auth, currentUser } from '@clerk/nextjs/server';
import type { Database } from './database.types';

// Server-side client with service role (full access)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for server client');
}

export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Enhanced error handling for server operations
 */
export class ServerDatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ServerDatabaseError';
  }
}

/**
 * Server-side database response handler
 */
export function handleServerResponse<T>(response: {
  data: T | null;
  error: unknown;
}): T {
  if (response.error) {
    const error = response.error as { message?: string; code?: string; details?: unknown };
    throw new ServerDatabaseError(
      error.message || 'Database operation failed',
      error.code || 'UNKNOWN_ERROR',
      error.details
    );
  }

  if (response.data === null) {
    throw new ServerDatabaseError(
      'No data returned from database',
      'NO_DATA_ERROR'
    );
  }

  return response.data;
}

/**
 * Validate user authentication and get user context
 */
export async function validateUserContext(): Promise<{
  userId: string;
  email: string;
  role: string;
}> {
  // Prefer Clerk session from request cookies (no need for explicit Bearer)
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new ServerDatabaseError('Authentication required', 'AUTH_ERROR');
  }

  // Get user details from database mapped by Clerk ID
  const userResponse = (await supabaseServer
    .from('users')
    .select('id, email, role')
    .eq('clerk_id', clerkUserId)
    .single()) as { data: { id: string; email: string; role: string } | null; error: unknown };

  if (!userResponse.error && userResponse.data) {
    return {
      userId: userResponse.data.id,
      email: userResponse.data.email,
      role: userResponse.data.role,
    };
  }

  // Try map by email if clerk_id is not present yet
  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress;
  if (email) {
    const byEmail = (await supabaseServer
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single()) as { data: { id: string; email: string; role: string } | null; error: unknown };
    if (byEmail.data) {
      return {
        userId: byEmail.data.id,
        email: byEmail.data.email,
        role: byEmail.data.role,
      };
    }
  }

  // Fallback: not provisioned yet
  return {
    userId: clerkUserId,
    email: email || '',
    role: 'member',
  };
}

/**
 * Validate user permissions for resource access
 */
export async function validateResourceAccess(
  userId: string,
  resourceType: 'transaction' | 'budget' | 'account' | 'recurring_series',
  resourceId?: string,
  requiredRole?: 'superadmin' | 'admin' | 'member'
): Promise<boolean> {
  // Get user details
  const userResponse = (await supabaseServer
    .from('users')
    .select('role, group_id')
    .eq('id', userId)
    .single()) as { data: { role: 'superadmin' | 'admin' | 'member'; group_id: string } | null; error: unknown };

  const role = userResponse.data?.role ?? 'member';
  const group_id = userResponse.data?.group_id;

  // Check role hierarchy: superadmin > admin > member
  if (requiredRole) {
    const roleHierarchy = { superadmin: 3, admin: 2, member: 1 };
    if (roleHierarchy[role as keyof typeof roleHierarchy] < roleHierarchy[requiredRole]) {
      return false;
    }
  }

  // If no specific resource, user has access to their group data
  if (!resourceId) {
    return true;
  }

  // Resource-specific access validation
  switch (resourceType) {
    case 'transaction':
      const transactionResponse = (await supabaseServer
        .from('transactions')
        .select('user_id, group_id')
        .eq('id', resourceId)
        .single()) as { data: { user_id: string; group_id: string } | null; error: unknown };

      if (transactionResponse.error || !transactionResponse.data) return false;

      return transactionResponse.data.user_id === userId ||
             (!!group_id && transactionResponse.data.group_id === group_id);

    case 'budget':
      const budgetResponse = (await supabaseServer
        .from('budgets')
        .select('user_id')
        .eq('id', resourceId)
        .single()) as { data: { user_id: string } | null; error: unknown };

      if (budgetResponse.error || !budgetResponse.data) return false;
      return budgetResponse.data.user_id === userId;

    case 'account':
      const accountResponse = (await supabaseServer
        .from('accounts')
        .select('user_ids, group_id')
        .eq('id', resourceId)
        .single()) as { data: { user_ids: string[]; group_id: string } | null; error: unknown };

      if (accountResponse.error || !accountResponse.data) return false;

      return accountResponse.data.user_ids.includes(userId) ||
             (!!group_id && accountResponse.data.group_id === group_id);

    case 'recurring_series':
      const recurringResponse = (await supabaseServer
        .from('recurring_transactions')
        .select('user_id, group_id')
        .eq('id', resourceId)
        .single()) as { data: { user_id: string; group_id: string } | null; error: unknown };

      if (recurringResponse.error || !recurringResponse.data) return false;

      return recurringResponse.data.user_id === userId ||
             (!!group_id && recurringResponse.data.group_id === group_id);

    default:
      return false;
  }
}

/**
 * Server-side pagination helper
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

type PaginatableQuery = {
  range: (from: number, to: number) => PaginatableQuery;
  order: (column: string, options: { ascending: boolean }) => PaginatableQuery;
};

export function applyPagination<Q extends PaginatableQuery>(
  query: Q,
  options: PaginationOptions = {}
): Q {
  const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc' } = options;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return query
    .range(from, to)
    .order(sortBy, { ascending: sortOrder === 'asc' }) as Q;
}

/**
 * Server-side date filtering helper
 */
export interface DateFilterOptions {
  startDate?: string;
  endDate?: string;
  dateField?: string;
}

type DateFilterableQuery = {
  gte: (column: string, value: string) => DateFilterableQuery;
  lte: (column: string, value: string) => DateFilterableQuery;
};

export function applyDateFilter<Q>(
  query: Q & DateFilterableQuery,
  options: DateFilterOptions = {}
): Q {
  const { startDate, endDate, dateField = 'date' } = options;

  let result = query as unknown as DateFilterableQuery;
  if (startDate) {
    result = result.gte(dateField, startDate);
  }

  if (endDate) {
    result = result.lte(dateField, endDate);
  }

  return result as unknown as Q;
}
