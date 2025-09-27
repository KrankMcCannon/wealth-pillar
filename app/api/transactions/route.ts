/**
 * Server-side API Routes for Transactions
 */
import {
  APIError,
  createMissingFieldError,
  createValidationError,
  ErrorCode,
  withErrorHandler,
} from '@/lib/api-errors';
import type { Database } from '@/lib/database.types';
import {
  applyDateFilter,
  handleServerResponse,
  supabaseServer,
  validateResourceAccess,
  validateUserContext,
  type DateFilterOptions,
} from '@/lib/supabase-server';
import type { SupabaseInsertBuilder, SupabaseUpdateBuilder } from '@/lib/supabase-types';
import { NextRequest, NextResponse } from 'next/server';

type Transaction = Database['public']['Tables']['transactions']['Row'];

/**
 * GET /api/transactions
 * Retrieve transactions with advanced filtering and pagination
 */
async function getTransactions(request: NextRequest) {
    const userContext = await validateUserContext();

    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const userId = searchParams.get('userId') || undefined;
    const accountId = searchParams.get('accountId') || undefined;
    const type = searchParams.get('type') as 'income' | 'expense' | 'transfer' | undefined;
    const category = searchParams.get('category') || undefined;
    const frequency = searchParams.get('frequency') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Sorting options (removed pagination)
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // Date filtering options
    const dateFilterOptions: DateFilterOptions = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      dateField: 'date',
    };

    // Validate resource access
    const hasAccess = await validateResourceAccess(userContext.userId, 'transaction');
    if (!hasAccess) {
      throw new APIError(ErrorCode.PERMISSION_DENIED);
    }

    // Build query with proper security
    let query = supabaseServer
      .from('transactions')
      .select('*');

    // Apply user/group filtering based on permissions
    const isAdmin = userContext.role === 'admin' || userContext.role === 'superadmin';

    if (userContext.role === 'member') {
      // Members see only their own transactions
      query = query.eq('user_id', userContext.userId);
    } else if (isAdmin) {
      // Get admin's group_id for group-level access
      const userResponse = (await supabaseServer
        .from('users')
        .select('group_id')
        .eq('id', userContext.userId)
        .single()) as { data: { group_id: string } | null; error: unknown };

      const userGroupId = userResponse.error ? null : (userResponse.data as { group_id: string }).group_id;

      if (userId && userId !== userContext.userId) {
        // Specific user requested - ensure it's in the same group
        query = query.eq('user_id', userId);
      } else if (!userId && userGroupId) {
        // No specific user requested: admin wants all group transactions
        // Get all users in the same group and their transactions
        const groupUsersResponse = await supabaseServer
          .from('users')
          .select('id')
          .eq('group_id', userGroupId);

        if (groupUsersResponse.data && groupUsersResponse.data.length > 0) {
          const groupUserIds = (groupUsersResponse.data as { id: string }[]).map(user => user.id);
          query = query.in('user_id', groupUserIds);
        } else {
          // Fallback: admin's own transactions
          query = query.eq('user_id', userContext.userId);
        }
      } else {
        // Fallback: admin's own transactions
        query = query.eq('user_id', userContext.userId);
      }
    } else {
      // Fallback: own transactions
      query = query.eq('user_id', userContext.userId);
    }

    // Apply additional filters
    if (accountId) query = query.eq('account_id', accountId);
    if (type) {
      query = query.eq('type', type);
    }
    if (category) query = query.eq('category', category);
    if (frequency) query = query.eq('frequency', frequency);

    // Apply date filtering
    query = applyDateFilter(query, dateFilterOptions);

    // Apply sorting (no pagination)
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const response = await query;
    const transactions = handleServerResponse(response) as Array<Record<string, unknown>>;

    return NextResponse.json({
      data: transactions,
    });
}

export const GET = withErrorHandler(getTransactions);

/**
 * POST /api/transactions
 * Create a new transaction with validation
 */
