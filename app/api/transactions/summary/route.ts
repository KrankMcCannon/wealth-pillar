/**
 * Server-side API Route for Transaction Financial Summary
 * Aggregates financial data: income, expenses, transfers, and spending by category
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  supabaseServer,
  handleServerResponse,
  validateUserContext,
} from '@/lib/supabase-server';
import {
  withErrorHandler,
  APIError,
  ErrorCode,
} from '@/lib/api-errors';

/**
 * GET /api/transactions/summary
 * Query Parameters:
 * - userId (optional): Filter by specific user
 * - startDate (optional): Start date for date range
 * - endDate (optional): End date for date range
 *
 * Returns: {
 *   totalIncome: number,
 *   totalExpenses: number,
 *   totalTransfers: number,
 *   netIncome: number,
 *   expensesByCategory: Record<string, number>
 * }
 */
async function getTransactionSummary(request: NextRequest) {
  const userContext = await validateUserContext();
  const searchParams = request.nextUrl.searchParams;

  const userId = searchParams.get('userId') || userContext.userId;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Build query
  let query = supabaseServer
    .from('transactions')
    .select('type, amount, category');

  // Apply user filtering based on role
  if (userContext.role === 'member') {
    query = query.eq('user_id', userContext.userId);
  } else if (userId && userId !== userContext.userId) {
    // Admin/superadmin can query other users
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('user_id', userContext.userId);
  }

  // Apply date range filters
  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const response = await query;

  if (response.error) {
    throw new APIError(
      ErrorCode.DB_QUERY_ERROR,
      'Errore durante il recupero del riepilogo transazioni.',
      response.error
    );
  }

  const transactions = handleServerResponse<Array<{
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    category: string;
  }>>(response);

  // Calculate summary using single-pass O(n) algorithm
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalTransfers = 0;
  const expensesByCategory: Record<string, number> = {};

  for (const tx of transactions) {
    switch (tx.type) {
      case 'income':
        totalIncome += tx.amount;
        break;
      case 'expense':
        totalExpenses += tx.amount;
        // Aggregate by category
        expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.amount;
        break;
      case 'transfer':
        totalTransfers += tx.amount;
        break;
    }
  }

  const netIncome = totalIncome - totalExpenses;

  return NextResponse.json({
    data: {
      totalIncome,
      totalExpenses,
      totalTransfers,
      netIncome,
      expensesByCategory,
    },
  });
}

export const GET = withErrorHandler(getTransactionSummary);
