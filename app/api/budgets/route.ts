/**
 * Server-side API Routes for Budgets
 * Follows SOLID and DRY principles with comprehensive validation and performance optimization
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  supabaseServer,
  handleServerResponse,
  validateUserContext,
  validateResourceAccess,
} from '@/lib/supabase-server';
import {
  withErrorHandler,
  APIError,
  ErrorCode,
  createMissingFieldError,
  createValidationError,
} from '@/lib/api-errors';
import type { Budget } from '@/lib/types';
import type { Database } from '@/lib/database.types';
import type { SupabaseInsertBuilder } from '@/lib/supabase-types';

/**
 * GET /api/budgets
 * Retrieve budgets with user filtering and analysis
 */
async function getBudgets(request: NextRequest) {
    const userContext = await validateUserContext();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || userContext.userId;
    const includeAnalysis = searchParams.get('includeAnalysis') === 'true';

    // Sorting options (removed pagination)
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // Validate resource access
    const hasAccess = await validateResourceAccess(userContext.userId, 'budget');
    if (!hasAccess) {
      throw new APIError(ErrorCode.PERMISSION_DENIED);
    }

    // Build query
    let query = supabaseServer
      .from('budgets')
      .select('*');

    // Apply user filtering based on permissions
    const isAdmin = userContext.role === 'admin' || userContext.role === 'superadmin';

    if (userContext.role === 'member') {
      // Members see only their own budgets
      query = query.eq('user_id', userContext.userId);
    } else if (isAdmin) {
      if (userId && userId !== userContext.userId) {
        // Specific user requested
        query = query.eq('user_id', userId);
      } else {
        // Default for admin: show all budgets from users in their group
        const adminUserResponse = await supabaseServer
          .from('users')
          .select('group_id')
          .eq('id', userContext.userId)
          .single();

        const adminGroupId = adminUserResponse.error ? null : (adminUserResponse.data as { group_id: string }).group_id;
        if (adminGroupId) {
          // Get all users in the same group and their budgets
          const groupUsersResponse = await supabaseServer
            .from('users')
            .select('id')
            .eq('group_id', adminGroupId);

          if (groupUsersResponse.data && groupUsersResponse.data.length > 0) {
            const groupUserIds = (groupUsersResponse.data as { id: string }[]).map(user => user.id);
            query = query.in('user_id', groupUserIds);
          } else {
            // Fallback: admin's own budgets
            query = query.eq('user_id', userContext.userId);
          }
        } else {
          // Fallback: admin's own budgets
          query = query.eq('user_id', userContext.userId);
        }
      }
    } else {
      // Fallback: own budgets
      query = query.eq('user_id', userContext.userId);
    }

    // Apply sorting (no pagination)
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const response = await query;
    let budgets: Budget[] = handleServerResponse(response);

    // Add analysis data if requested
    if (includeAnalysis) {
      budgets = await Promise.all(
        budgets.map(async (budget: Budget) => {
          const analysis = await getBudgetAnalysisData(budget.id, budget.user_id);
          return {
            ...budget,
            ...analysis,
          };
        })
      );
    }

    return NextResponse.json({ data: budgets });
}

/**
 * POST /api/budgets
 * Create a new budget with validation
 */
async function createBudget(request: NextRequest) {
    const userContext = await validateUserContext();

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['description', 'amount', 'type', 'categories'];
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      throw createMissingFieldError(missingFields);
    }

    // Validate amount is positive
    if (parseFloat(body.amount) <= 0) {
      throw createValidationError('amount', body.amount);
    }

    // Validate type
    if (!['monthly', 'annually'].includes(body.type)) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Il tipo di budget deve essere "monthly" o "annually".',
        { type: body.type }
      );
    }

    // Validate categories is array
    if (!Array.isArray(body.categories) || body.categories.length === 0) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Le categorie devono essere un array non vuoto.',
        { categories: body.categories }
      );
    }

    const budgetData: Database['public']['Tables']['budgets']['Insert'] = {
      description: body.description,
      amount: parseFloat(body.amount),
      type: body.type,
      icon: body.icon || null,
      categories: body.categories,
      user_id: body.user_id || userContext.userId,
      group_id: userContext.group_id,
    };

    const response = await (supabaseServer
      .from('budgets') as unknown as SupabaseInsertBuilder<
        Database['public']['Tables']['budgets']['Insert'],
        Database['public']['Tables']['budgets']['Row']
      >)
      .insert(budgetData)
      .select()
      .single();

    const budget = handleServerResponse(response);

    return NextResponse.json({ data: budget }, { status: 201 });
}

