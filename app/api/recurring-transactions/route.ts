/**
 * Server-side API Routes for Recurring Transactions
 * Follows SOLID and DRY principles with comprehensive validation and performance optimization
 */

import { APIError, createMissingFieldError, createValidationError, ErrorCode, withErrorHandler } from '@/src/lib/api';
import type { Database } from '@/src/lib/database';
import { applyUserFilter } from '@/src/lib/database/auth-filters';
import { handleServerResponse, supabaseServer, validateResourceAccess, validateUserContext } from '@/src/lib/database/supabase-server';
import { SupabaseInsertBuilder } from '@/src/lib/types/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Using shared SupabaseInsertBuilder from lib/supabase-types

/**
 * GET /api/recurring-transactions
 * Retrieve recurring transactions with filtering options
 */
async function getRecurringTransactions(request: NextRequest) {
    const userContext = await validateUserContext();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || userContext.userId;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const dueWithinDays = searchParams.get('dueWithinDays');
    const includeStats = searchParams.get('includeStats') === 'true';

    // Sorting options (removed pagination)
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // Validate resource access
    const hasAccess = await validateResourceAccess(userContext.userId, 'recurring_series');
    if (!hasAccess) {
      throw new APIError(ErrorCode.PERMISSION_DENIED);
    }

    // Build query
    let query = supabaseServer
      .from('recurring_transactions')
      .select('*');

    // Apply centralized role-based user filtering
    // Note: recurring_transactions table has no group_id; use per-user filtering strategy
    query = applyUserFilter(query, userContext, userId, { strategy: 'user' });

    // Apply filters
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (dueWithinDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + parseInt(dueWithinDays));
      query = query.lte('due_date', targetDate.toISOString());
    }

    // Apply pagination
    // Apply sorting (no pagination)
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const response = await query;
    const recurringSeries = handleServerResponse(response) as Array<Record<string, unknown>>;

    const result: { data: unknown; stats?: unknown } = { data: recurringSeries };

    // Add statistics if requested
    if (includeStats) {
      const stats = await getRecurringTransactionStats(userId);
      result.stats = stats;
    }

    return NextResponse.json(result);
}

/**
 * POST /api/recurring-transactions
 * Create a new recurring transaction series
 */
async function createRecurringTransaction(request: NextRequest) {
    const userContext = await validateUserContext();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['description', 'amount', 'type', 'category', 'frequency', 'account_id', 'start_date', 'due_date'];
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      throw createMissingFieldError(missingFields);
    }

    // Validate amount is positive
    if (parseFloat(body.amount) <= 0) {
      throw createValidationError('amount', body.amount);
    }

    // Validate type
    if (!['income', 'expense', 'transfer'].includes(body.type)) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Il tipo deve essere "income", "expense" o "transfer".',
        { type: body.type }
      );
    }

    // Validate frequency
    if (!['once', 'weekly', 'biweekly', 'monthly', 'yearly'].includes(body.frequency)) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'La frequenza deve essere valida.',
        { frequency: body.frequency }
      );
    }

    // Validate account access
    const hasAccountAccess = await validateResourceAccess(userContext.userId, 'account', body.account_id);
    if (!hasAccountAccess) {
      throw new APIError(ErrorCode.PERMISSION_DENIED);
    }

    const seriesData = {
      description: body.description,
      amount: parseFloat(body.amount),
      type: body.type,
      category: body.category,
      frequency: body.frequency,
      user_id: body.user_id || userContext.userId,
      account_id: body.account_id,
      start_date: body.start_date,
      end_date: body.end_date || null,
      due_date: body.due_date,
      is_active: body.is_active !== undefined ? body.is_active : true,
      total_executions: body.total_executions || 0,
      transaction_ids: Array.isArray(body.transaction_ids) ? body.transaction_ids : [],
    };

    const response = await (supabaseServer
      .from('recurring_transactions') as unknown as SupabaseInsertBuilder<
        Database['public']['Tables']['recurring_transactions']['Insert'],
        Database['public']['Tables']['recurring_transactions']['Row']
      >)
      .insert(seriesData)
      .select('*')
      .single();

    const series = handleServerResponse(response);

    return NextResponse.json({ data: series }, { status: 201 });
}

export const GET = withErrorHandler(getRecurringTransactions);
export const POST = withErrorHandler(createRecurringTransaction);

/**
 * Helper function to get recurring transaction statistics
 */
type RecurringRow = Database['public']['Tables']['recurring_transactions']['Row'];

async function getRecurringTransactionStats(userId?: string) {
  try {
    // Get active series
    let query = supabaseServer
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const response = await query;
    const series = handleServerResponse<RecurringRow[]>(response);

    type SeriesType = {
      amount: number;
      frequency: string;
      due_date?: string;
      type: 'income' | 'expense' | 'transfer';
    };

    const stats = {
      totalActiveSeries: series.length,
      totalExpenseSeries: series.filter((s: SeriesType) => s.type === 'expense').length,
      totalIncomeSeries: series.filter((s: SeriesType) => s.type === 'income').length,
      totalMonthlyImpact: series.reduce((sum: number, s: SeriesType) => {
        // Convert all frequencies to monthly equivalent
        let monthlyAmount = s.amount;
        switch (s.frequency) {
          case 'weekly':
            monthlyAmount = s.amount * 4.33; // Average weeks per month
            break;
          case 'biweekly':
            monthlyAmount = s.amount * 2.17; // Average biweeks per month
            break;
          case 'yearly':
            monthlyAmount = s.amount / 12;
            break;
          // monthly stays as is
        }
        // Somma positiva per income, negativa per expense, neutra per transfer
        if (s.type === 'income') return sum + monthlyAmount;
        if (s.type === 'expense') return sum - monthlyAmount;
        return sum; // transfer
      }, 0),
      averageAmount: series.length > 0 ? series.reduce((sum: number, s: SeriesType) => sum + s.amount, 0) / series.length : 0,
      nextDueDateSeries: series
        .filter((s: SeriesType) => s.due_date)
        .sort((a: SeriesType, b: SeriesType) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 3),
      overdueCount: 0,
      upcomingCount: 0,
    };

    // Calculate overdue and upcoming counts
    const now = new Date();
    series.forEach((s: SeriesType) => {
      if (s.due_date) {
        const dueDate = new Date(s.due_date);
        if (dueDate < now) {
          stats.overdueCount++;
        } else if (dueDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) { // Within 7 days
          stats.upcomingCount++;
        }
      }
    });

    return stats;

  } catch (error) {
    console.error('Error getting recurring transaction stats:', error);
    return {
      totalActiveSeries: 0,
      totalExpenseSeries: 0,
      totalIncomeSeries: 0,
      totalMonthlyImpact: 0,
      averageAmount: 0,
      nextDueDateSeries: [],
      overdueCount: 0,
      upcomingCount: 0,
    };
  }
}