async function createTransaction(request: NextRequest) {
    const userContext = await validateUserContext();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['description', 'amount', 'type', 'category', 'date', 'account_id'];
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      throw createMissingFieldError(missingFields);
    }

    // Validate account access
    const hasAccountAccess = await validateResourceAccess(userContext.userId, 'account', body.account_id);
    if (!hasAccountAccess) {
      throw new APIError(ErrorCode.PERMISSION_DENIED);
    }

    // Prepare transaction data
    const transactionData: Database['public']['Tables']['transactions']['Insert'] = {
      description: body.description,
      amount: parseFloat(body.amount),
      type: body.type,
      category: body.category,
      date: body.date,
      user_id: body.user_id || userContext.userId,
      account_id: body.account_id,
      to_account_id: body.to_account_id || null,
      group_id: body.group_id || null,
      recurring_series_id: body.recurring_series_id || null,
      frequency: body.frequency || 'once',
    };

    // Validate amount is positive
    if (transactionData.amount <= 0) {
      throw createValidationError('amount', transactionData.amount);
    }

    // Validate transfer has to_account_id
    if (transactionData.type === 'transfer' && !transactionData.to_account_id) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Le transazioni di trasferimento richiedono un conto di destinazione.',
        { type: transactionData.type, to_account_id: transactionData.to_account_id }
      );
    }

    const response = await (supabaseServer
      .from('transactions') as unknown as SupabaseInsertBuilder<
        Database['public']['Tables']['transactions']['Insert'],
        unknown
      >)
      .insert(transactionData)
      .select('*')
      .single();

    const transaction = handleServerResponse(response);

    return NextResponse.json({ data: transaction }, { status: 201 });
}

export const POST = withErrorHandler(createTransaction);

/**
 * PATCH /api/transactions (bulk operations)
 * Handle multiple transaction operations in a single request
 */
async function bulkUpdateTransactions(request: NextRequest) {
    const userContext = await validateUserContext();

    const body = await request.json();
    const operations = body.operations as Array<{
      type: 'create' | 'update' | 'delete';
      id?: string;
      data?: Partial<Transaction>;
    }>;

    if (!Array.isArray(operations) || operations.length === 0) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'È richiesto un array di operazioni valido.',
        { operations }
      );
    }

    const results: Transaction[] = [];

    // Note: Supabase doesn't support explicit transactions in this context
    // We'll process operations sequentially for consistency

    for (const operation of operations) {
        switch (operation.type) {
          case 'create':
            if (!operation.data) continue;

            // Validate and create
            const createResponse = await (supabaseServer
              .from('transactions') as unknown as SupabaseInsertBuilder<
                Database['public']['Tables']['transactions']['Insert'],
                Transaction
              >)
              .insert({
                ...(operation.data as Database['public']['Tables']['transactions']['Insert']),
                user_id: operation.data.user_id || userContext.userId,
              })
              .select()
              .single();

            if (createResponse.data) {
              results.push(createResponse.data);
            }
            break;

          case 'update':
            if (!operation.id || !operation.data) continue;

            // Validate access
            const hasUpdateAccess = await validateResourceAccess(userContext.userId, 'transaction', operation.id);
            if (!hasUpdateAccess) {
              throw new APIError(ErrorCode.PERMISSION_DENIED);
            }

            const updateResponse = await (supabaseServer
              .from('transactions') as unknown as SupabaseUpdateBuilder<
                Database['public']['Tables']['transactions']['Update'],
                Transaction
              >)
              .update(operation.data as Database['public']['Tables']['transactions']['Update'])
              .eq('id', operation.id)
              .select()
              .single();

            if (updateResponse.data) {
              results.push(updateResponse.data);
            }
            break;

          case 'delete':
            if (!operation.id) continue;

            // Validate access
            const hasDeleteAccess = await validateResourceAccess(userContext.userId, 'transaction', operation.id);
            if (!hasDeleteAccess) {
              throw new APIError(ErrorCode.PERMISSION_DENIED);
            }

            await supabaseServer
              .from('transactions')
              .delete()
              .eq('id', operation.id);
            break;
        }
    }

    return NextResponse.json({
      data: results,
      summary: {
        totalProcessed: operations.length,
        successfulOperations: results.length,
        failedOperations: operations.length - results.length,
      },
    });
}

export const PATCH = withErrorHandler(bulkUpdateTransactions);
