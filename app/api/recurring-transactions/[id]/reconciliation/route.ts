/**
 * Server-side API Route for Recurring Transaction Reconciliation
 * Compares expected vs actual executions for a specific series
 */

import { APIError, ErrorCode, withErrorHandler } from '@/src/lib/api';
import type { Database } from '@/src/lib/database';
import { handleServerResponse, supabaseServer, validateResourceAccess, validateUserContext } from '@/src/lib/database/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext<T = Record<string, string>> = {
  params: Promise<T>;
};

type RecurringSeries = Database['public']['Tables']['recurring_transactions']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

/**
 * GET /api/recurring-transactions/[id]/reconciliation
 * Returns comprehensive reconciliation data comparing expected vs actual executions
 */
async function getSeriesReconciliation(
  _request: NextRequest,
  { params }: RouteContext<{ id: string }>
) {
  const userContext = await validateUserContext();
  const { id: seriesId } = await params;

  // Validate series access
  const hasAccess = await validateResourceAccess(userContext.userId, 'recurring_series', seriesId);
  if (!hasAccess) {
    throw new APIError(ErrorCode.PERMISSION_DENIED);
  }

  // Fetch recurring series
  const seriesResponse = await supabaseServer
    .from('recurring_transactions')
    .select('*')
    .eq('id', seriesId)
    .single();

  const series = handleServerResponse<RecurringSeries>(seriesResponse);

  // If no direct link, fetch by matching criteria
  let transactionQuery = supabaseServer
    .from('transactions')
    .select('*')
    .eq('user_id', series.user_id)
    .eq('account_id', series.account_id)
    .eq('type', series.type)
    .eq('category', series.category)
    .gte('date', series.start_date);

  if (series.end_date) {
    transactionQuery = transactionQuery.lte('date', series.end_date);
  }

  const txResponse = await transactionQuery;
  const transactions = handleServerResponse<Transaction[]>(txResponse);

  // Calculate expected executions
  const startDate = new Date(series.start_date);
  const endDate = series.end_date ? new Date(series.end_date) : new Date();
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  let expectedExecutions = 0;

  switch (series.frequency) {
    case 'once':
      expectedExecutions = 1;
      break;
    case 'weekly':
      expectedExecutions = Math.floor(daysDiff / 7);
      break;
    case 'biweekly':
      expectedExecutions = Math.floor(daysDiff / 14);
      break;
    case 'monthly':
      expectedExecutions = Math.floor(daysDiff / 30);
      break;
    case 'yearly':
      expectedExecutions = Math.floor(daysDiff / 365);
      break;
    default:
      expectedExecutions = 0;
  }

  // Calculate actuals
  const actualExecutions = transactions.length;
  const totalPaid = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const expectedTotal = expectedExecutions * series.amount;
  const difference = expectedTotal - totalPaid;
  const missedPayments = Math.max(0, expectedExecutions - actualExecutions);
  const successRate = expectedExecutions > 0 ? (actualExecutions / expectedExecutions) * 100 : 0;

  return NextResponse.json({
    data: {
      series,
      transactions,
      summary: {
        expectedExecutions,
        actualExecutions,
        missedPayments,
        totalPaid: Math.round(totalPaid * 100) / 100,
        expectedTotal: Math.round(expectedTotal * 100) / 100,
        difference: Math.round(difference * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
      },
    },
  });
}

export const GET = withErrorHandler(getSeriesReconciliation);
