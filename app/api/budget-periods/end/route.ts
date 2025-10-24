import { supabaseServer, validateUserContext } from '@/src/lib/database/supabase-server';
import { APIError, Database, ErrorCode, withErrorHandler } from '@/src/lib';
import { SupabaseUpdateBuilder } from '@/src/lib/types/supabase';
import { NextRequest, NextResponse } from 'next/server';

type Period = {
  id: string;
  user_id?: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  total_saved?: number;
  total_spent?: number;
};

async function endBudgetPeriod(request: NextRequest) {
    const { userId: callerId, role } = await validateUserContext();

    const body = await request.json().catch(() => ({}));
    const targetUserId: string | undefined = body.userId || body.user_id;
    const endDateRaw: string | undefined = body.endDate || body.end_date;

    if (!targetUserId) {
      throw new APIError(
        ErrorCode.MISSING_FIELDS,
        'Il campo userId è obbligatorio.',
        { missingFields: ['userId'] }
      );
    }

    // Basic permission: allow self, or admins
    const isSelf = callerId === targetUserId;
    const isAdmin = role === 'admin' || role === 'superadmin';
    if (!isSelf && !isAdmin) {
      throw new APIError(ErrorCode.PERMISSION_DENIED);
    }

    // Load user and budget periods
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, budget_periods')
      .eq('id', targetUserId)
      .single();

    if (userError || !userData) {
      throw new APIError(ErrorCode.USER_NOT_FOUND);
    }

    const user = userData as Pick<Database['public']['Tables']['users']['Row'], 'id' | 'budget_periods'>;
    const periods: Period[] = Array.isArray(user.budget_periods) ? (user.budget_periods as Period[]) : [];

    const activeIdx = periods.findIndex(p => p.is_active);
    if (activeIdx === -1) {
      // No active period; nothing to close
      return NextResponse.json({ data: null }, { status: 200 });
    }

    // Normalize end date: default now; if provided, ensure ISO string and include full day
    let endDate: string = new Date().toISOString();
    if (endDateRaw) {
      const parsed = new Date(endDateRaw);
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(23, 59, 59, 999);
        endDate = parsed.toISOString();
      }
    }

    // Compute totals for the closing period
    const period = periods[activeIdx];
    const periodStart = new Date(period.start_date);
    const periodEnd = new Date(endDate);

    // Helper utils
    const isValidDate = (d: Date) => !isNaN(d.getTime());
    const withinRange = (d: Date) => d >= periodStart && d <= periodEnd;
    type BudgetRow = Pick<Database['public']['Tables']['budgets']['Row'], 'id' | 'amount' | 'categories' | 'user_id'>;
    type TransactionRow = Pick<Database['public']['Tables']['transactions']['Row'], 'id' | 'user_id' | 'type' | 'amount' | 'category' | 'date' | 'account_id' | 'to_account_id'>;

    const isTransferLike = (t: TransactionRow) =>
      t.type === 'transfer' || t.category === 'trasferimento' || !!t.to_account_id;

    // Fetch budgets and transactions for user
    const [
      { data: budgetsData, error: budgetsError },
      { data: txData, error: txError }
    ] = await Promise.all([
      supabaseServer
        .from('budgets')
        .select('id, amount, categories, user_id')
        .eq('user_id', targetUserId),
      supabaseServer
        .from('transactions')
        .select('id, user_id, type, amount, category, date, account_id, to_account_id')
        .eq('user_id', targetUserId),
    ]);

    if (budgetsError) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante il recupero dei budget.',
        budgetsError
      );
    }
    if (txError) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante il recupero delle transazioni.',
        txError
      );
    }

    const budgets = (budgetsData || []) as BudgetRow[];
    const transactions = ((txData || []) as TransactionRow[])
      .filter((t) => isValidDate(new Date(t.date)) && withinRange(new Date(t.date)) && !isTransferLike(t));

    // Calculate totals per budget and aggregated category spending
    const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);

    let totalSpent = 0;
    for (const b of budgets) {
      const relevant = transactions.filter(t => (t.type === 'expense' || t.type === 'income') && b.categories.includes(t.category));
      const spentForBudget = relevant.reduce((sum, t) => {
        if (t.type === 'expense') return sum + (t.amount || 0);
        if (t.type === 'income') return sum - (t.amount || 0);
        return sum;
      }, 0);
      totalSpent += spentForBudget;
    }

    totalSpent = Math.round(totalSpent * 100) / 100;
    const totalSaved = Math.max(0, Math.round((totalBudget - totalSpent) * 100) / 100);

    const updated: Period = {
      ...period,
      is_active: false,
      end_date: endDate,
      total_spent: totalSpent,
      total_saved: totalSaved,
      updated_at: new Date().toISOString(),
    };

    const nextPeriods = [...periods];
    nextPeriods[activeIdx] = updated;

    const updatePayload: Database['public']['Tables']['users']['Update'] = {
      budget_periods: nextPeriods as unknown,
    };
    const updateResponse = await (supabaseServer
      .from('users') as unknown as SupabaseUpdateBuilder<
        Database['public']['Tables']['users']['Update'],
        Database['public']['Tables']['users']['Row']
      >)
      .update(updatePayload)
      .eq('id', targetUserId)
      .single();

    if (updateResponse.error) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante l\'aggiornamento dei periodi di budget.',
        updateResponse.error
      );
    }

    // Return updated period with user id
    return NextResponse.json({ data: { ...updated, user_id: targetUserId } });
}

export const POST = withErrorHandler(endBudgetPeriod);
