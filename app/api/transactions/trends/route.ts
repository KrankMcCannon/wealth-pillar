/**
 * Server-side API Route for Transaction Spending Trends
 * Analyzes daily and category-based spending patterns
 */

import { APIError, ErrorCode, handleServerResponse, supabaseServer, validateUserContext, withErrorHandler } from '@/lib';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/transactions/trends
 * Query Parameters:
 * - userId (optional): Filter by specific user
 * - days (optional): Number of days to analyze (default: 30)
 *
 * Returns: {
 *   dailySpending: Record<string, number>,
 *   categorySpending: Record<string, number>,
 *   totalSpent: number,
 *   avgDailySpending: number,
 *   weeklyAverage: number
 * }
 */
async function getSpendingTrends(request: NextRequest) {
  const userContext = await validateUserContext();
  const searchParams = request.nextUrl.searchParams;

  const userId = searchParams.get('userId') || userContext.userId;
  const days = parseInt(searchParams.get('days') || '30', 10);

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Build query
  let query = supabaseServer
    .from('transactions')
    .select('type, amount, category, date')
    .eq('type', 'expense') // Only expenses for spending trends
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString());

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
      'Errore durante il recupero delle tendenze di spesa.',
      response.error
    );
  }

  const transactions = handleServerResponse<Array<{
    type: string;
    amount: number;
    category: string;
    date: string;
  }>>(response);

  // Calculate trends using single-pass O(n) algorithm
  const dailySpending: Record<string, number> = {};
  const categorySpending: Record<string, number> = {};
  let totalSpent = 0;

  for (const tx of transactions) {
    const dateKey = tx.date.split('T')[0]; // Get YYYY-MM-DD

    // Aggregate by date
    dailySpending[dateKey] = (dailySpending[dateKey] || 0) + tx.amount;

    // Aggregate by category
    categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;

    // Total
    totalSpent += tx.amount;
  }

  // Calculate averages
  const avgDailySpending = days > 0 ? totalSpent / days : 0;
  const weeklyAverage = avgDailySpending * 7;

  return NextResponse.json({
    data: {
      dailySpending,
      categorySpending,
      totalSpent: Math.round(totalSpent * 100) / 100, // Round to 2 decimals
      avgDailySpending: Math.round(avgDailySpending * 100) / 100,
      weeklyAverage: Math.round(weeklyAverage * 100) / 100,
    },
  });
}

export const GET = withErrorHandler(getSpendingTrends);
