/**
 * Server-side API Route for Missed Recurring Executions
 * Identifies recurring series with missed payment opportunities
 */

import { APIError, ErrorCode, withErrorHandler } from '@/src/lib/api';
import type { Database } from '@/src/lib/database';
import { handleServerResponse, supabaseServer, validateUserContext } from '@/src/lib/database/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

type RecurringSeries = Database['public']['Tables']['recurring_transactions']['Row'];

/**
 * GET /api/recurring-transactions/missed
 * Query Parameters:
 * - userId (optional): Filter by specific user
 *
 * Returns: Array<{ series: RecurringSeries, missedCount: number }>
 */
async function getMissedExecutions(request: NextRequest) {
  const userContext = await validateUserContext();
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId') || userContext.userId;

  // Build query for active series
  let query = supabaseServer
    .from('recurring_transactions')
    .select('*')
    .eq('is_active', true);

  // Apply user filtering based on role
  if (userContext.role === 'member') {
    query = query.eq('user_id', userContext.userId);
  } else if (userId && userId !== userContext.userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('user_id', userContext.userId);
  }

  const response = await query;

  if (response.error) {
    throw new APIError(
      ErrorCode.DB_QUERY_ERROR,
      'Errore durante il recupero delle esecuzioni mancate.',
      response.error
    );
  }

  const allSeries = handleServerResponse<RecurringSeries[]>(response);

  // Calculate expected vs actual executions
  const now = new Date();
  const missedSeriesList: Array<{ series: RecurringSeries; missedCount: number }> = [];

  for (const series of allSeries) {
    const startDate = new Date(series.start_date);
    const endDate = series.end_date ? new Date(series.end_date) : now;
    const actualExecutions = series.total_executions || 0;

    // Calculate expected executions based on frequency
    let expectedExecutions = 0;
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

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
        expectedExecutions = Math.floor(daysDiff / 30); // Approximate
        break;
      case 'yearly':
        expectedExecutions = Math.floor(daysDiff / 365);
        break;
      default:
        expectedExecutions = 0;
    }

    // Calculate missed count
    const missedCount = Math.max(0, expectedExecutions - actualExecutions);

    // Only include series with missed executions
    if (missedCount > 0) {
      missedSeriesList.push({
        series,
        missedCount,
      });
    }
  }

  // Sort by missed count descending (most missed first)
  missedSeriesList.sort((a, b) => b.missedCount - a.missedCount);

  return NextResponse.json({
    data: missedSeriesList,
  });
}

export const GET = withErrorHandler(getMissedExecutions);