export const GET = withErrorHandler(getBudgets);
export const POST = withErrorHandler(createBudget);

/**
 * Helper function to get budget analysis data
 */
type BudgetRow = Database['public']['Tables']['budgets']['Row'];
type TxnForBudget = { amount: number; category: string };
type BudgetPeriod = { start_date: string; end_date: string | null };

async function getBudgetAnalysisData(budgetId: string, userId: string) {
  // Get budget details
  const budgetResponse = await supabaseServer
    .from('budgets')
    .select('*')
    .eq('id', budgetId)
    .single();

  const budget = handleServerResponse<BudgetRow>(budgetResponse);

  // Get current period (simplified - you might need to implement budget periods)
  const currentPeriod = await getCurrentBudgetPeriod(budgetId);

  if (!currentPeriod) {
    return {
      spent: 0,
      remaining: budget.amount,
      percentage: 0,
      status: 'no-period' as const,
      isOverBudget: false,
      daysRemaining: 0,
      categorySpending: {},
    };
  }

  // Get transactions for the period
  const transactionsResponse = await supabaseServer
    .from('transactions')
    .select('amount, category')
    .eq('type', 'expense')
    .eq('user_id', userId)
    .gte('date', (currentPeriod as BudgetPeriod).start_date)
    .lte('date', (currentPeriod as BudgetPeriod).end_date || new Date().toISOString())
    .in('category', budget.categories);

  const transactions = handleServerResponse<TxnForBudget[]>(transactionsResponse);

  // Calculate spending by category
  const categorySpending: Record<string, { spent: number; budgeted: number; remaining: number; percentage: number }> = {};
  const budgetPerCategory = budget.amount / budget.categories.length;

  budget.categories.forEach((category: string) => {
    const spent = transactions
      .filter((t: TxnForBudget) => t.category === category)
      .reduce((sum: number, t: TxnForBudget) => sum + t.amount, 0);

    const remaining = budgetPerCategory - spent;
    const percentage = budgetPerCategory > 0 ? (spent / budgetPerCategory) * 100 : 0;

    categorySpending[category] = {
      spent: Math.round(spent * 100) / 100,
      budgeted: budgetPerCategory,
      remaining: Math.round(remaining * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
    };
  });

  const totalSpent = Math.round(transactions.reduce((sum: number, t: TxnForBudget) => sum + t.amount, 0) * 100) / 100;
  const remainingBudget = Math.round((budget.amount - totalSpent) * 100) / 100;
  const isOverBudget = totalSpent > budget.amount;
  const percentage = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;

  // Calculate days remaining
  const endDate = new Date((currentPeriod as BudgetPeriod).end_date || new Date());
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Determine status
  let status: 'under_budget' | 'near_limit' | 'over_budget' = 'under_budget';
  if (isOverBudget) {
    status = 'over_budget';
  } else if (percentage > 80) {
    status = 'near_limit';
  }

  return {
    spent: totalSpent,
    remaining: remainingBudget,
    percentage: Math.round(percentage * 100) / 100,
    status,
    isOverBudget,
    daysRemaining,
    categorySpending,
    currentPeriod,
  };
}

/**
 * Helper function to get current budget period (simplified)
 */
async function getCurrentBudgetPeriod(budgetId: string) {
  const response = await supabaseServer
    .from('budget_periods')
    .select('*')
    .eq('budget_id', budgetId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  const periods = handleServerResponse<BudgetPeriod[]>(response);
  return periods.length > 0 ? periods[0] : null;
}
