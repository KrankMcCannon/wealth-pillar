/**
 * Server-side API Route for Recurring Transactions Dashboard
 * Provides optimized dashboard view of recurring series with status categorization
 */

import { APIError, Database, ErrorCode, handleServerResponse, supabaseServer, validateUserContext, withErrorHandler } from '@/src/lib';
import { NextRequest, NextResponse } from 'next/server';

type RecurringSeries = Database['public']['Tables']['recurring_transactions']['Row'];

/**
 * GET /api/recurring-transactions/dashboard
 * Query Parameters:
 * - userId (optional): Filter by specific user
 *
 * Returns: {
 *   activeSeries: RecurringSeries[],
 *   upcomingSeries: RecurringSeries[],
 *   overdueSeries: RecurringSeries[],
 *   monthlyImpact: { income: number, expenses: number, net: number }
 * }
 */
async function getRecurringDashboard(request: NextRequest) {
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
      'Errore durante il recupero del dashboard delle transazioni ricorrenti.',
      response.error
    );
  }

  const allSeries = handleServerResponse<RecurringSeries[]>(response);

  // Categorize series by status
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const activeSeries: RecurringSeries[] = [];
  const upcomingSeries: RecurringSeries[] = [];
  const overdueSeries: RecurringSeries[] = [];

  // Calculate monthly impact
  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  for (const series of allSeries) {
    // Add to active list
    activeSeries.push(series);

    // Calculate monthly equivalent for impact
    let monthlyAmount = series.amount;
    switch (series.frequency) {
      case 'weekly':
        monthlyAmount = series.amount * 4.33; // Average weeks per month
        break;
      case 'biweekly':
        monthlyAmount = series.amount * 2.17; // Average biweeks per month
        break;
      case 'yearly':
        monthlyAmount = series.amount / 12;
        break;
      case 'monthly':
      case 'once':
      default:
        // monthly or once stays as is
        break;
    }

    // Accumulate impact
    if (series.type === 'income') {
      monthlyIncome += monthlyAmount;
    } else if (series.type === 'expense') {
      monthlyExpenses += monthlyAmount;
    }

    // Categorize by due date
    if (series.due_date) {
      const dueDate = new Date(series.due_date);

      if (dueDate < now) {
        overdueSeries.push(series);
      } else if (dueDate <= sevenDaysFromNow) {
        upcomingSeries.push(series);
      }
    }
  }

  const net = monthlyIncome - monthlyExpenses;

  return NextResponse.json({
    data: {
      activeSeries,
      upcomingSeries,
      overdueSeries,
      monthlyImpact: {
        income: Math.round(monthlyIncome * 100) / 100,
        expenses: Math.round(monthlyExpenses * 100) / 100,
        net: Math.round(net * 100) / 100,
      },
    },
  });
}

export const GET = withErrorHandler(getRecurringDashboard);
