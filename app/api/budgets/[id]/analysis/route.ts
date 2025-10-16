/**
 * Server-side API Route for Budget Analysis
 * Provides detailed budget breakdown with current period metrics
 */
import {
  APIError,
  ErrorCode,
  withErrorHandler,
} from '@/lib/api-errors';
import type { Database } from '@/lib/database.types';
import {
  handleServerResponse,
  supabaseServer,
  validateResourceAccess,
  validateUserContext,
} from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext<T = Record<string, string>> = {
  params: Promise<T>;
};

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetPeriod = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  total_spent: number;
  total_saved: number;
  category_spending: Record<string, number>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
type Transaction = {
  amount: number;
  category: string;
  date: string;
};

/**
 * GET /api/budgets/[id]/analysis
 * Returns comprehensive budget analysis with spending breakdown
 */
async function getBudgetAnalysis(
  _request: NextRequest,
  { params }: RouteContext<{ id: string }>
) {
  const userContext = await validateUserContext();
  const { id: budgetId } = await params;

  // Validate budget access
  const hasAccess = await validateResourceAccess(userContext.userId, 'budget', budgetId);
  if (!hasAccess) {
    throw new APIError(ErrorCode.PERMISSION_DENIED);
  }

  // Fetch budget
  const budgetResponse = await supabaseServer
    .from('budgets')
    .select('*')
    .eq('id', budgetId)
    .single();

  const budget = handleServerResponse<Budget>(budgetResponse);

  // Get current user's budget periods
  const userResponse = await supabaseServer
    .from('users')
    .select('budget_periods')
    .eq('id', budget.user_id)
    .single();

  const user = handleServerResponse<{ budget_periods: BudgetPeriod[] }>(userResponse);

  // Find current active period
  const currentPeriod = user.budget_periods?.find((p: BudgetPeriod) => p.is_active) || null;

  // Fetch transactions for budget period
  let transactionQuery = supabaseServer
    .from('transactions')
    .select('amount, category, date')
    .eq('user_id', budget.user_id)
    .eq('type', 'expense');

  if (currentPeriod) {
    transactionQuery = transactionQuery
      .gte('date', currentPeriod.start_date)
      .lte('date', currentPeriod.end_date);
  }

  const transactionsResponse = await transactionQuery;
  const transactions = handleServerResponse<Transaction[]>(transactionsResponse);

  // Calculate category spending using Map for O(1) lookup
  const categoryMap = new Map<string, number>();
  for (const tx of transactions) {
    categoryMap.set(tx.category, (categoryMap.get(tx.category) || 0) + tx.amount);
  }

  // Build category spending breakdown
  const categorySpending: Record<string, {
    spent: number;
    percentage: number;
  }> = {};

  let totalSpent = 0;

  for (const category of budget.categories) {
    const spent = categoryMap.get(category) || 0;
    totalSpent += spent;

    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    categorySpending[category] = {
      spent: Math.round(spent * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  const totalBudgeted = budget.amount;
  const remainingBudget = Math.max(0, totalBudgeted - totalSpent);
  const isOverBudget = totalSpent > totalBudgeted;

  // Calculate days remaining in period
  let daysRemaining = 0;
  if (currentPeriod && currentPeriod.end_date) {
    const endDate = new Date(currentPeriod.end_date);
    const now = new Date();
    daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return NextResponse.json({
    data: {
      budget,
      currentPeriod,
      categorySpending,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalBudgeted: Math.round(totalBudgeted * 100) / 100,
      remainingBudget: Math.round(remainingBudget * 100) / 100,
      isOverBudget,
      daysRemaining,
    },
  });
}

export const GET = withErrorHandler(getBudgetAnalysis);
